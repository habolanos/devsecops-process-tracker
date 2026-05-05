# Plan: Colaboración Multi-Usuario con Compatibilidad BPMN

**Estado:** Planificado  
**Fecha de análisis:** 2026-05-04  
**Versión base:** 2.1.7

---

## 1. Estado Actual del Sistema

### Limitaciones actuales
- **Single-user**: estado del proceso vive en Zustand + localStorage (solo cliente)
- **Sin persistencia de servidor**: no hay base de datos relacional
- **Sin autenticación real**: solo perfil local con avatar (no identidad verificada)
- **Sin sincronización**: no hay mecanismo de tiempo real entre instancias

### Assets existentes aprovechables
- `next-auth` ya está en `package.json` (no activo aún)
- API Routes de Next.js (`/api/*`) ya existe la estructura
- YAML `dependencies[]` ya modela secuencia → mapeo directo a BPMN `<sequenceFlow>`
- `phases` → mapeo a BPMN `<lane>` en `<laneSet>`
- `tasks` → `<userTask>` BPMN
- `completionAlert` → `<boundaryEvent>` BPMN

---

## 2. Mapeo BPMN 2.0

El YAML actual se alinea directamente con el estándar BPMN 2.0:

```
YAML actual                     BPMN 2.0
─────────────────────────────────────────────────────
process.id                  →   <process id="...">
phases[]                    →   <laneSet> / <lane>
tasks[].type: standard      →   <userTask>
tasks[].type: check         →   <userTask> + <exclusiveGateway>
tasks[].type: multicheck    →   <userTask> + <inclusiveGateway>
tasks[].type: form          →   <userTask> (dataInputAssociation)
tasks[].dependencies[]      →   <sequenceFlow sourceRef targetRef>
completionAlert (warning)   →   <exclusiveGateway> + condición
completionAlert (critical)  →   <boundaryEvent errorCode>
variables[]                 →   <dataObject> / <property>
outputVars[]                →   <dataOutputAssociation>
```

**Adiciones BPMN requeridas:**
- `<participant>` → usuario colaborador
- `<collaboration>` → instancia de proceso compartido
- `<messageFlow>` → notificaciones entre participantes
- `<token>` implícito → posición actual del proceso (qué fase/tarea está activa)

---

## 3. Modelo de Datos

### Entidades nuevas (Prisma schema)

```prisma
model ProcessInstance {
  id                  String               @id @default(uuid())
  definitionId        String               // = process.id del YAML
  shareCode           String               @unique // 6-char slug para compartir
  status              InstanceStatus       @default(ACTIVE)
  ownerId             String
  variables           Json                 // valores de variables del proceso
  bpmnCorrelationKey  String?              // ID de correlación BPMN
  createdAt           DateTime             @default(now())
  updatedAt           DateTime             @updatedAt
  participants        ProcessParticipant[]
  tasks               TaskInstance[]
  events              ProcessEvent[]
}

model ProcessParticipant {
  id              String          @id @default(uuid())
  instanceId      String
  userId          String
  role            ParticipantRole @default(COLLABORATOR)
  laneAssignment  String[]        // qué phases le asignan
  joinedAt        DateTime        @default(now())
  instance        ProcessInstance @relation(fields: [instanceId], references: [id])
}

model TaskInstance {
  id               String       @id @default(uuid())
  instanceId       String
  taskDefinitionId String       // = task.id del YAML
  phaseId          String
  status           TaskStatus   @default(PENDING)
  assigneeId       String?      // quien reclamó
  version          Int          @default(0) // optimistic locking
  claimedAt        DateTime?
  completedAt      DateTime?
  evidenceData     Json?
  formData         Json?
  completedBy      String?
  instance         ProcessInstance @relation(fields: [instanceId], references: [id])
}

model ProcessEvent {
  id         String          @id @default(uuid())
  instanceId String
  type       ProcessEventType
  actorId    String
  taskId     String?
  payload    Json
  timestamp  DateTime        @default(now())
  instance   ProcessInstance @relation(fields: [instanceId], references: [id])
}

enum InstanceStatus  { PENDING ACTIVE COMPLETED SUSPENDED CANCELLED }
enum ParticipantRole { OWNER COLLABORATOR OBSERVER }
enum TaskStatus      { PENDING ACTIVE CLAIMED IN_PROGRESS COMPLETED SKIPPED BLOCKED }
enum ProcessEventType {
  TASK_CLAIMED TASK_RELEASED TASK_COMPLETED
  PARTICIPANT_JOINED PARTICIPANT_LEFT
  PROCESS_STARTED PROCESS_SUSPENDED VARIABLE_UPDATED
}
```

---

## 4. Arquitectura de Tiempo Real

### Opción recomendada: Pusher Channels (managed WebSockets)

```
Cliente A ──┐                          ┌── Cliente B
            ├── POST /api/tasks/claim ──┤
            │                          │
            ├── Pusher Channel ─────────┤  push events
            │   "presence-{shareCode}" │
            └──────────────────────────┘
                        ↑
                   Next.js API
                   + Prisma DB
```

**Comparativa de alternativas:**

| Opción | Pros | Contras |
|---|---|---|
| **Pusher** ✅ | Managed, free tier 200k msgs/día, SDK Next.js | Costo en escala |
| Socket.io | Control total | Requiere custom server (rompe Vercel) |
| Vercel KV + SSE | 100% Vercel-native | SSE es unidireccional |
| PartyKit | Cloudflare-native, CRDT | Menos maduro |

### Eventos en tiempo real

```typescript
// Canal presence: "presence-process-{shareCode}"
// (presence channel = ve quién está conectado)

task:claimed        { taskId, userId, userName }
task:released       { taskId, userId }
task:completed      { taskId, userId, evidenceData }
task:progress       { taskId, userId, partialData }
participant:joined  { userId, userName, role }
participant:left    { userId }
variable:updated    { key, value, userId }
process:suspended   { reason, userId }
```

---

## 5. Flujo de Colaboración

```
1. OWNER crea instancia de proceso
   → POST /api/instances  { definitionId, variables }
   → Genera shareCode "XK7-M2P"
   → Retorna URL: /process/XK7-M2P

2. OWNER comparte URL / código con colaboradores

3. COLLABORATOR abre /process/XK7-M2P
   → Si no autenticado → login (NextAuth)
   → POST /api/instances/{shareCode}/join
   → Se agrega como ProcessParticipant
   → Pusher event: participant:joined

4. Ambos ven el proceso en tiempo real
   → GET /api/instances/{shareCode} → estado completo
   → Suscripción a canal Pusher

5. Usuario reclama tarea disponible (BPMN: task activation)
   → POST /api/tasks/{taskId}/claim
   → Optimistic locking: solo un usuario puede tenerla "claimed"
   → Si ya está claimed → 409 Conflict
   → Pusher broadcast: task:claimed

6. Usuario completa la tarea con evidencia
   → POST /api/tasks/{taskId}/complete  { evidenceData, formData }
   → Servidor actualiza TaskInstance + desbloquea dependientes
   → Motor BPMN: evalúa dependencies[] → activa próximas tareas
   → Pusher broadcast: task:completed

7. Conflict resolution
   → Task liberada si usuario se desconecta > 5 min (heartbeat)
   → Owner puede reasignar/liberar cualquier tarea
```

---

## 6. BPMN XML Export

```xml
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL">
  <collaboration id="collab-{shareCode}">
    <participant id="pool-main" processRef="proc-{definitionId}"/>
  </collaboration>

  <process id="proc-{definitionId}" isExecutable="true">
    <laneSet>
      <lane id="lane-{phase.id}" name="{phase.name}">
        <flowNodeRef>task-{task.id}</flowNodeRef>
      </lane>
    </laneSet>

    <!-- userTask por cada tarea YAML -->
    <userTask id="task-{id}" name="{task.name}">
      <humanPerformer>
        <resourceAssignmentExpression>
          <formalExpression>{assigneeId}</formalExpression>
        </resourceAssignmentExpression>
      </humanPerformer>
    </userTask>

    <!-- Gateway para completionAlert -->
    <exclusiveGateway id="gw-{taskId}-alert" gatewayDirection="Diverging"/>

    <!-- Sequence flows desde dependencies[] -->
    <sequenceFlow id="sf-{dep}-{taskId}"
                  sourceRef="{dep}" targetRef="{taskId}"/>
  </process>
</definitions>
```

**Librerías:**
- `bpmn-moddle` — parse/generate BPMN XML
- `bpmn-js` — visualización del diagrama en UI

---

## 7. Plan de Sprints

### Sprint 1 — Backend Foundation (3–5 días)
- [ ] Configurar Prisma + schema completo
- [ ] Activar NextAuth.js (Email magic link + Google OAuth)
- [ ] API routes: `POST /api/instances`, `GET /api/instances/[shareCode]`, `POST /api/instances/[shareCode]/join`
- [ ] Middleware de autenticación en rutas colaborativas
- [ ] Unit tests del schema + API routes

### Sprint 2 — Task Coordination (3–4 días)
- [ ] `POST /api/tasks/[taskId]/claim` con optimistic locking
- [ ] `POST /api/tasks/[taskId]/release` + heartbeat timeout (5 min)
- [ ] `POST /api/tasks/[taskId]/complete` con BPMN token propagation
- [ ] Motor de dependencias: al completar tarea → desbloquear dependientes
- [ ] Tests de concurrencia (claim simultáneo → 409)

### Sprint 3 — Real-time Pusher (2–3 días)
- [ ] Setup Pusher + SDK Next.js
- [ ] Presence channels (`presence-process-{shareCode}`)
- [ ] Hook `useProcessSync` en cliente
- [ ] Zustand store adaptado: modo colaborativo vs. solo

### Sprint 4 — UI de Colaboración (4–5 días)
- [ ] Indicadores de presencia (avatares flotantes por tarea)
- [ ] Badge "Reclamar" / "En progreso por [usuario]" / "Completada por [usuario]"
- [ ] Panel lateral de participantes con actividad en tiempo real
- [ ] Share dialog: QR code + URL + código corto
- [ ] Role management (owner reasigna/bloquea tareas)

### Sprint 5 — BPMN Export + Visualización (3–4 días)
- [ ] `bpmn-moddle` para generación XML desde YAML
- [ ] `bpmn-js` para render del diagrama
- [ ] Export de instancia como BPMN 2.0 XML
- [ ] Audit trail UI (ProcessEvent log)

### Sprint 6 — Hardening (2–3 días)
- [ ] Migración a PostgreSQL (Neon o Supabase free tier)
- [ ] Rate limiting en API routes
- [ ] Cleanup instancias expiradas (cron job)
- [ ] E2E tests Playwright para flujo colaborativo

---

## 8. Dependencias a Agregar

```json
{
  "dependencies": {
    "@prisma/client": "^6.x",
    "pusher": "^5.x",
    "pusher-js": "^8.x",
    "bpmn-moddle": "^9.x",
    "bpmn-js": "^17.x",
    "qrcode.react": "^4.x"
  },
  "devDependencies": {
    "prisma": "^6.x"
  }
}
```

> `next-auth` ya está en `package.json`, solo necesita activarse.

---

## 9. Variables de Entorno Nuevas

```env
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
PUSHER_APP_ID=...
PUSHER_KEY=...
PUSHER_SECRET=...
PUSHER_CLUSTER=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...
```

---

## 10. Seguridad

- **Autenticación**: toda acción colaborativa requiere JWT válido (NextAuth session)
- **Autorización**: solo participantes del `shareCode` pueden actuar sobre la instancia
- **Optimistic locking**: campo `version` en `TaskInstance` → evita double-claim
- **Rate limiting**: máx 10 claims/min por usuario
- **Expiración**: instancias sin actividad > 30 días → archivadas
- **Datos sensibles**: variables de proceso cifradas en reposo (AES-256)

---

## 11. Impacto sobre el Código Existente

| Área | Impacto | Acción |
|---|---|---|
| `package.json` | Nuevas deps | Agregar Prisma, Pusher, bpmn-moddle |
| YAML schema | Extensión opcional | Agregar `laneAssignment`, `bpmnElementType` opcionales |
| Zustand store | Refactor | Modo local vs. modo colaborativo |
| UI | Nuevo | Presencia, share dialog, BPMN viewer |
| API routes | Nuevo | `/api/instances`, `/api/tasks`, `/api/participants` |
| Tests | Actualizar | Unit + E2E para flujos colaborativos |
| README | Actualizar | Arquitectura nueva + setup variables env |
