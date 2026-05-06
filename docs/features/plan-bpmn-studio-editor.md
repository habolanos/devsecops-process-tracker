# Plan: BPMN-JS Studio Editor → Generador YAML

**Estado:** Planificado  
**Fecha de análisis:** 2026-05-06  
**Versión base:** 2.1.7

---

## 1. Contexto y Gap Analysis

### Estado actual
El proyecto tiene un **executor** de procesos (carga YAML, ejecuta tareas, captura evidencia). No tiene herramienta de **diseño/autoría** de procesos. Hoy el flujo es:

```
Humano escribe YAML a mano → validate:processes → app carga YAML
```

### Estado objetivo
```
BPMN Editor (visual) ←→ YAML ←→ Executor
       ↑                           ↑
  Upload/Paste XML            Carga directa
```

**El gap principal:** transformación bidireccional entre BPMN 2.0 XML y el schema YAML propietario del proyecto.

---

## 2. Análisis de bpmn-js

### Capacidades del ecosistema

| Librería | Rol | Licencia |
|---|---|---|
| `bpmn-js` | Modeler + Viewer | MIT |
| `bpmn-js-properties-panel` | Panel propiedades customizable | MIT |
| `bpmn-moddle` | Parse/generate BPMN XML | MIT |
| `bpmn-js-token-simulation` | Simular ejecución de tokens | MIT |
| `diagram-js` | Engine de diagramas (base) | MIT |
| `bpmn-js-color-picker` | Paleta de colores por elemento | MIT |

### APIs clave

```typescript
// Importar XML al editor
await modeler.importXML(bpmnXml);

// Exportar XML desde editor
const { xml } = await modeler.saveXML({ format: true });

// Exportar SVG
const { svg } = await modeler.saveSVG();

// Acceder al modelo
const elementRegistry = modeler.get('elementRegistry');
const modeling        = modeler.get('modeling');
const canvas          = modeler.get('canvas');
```

---

## 3. Mapeo de Transformación Bidireccional

### BPMN → YAML

```
BPMN 2.0 Element                    YAML Schema (process.schema.json)
────────────────────────────────────────────────────────────────────
<process id name>                →  process.id, process.name
<documentation>                  →  process.description
<laneSet><lane name>             →  phases[].id, phases[].name
<lane><documentation>            →  phases[].description
Lane position (order by y-axis)  →  phases[].order
<userTask> in lane               →  tasks[].id, tasks[].name
<documentation> on task          →  tasks[].description
<userTask extensionElements>     →  tasks[].type, tasks[].evidence, tasks[].checkItems
<sequenceFlow sourceRef>         →  tasks[].dependencies[]
<exclusiveGateway> + condFlow    →  completionAlert (warning/critical)
<boundaryEvent errorCode>        →  completionAlert.severity: critical
<dataObject name>                →  process.variables[].key
<dataObject dataType>            →  process.variables[].type
<dataOutputAssociation>          →  tasks[].outputVars[]
<humanPerformer expression>      →  tasks[].assignee (nuevo campo)
```

### YAML → BPMN (round-trip)

```
process.id/name/version         →  <process id name> + <documentation>
variables[]                     →  <dataObject> + <dataStore>
phases[] (order)                →  <laneSet><lane> ordenados verticalmente
phases[].tasks[]                →  <userTask> dentro de <lane>
tasks[].dependencies[]          →  <sequenceFlow> (con startEvent implícito)
tasks[].type: check             →  <userTask> + <exclusiveGateway>
tasks[].type: multicheck        →  <userTask> + <inclusiveGateway>
tasks[].type: form              →  <userTask dataInputAssociation>
tasks[].type: dynamic-list      →  <userTask> + <dataObject isCollection>
completionAlert (warning)       →  <exclusiveGateway> diverging
completionAlert (critical)      →  <boundaryEvent> errorBoundary
outputVars[]                    →  <dataOutputAssociation>
```

### Datos sin equivalente BPMN nativo → `extensionElements`

```xml
<userTask id="task-1">
  <extensionElements>
    <yaml:taskConfig xmlns:yaml="http://devsecops-tracker/schema">
      <yaml:type>multicheck</yaml:type>
      <yaml:evidence type="both" required="true"/>
      <yaml:checkItems>
        <yaml:item id="ci-1" description="Item 1" required="true"/>
      </yaml:checkItems>
    </yaml:taskConfig>
  </extensionElements>
</userTask>
```

---

### 3.4 Elementos Faltantes en el Mapeo Inicial

El schema `process.schema.json` v1.2.0 contiene estructuras no cubiertas en las tablas anteriores. Esta sección los documenta con su equivalente BPMN.

#### 3.4.1 Jerarquía Proceso → Fase → Actividad → Tarea

El schema soporta **tres niveles** de anidamiento bajo una fase, no solo dos:

```
Process
└── phases[]           → <process> + <laneSet>
    └── Phase
        ├── tasks[]    → <userTask> directamente en <lane>   (nivel 2)
        └── activities[]  → sub-<lane> o <subProcess>        (nivel 3)
            └── Activity
                ├── tasks[]
                ├── dynamicLinks[]
                └── images[]
```

**BPMN generado para `Activity`:**

```xml
<!-- Opción A: Activity como sub-lane dentro del lane de la fase -->
<lane id="lane-{phase.id}-{activity.id}"
      name="{phase.name} / {activity.name}"
      parentRef="lane-{phase.id}">
  <flowNodeRef>task-{task.id}</flowNodeRef>
</lane>

<!-- Opción B (recomendada para claridad): Activity como subProcess colapsado -->
<subProcess id="sub-{activity.id}" name="{activity.name}"
            trisotech:collapsed="true">
  <extensionElements>
    <yaml:activityConfig>
      <yaml:phaseId>{phase.id}</yaml:phaseId>
      <yaml:order>{activity.order}</yaml:order>
    </yaml:activityConfig>
  </extensionElements>
  <!-- tasks del activity como userTasks dentro del subProcess -->
</subProcess>
```

#### 3.4.2 DynamicLink — Presente en Fase, Actividad y Tarea

```yaml
# YAML — presente en phases[].dynamicLinks, activities[].dynamicLinks, tasks[].dynamicLinks
dynamicLinks:
  - label: "GitHub Repository"
    urlTemplate: "https://github.com/{organization}/{repository}"
    behavior: "auto"      # auto | click
    delay: 2              # segundos antes de activar (solo behavior:auto)
    newTab: true
    requiresVariables: ["organization", "repository"]
```

**BPMN → `extensionElements`:**

```xml
<extensionElements>
  <yaml:dynamicLinks>
    <yaml:link label="GitHub Repository"
               urlTemplate="https://github.com/{organization}/{repository}"
               behavior="auto"
               delay="2"
               newTab="true">
      <yaml:requiresVariable>organization</yaml:requiresVariable>
      <yaml:requiresVariable>repository</yaml:requiresVariable>
    </yaml:link>
  </yaml:dynamicLinks>
</extensionElements>
```

**Nota de transformación inversa:** Al importar BPMN externo sin este namespace, los `dynamicLinks` se pierden. El editor debe advertir al usuario si detecta `<documentation>` con URLs y sugerir convertirlos a `dynamicLinks`.

#### 3.4.3 ActivityImage — Solo en `Activity`

```yaml
images:
  - id: "img-arquitectura-cloud"
    name: "Diagrama Arquitectura Cloud"
    url: "/images/arch-cloud-v2.png"    # uri-reference
    caption: "Arquitectura propuesta para el ambiente multi-cloud"
```

**Sin equivalente BPMN nativo** — se almacena en `extensionElements` del `<subProcess>` o `<lane>`:

```xml
<extensionElements>
  <yaml:images>
    <yaml:image id="img-arquitectura-cloud"
                name="Diagrama Arquitectura Cloud"
                url="/images/arch-cloud-v2.png"
                caption="Arquitectura propuesta..."/>
  </yaml:images>
</extensionElements>
```

**En el editor:** las imágenes aparecen como un attachment icon (📎) en el elemento BPMN. Al hacer click se abre un panel lateral mostrando la imagen con caption.

#### 3.4.4 Task.references[] — Links de documentación

```yaml
references:
  - label: "NPM Audit Docs"
    url: "https://docs.npmjs.com/cli/v8/commands/npm-audit"
  - label: "SonarQube Docs"
    url: "https://docs.sonarqube.org/latest/"
```

**BPMN → `<documentation>`** (estándar BPMN 2.0, no requiere extensión):

```xml
<userTask id="task-1-2" name="Revisar Dependencias">
  <documentation>
    REF:NPM Audit Docs:https://docs.npmjs.com/cli/v8/commands/npm-audit
    REF:SonarQube Docs:https://docs.sonarqube.org/latest/
  </documentation>
</userTask>
```

**Transformación inversa:** Parser detecta líneas con prefijo `REF:` en `<documentation>` → genera `references[]`.

#### 3.4.5 Process.subprocesses[] — Procesos embebidos externos

```yaml
subprocesses:
  - id: "sub-onboarding"
    name: "Onboarding de Ambiente"
    order: 1
    source:
      type: "github"          # github | url | local
      url: "https://raw.githubusercontent.com/org/repo/main/onboarding.yaml"
      ref: "main"
    variables:
      ambiente: "{vars.proveedorCloud}"
    optional: true
```

**BPMN → `<callActivity>`** (estándar BPMN 2.0):

```xml
<callActivity id="call-sub-onboarding"
              name="Onboarding de Ambiente"
              calledElement="proc-onboarding">
  <extensionElements>
    <yaml:subprocessSource type="github"
                           url="https://raw.githubusercontent.com/..."
                           ref="main"/>
    <yaml:optional>true</yaml:optional>
  </extensionElements>
  <dataInputAssociation>
    <sourceRef>proveedorCloud</sourceRef>
    <targetRef>ambiente</targetRef>
  </dataInputAssociation>
</callActivity>
```

**En el editor:** Los `callActivity` tienen una paleta propia "Subproceso Externo" con un selector de fuente (GitHub URL / URL directa / local). El editor muestra un badge con el tipo de fuente (`GH`, `URL`, `LOCAL`).

#### 3.4.6 ProcessVariable — Tipos Completos

El schema define tres tipos con restricciones propias:

| Tipo | Campos adicionales | Constraint |
|---|---|---|
| `text` | `placeholder`, `defaultValue` | — |
| `number` | `placeholder`, `defaultValue` | — |
| `select` | `options[]` ó `optionsFrom` (exclusivos) | Si `type: select` → DEBE tener `options` o `optionsFrom` |

**`optionsFrom`** es una clave de `capturedVariable` (generada por `outputVar` de una tarea previa) que contiene `string[]` para poblar las opciones dinámicamente en tiempo de ejecución.

**BPMN → `<dataObject>`:**

```xml
<!-- Variable tipo select con opciones estáticas -->
<dataObject id="var-environment" name="environment" itemSubjectRef="item-environment"/>
<itemDefinition id="item-environment" structureRef="xsd:string"/>
<extensionElements>
  <yaml:variable type="select" required="true" label="Ambiente de Despliegue">
    <yaml:option>development</yaml:option>
    <yaml:option>staging</yaml:option>
    <yaml:option>production</yaml:option>
  </yaml:variable>
</extensionElements>

<!-- Variable tipo select con opciones dinámicas (optionsFrom) -->
<dataObject id="var-componenteSeleccionado" name="componenteSeleccionado"/>
<extensionElements>
  <yaml:variable type="select" optionsFrom="componentesDisponibles"/>
</extensionElements>
```

#### 3.4.7 Restricción del Tipo Duration

El campo `estimatedTime` en `process` y `task` acepta **exclusivamente horas, minutos y segundos**. El patrón es `^(\d+(?:\.\d+)?[hms])+$`.

```yaml
estimatedTime: "1h30m"    ✅ válido
estimatedTime: "45m"      ✅ válido
estimatedTime: "1.5h"     ✅ válido
estimatedTime: "65d"      ❌ inválido — 'd' (días) NO está soportado
```

**Implicación para el editor BPMN:** Los `<timerEventDefinition>` con duración en días (`P9D` BPMN ISO 8601) deben convertirse a horas al generar YAML (`P9D → 216h`), o bien omitir `estimatedTime` si el proceso es multi-día (como `gestion-ambientes.yaml`).

#### 3.4.8 CompletionAlert — Schema Real vs. Propuestas del Plan

El schema actual define exactamente estos campos:

```typescript
CompletionAlert {
  severity?:     'info' | 'warning' | 'critical'   // default: 'info'
  title?:        string
  description:   string   // REQUERIDO
  confirmLabel?: string
  cancelLabel?:  string
}
```

> **Importante:** Los campos `returnTargetRef` y `cancellationReason` mencionados en la sección 4.8 del plan **no existen en el schema actual**. Son **propuestas de extensión** que deben añadirse al schema en un sprint de extensión del YAML. En el `extensionElements` BPMN se pueden almacenar anticipadamente; el YAML solo los usará una vez que el schema se actualice.

---

### 3.5 Catálogo Completo de 8 Tipos de Tarea — Mapeo BPMN

| YAML `type` | Config requerida | BPMN Element | Notas BPMN |
|---|---|---|---|
| `standard` | ninguna | `<userTask>` | Tipo por defecto |
| `check` | `checkItem: {description, required}` | `<userTask>` + `<exclusiveGateway>` si `completionAlert` | Un solo check item; gateway generado si tiene `completionAlert` |
| `multicheck` | `checkItems: [{id, description, required}]` | `<subProcess>` + `<inclusiveGateway>` converging | SubProcess colapsable con OR join |
| `form` | `formConfig: {layout, fields[]}` | `<userTask>` + `<dataInputAssociation>` por campo | 10 tipos de campo: text/number/email/date/time/datetime/boolean/textarea/image/select |
| `dynamic-list` | `listConfig: {label, placeholder, minItems, maxItems, allowDuplicates, separators[], trimItems}` | `<userTask>` + `<dataObject isCollection="true">` | `separators` es array; genera `outputVars` si se define `listData` |
| `detail-list` | `detailConfig: {sourceTaskId, placeholder, maxLength}` | `<userTask>` + `<dataInputAssociation sourceRef>` | Depende de una `dynamic-list` previa; `sourceTaskId` genera una `<dataAssociation>` |
| `detail-table` | `detailTableConfig: {sourceTaskId\|sourceVar, columns[]}` | `<userTask>` + table en `extensionElements` | `columns[].type`: boolean/text/number/date/list/computed-text; `computed-text` usa `{item}`, `{vars.xxx}`; labels soportan `#CELL#` syntax |
| `export-excel` | `exportConfig: {templatePath, outputFilename, autoDownload, inherit, mappings}` | `<serviceTask>` (no humano) | El único tipo que NO es `<userTask>` — es automatizado |

**Representación BPMN del `export-excel`:**

```xml
<!-- export-excel es automático → serviceTask, no userTask -->
<serviceTask id="task-7-export" name="Generar Reporte Excel"
             implementation="##WebService">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:type>export-excel</yaml:type>
      <yaml:exportConfig templatePath="/templates/TEMPLATE.xlsx"
                         outputFilename="Reporte_{today:DDMMYYYY}.xlsx"
                         autoDownload="true"
                         inherit="false"/>
    </yaml:taskConfig>
  </extensionElements>
</serviceTask>
```

**Representación BPMN del `form` con `formConfig`:**

```xml
<userTask id="task-3-2-estimacion" name="Estimar Costos Cloud">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:type>form</yaml:type>
      <yaml:formConfig>
        <yaml:layout type="grid" columns="2"/>
        <yaml:field id="costoEstimadoMin" label="Costo Mín (USD/mes)"
                    type="number" required="true"/>
        <yaml:field id="costoEstimadoMax" label="Costo Máx (USD/mes)"
                    type="number" required="true"/>
        <yaml:field id="proveedorCloud" label="Proveedor Cloud"
                    type="text" required="true"/>
        <yaml:field id="descripcionArquitectura" label="Descripción"
                    type="textarea" required="true" colSpan="2"/>
      </yaml:formConfig>
    </yaml:taskConfig>
  </extensionElements>
  <!-- outputVars generados desde campos del form -->
  <dataOutputAssociation>
    <sourceRef>formData.costoEstimadoMin</sourceRef>
    <targetRef>var-costoEstimadoMin</targetRef>
  </dataOutputAssociation>
</userTask>
```

**Representación BPMN del `detail-table`:**

```xml
<userTask id="task-1-2a-validacion" name="Validación PR y Deuda Técnica">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:type>detail-table</yaml:type>
      <yaml:detailTableConfig sourceTaskId="task-1-2">
        <!-- label "#H46#" = leer valor de celda H46 del template Excel -->
        <yaml:column id="integracionMaster" label="#H46#"
                     type="boolean" required="false"/>
        <yaml:column id="urlRepo" label="#L46#"
                     type="computed-text"
                     template="{vars.repositoryUrl}/{item}" required="false"/>
      </yaml:detailTableConfig>
    </yaml:taskConfig>
  </extensionElements>
  <!-- sourceTaskId genera dataAssociation implícita -->
  <dataInputAssociation>
    <sourceRef>task-1-2.listData</sourceRef>
  </dataInputAssociation>
</userTask>
```

---

## 4. Diseño Detallado de Gateways

Los gateways son el componente más crítico de la transformación, ya que en YAML son implícitos dentro de tareas (`completionAlert`, `type: check`) mientras que en BPMN son elementos explícitos y estructurados. Este capítulo describe cada tipo, su renderizado y su transformación.

---

### 4.1 ExclusiveGateway (XOR) — `completionAlert` warning/info

**Caso de uso YAML:** Tarea con `completionAlert.severity: warning` o `info`. Representa una decisión donde el usuario elige "Confirmar / Revisar" antes de continuar.

**Estructura BPMN generada:**

```xml
<!-- Tarea original -->
<userTask id="task-5-2-confirmacion-doc" name="Confirmar Completitud de Documentación">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:type>check</yaml:type>
      <yaml:completionAlert severity="warning"
        title="Validación de Documentación"
        confirmLabel="Sí, cumple — Avanzar a Fase 6"
        cancelLabel="No cumple — Regresar a Fase 4"/>
    </yaml:taskConfig>
  </extensionElements>
</userTask>

<!-- Gateway XOR generado automáticamente -->
<exclusiveGateway id="gw-task-5-2-decision"
                  name="¿Documentación completa?"
                  gatewayDirection="Diverging"/>

<!-- Flujo positivo (confirmLabel) -->
<sequenceFlow id="sf-task-5-2-yes"
              sourceRef="gw-task-5-2-decision"
              targetRef="task-6-1-siguiente">
  <conditionExpression xsi:type="tFormalExpression">
    ${documentacionCompleta == true}
  </conditionExpression>
</sequenceFlow>

<!-- Flujo negativo (cancelLabel) — regresa a tarea/fase anterior -->
<sequenceFlow id="sf-task-5-2-no"
              sourceRef="gw-task-5-2-decision"
              targetRef="task-4-1-retorno">
  <conditionExpression xsi:type="tFormalExpression">
    ${documentacionCompleta == false}
  </conditionExpression>
</sequenceFlow>
```

**Representación visual en el editor:**

```
[task-5-2] ──→ ◇XOR "¿Doc completa?"
                  ├── [Sí] ──────────→ [task-6-1]
                  └── [No] ──────────→ [task-4-1] (flecha hacia atrás, color naranja)
```

**Transformación BPMN → YAML (inversa):**

```typescript
// Si se detecta un exclusiveGateway inmediatamente después de un userTask:
// 1. El gateway se elimina del YAML (es implícito)
// 2. La condición negativa genera el campo completionAlert en la tarea
// 3. Las etiquetas de los sequenceFlow se mapean a confirmLabel/cancelLabel

function extractGatewayToAlert(gateway: BpmnElement, task: BpmnElement): CompletionAlert {
  const outgoing = gateway.outgoing; // sequenceFlows salientes
  const positiveFlow = outgoing.find(f => isPositiveCondition(f));
  const negativeFlow = outgoing.find(f => isNegativeCondition(f));

  return {
    severity: 'warning',
    title: gateway.name ?? `Confirmar: ${task.name}`,
    description: gateway.documentation ?? '',
    confirmLabel: positiveFlow?.name ?? 'Confirmar',
    cancelLabel: negativeFlow?.name ?? 'Cancelar'
  };
}
```

---

### 4.2 BoundaryEvent (Error) — `completionAlert` critical

**Caso de uso YAML:** Tarea con `completionAlert.severity: critical`. Representa un punto de NO retorno: si se rechaza, el proceso **termina o se cancela** (ej: rechazo de presupuesto FinOps).

**Estructura BPMN generada:**

```xml
<!-- Tarea original -->
<userTask id="task-6-2-autorizar-despliegue" name="Autorizar Presupuesto">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:completionAlert severity="critical"
        title="Autorización de Presupuesto"
        confirmLabel="Autorizar — Avanzar"
        cancelLabel="Rechazar solicitud"/>
    </yaml:taskConfig>
  </extensionElements>
</userTask>

<!-- BoundaryEvent de error adjunto a la tarea -->
<boundaryEvent id="be-task-6-2-reject"
               name="Presupuesto Rechazado"
               attachedToRef="task-6-2-autorizar-despliegue"
               cancelActivity="true">
  <errorEventDefinition id="err-budget-rejected"
                         errorRef="error-critical-rejection"/>
</boundaryEvent>

<!-- Error definido a nivel de proceso -->
<error id="error-critical-rejection"
       name="CriticalRejection"
       errorCode="PROCESS_REJECTED"/>

<!-- Flujo desde boundary hacia End Event de terminación -->
<sequenceFlow id="sf-reject-end"
              sourceRef="be-task-6-2-reject"
              targetRef="end-process-cancelled"/>

<endEvent id="end-process-cancelled" name="Proceso Cancelado">
  <terminateEventDefinition/>
</endEvent>
```

**Representación visual en el editor:**

```
[task-6-2] ──→ ◇ "¿Autorizar?"
                  ├── [Autorizar] ──→ [task-7-1]
                  └── [Rechazar]  ──→ ⊛ "Proceso Cancelado" (end event rojo)
           ⊙ (boundary error) ─────→ ⊛ "Proceso Cancelado"
```

**Colores en el renderer:**
- `critical` boundary event → borde rojo, icono `⚡`
- End event de terminación → fondo rojo
- Secuencia negativa → línea roja discontinua

---

### 4.3 InclusiveGateway (OR) — `type: multicheck`

**Caso de uso YAML:** Tareas de tipo `multicheck` donde múltiples condiciones deben evaluarse antes de avanzar. Cada `checkItem.required: true` es una condición obligatoria.

**Estructura BPMN generada:**

```xml
<!-- Los checkItems se modelan como un subprocess con tasks paralelas -->
<subProcess id="sub-task-1-2-prereqs"
            name="Verificar Prerrequisitos">

  <startEvent id="sub-start-prereqs"/>

  <!-- Una userTask por checkItem -->
  <userTask id="check-presupuesto" name="ID de Presupuesto disponible">
    <extensionElements>
      <yaml:checkItem required="true"/>
    </extensionElements>
  </userTask>
  <userTask id="check-centro-costo" name="Centro de Costo definido">
    <extensionElements>
      <yaml:checkItem required="true"/>
    </extensionElements>
  </userTask>
  <!-- ... resto de checkItems ... -->

  <!-- Gateway OR: todos los required deben completarse -->
  <inclusiveGateway id="gw-join-prereqs"
                    name="Todos los prerrequisitos"
                    gatewayDirection="Converging"/>

  <endEvent id="sub-end-prereqs"/>

  <!-- Sequence flows -->
  <sequenceFlow sourceRef="sub-start-prereqs" targetRef="check-presupuesto"/>
  <sequenceFlow sourceRef="sub-start-prereqs" targetRef="check-centro-costo"/>
  <sequenceFlow sourceRef="check-presupuesto" targetRef="gw-join-prereqs"/>
  <sequenceFlow sourceRef="check-centro-costo" targetRef="gw-join-prereqs"/>
  <sequenceFlow sourceRef="gw-join-prereqs" targetRef="sub-end-prereqs"/>
</subProcess>
```

**Representación visual compacta (modo simplificado):**

En el editor se ofrece un modo de vista **compacta** para multicheck con muchos items, representando el subprocess como una sola caja con badge del número de checks:

```
┌─────────────────────────────────────┐
│ ⊞  Verificar Prerrequisitos  [9✓]  │
│     type: multicheck                │
└─────────────────────────────────────┘
```

**Toggle en toolbar:** "Vista compacta / Vista expandida" para controlar si los multicheckse despliegan como subprocesses o como tarea simple.

---

### 4.4 ParallelGateway (AND) — Fases paralelas (nuevo concepto)

**Caso de uso YAML (extensión futura):** Cuando dos fases pueden ejecutarse en paralelo. Actualmente el YAML no lo soporta, pero el editor puede generarlo y la transformación lo mapea como fases con `parallel: true`.

**Estructura BPMN:**

```xml
<!-- Split paralelo -->
<parallelGateway id="gw-parallel-split"
                 name="Inicio paralelo"
                 gatewayDirection="Diverging"/>

<!-- Ambas fases se ejecutan simultáneamente -->
<sequenceFlow sourceRef="gw-parallel-split" targetRef="phase-3-start"/>
<sequenceFlow sourceRef="gw-parallel-split" targetRef="phase-4-start"/>

<!-- Join paralelo: espera a que AMBAS fases terminen -->
<parallelGateway id="gw-parallel-join"
                 name="Sincronización"
                 gatewayDirection="Converging"/>

<sequenceFlow sourceRef="phase-3-end" targetRef="gw-parallel-join"/>
<sequenceFlow sourceRef="phase-4-end" targetRef="gw-parallel-join"/>
```

**Transformación → YAML:** Se agrega propiedad `parallel: true` a las fases involucradas y `parallelGroup: "pg-1"` para identificar el grupo.

---

### 4.5 EventBasedGateway — Escalación por tiempo (nuevo concepto)

**Caso de uso:** Tarea que debe completarse en N días; si no se completa, escala automáticamente.

```xml
<eventBasedGateway id="gw-timeout-phase2"/>

<!-- Flujo normal: tarea completada -->
<sequenceFlow sourceRef="gw-timeout-phase2" targetRef="task-2-2-certificar"/>

<!-- Flujo de timeout: si no se completa en 9 días -->
<intermediateCatchEvent id="timer-phase2-timeout">
  <timerEventDefinition>
    <timeDuration xsi:type="tFormalExpression">P9D</timeDuration>
  </timerEventDefinition>
</intermediateCatchEvent>
<sequenceFlow sourceRef="gw-timeout-phase2" targetRef="timer-phase2-timeout"/>
<sequenceFlow sourceRef="timer-phase2-timeout" targetRef="task-escalation-notify"/>
```

**Transformación → YAML:** Genera `timeoutDays` y `onTimeout.action: notify` en la fase.

---

### 4.8 Diseño de Alertas de Confirmación en el Editor BPMN

Las `completionAlert` del YAML son el punto donde el usuario debe tomar una **decisión consciente** antes de continuar. En el editor BPMN cada severidad (`info`, `warning`, `critical`) tiene una representación visual, un patrón estructural y un flujo de creación diferente. Esta sección describe cómo el diseñador del proceso las crea y configura en el editor.

---

#### 4.8.1 Alerta Informativa (`severity: info`)

**Semántica:** Confirmación de cierre o avance sin riesgo. El usuario solo confirma que leyó y está de acuerdo. **No hay flujo de retorno** ni posibilidad de cancelación — siempre avanza.

**Patrón BPMN:** `userTask` → `intermediateThrowEvent (message)` → siguiente tarea

```xml
<userTask id="task-11-4-cierre" name="Cierre y Entrega del Ambiente">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:completionAlert severity="info"
        title="Cierre del Proceso"
        description="¿Confirma la entrega y aceptación del ambiente?"
        confirmLabel="Confirmar entrega y cerrar"
        cancelLabel="Revisar"/>
    </yaml:taskConfig>
  </extensionElements>
</userTask>

<!-- Intermediate message event: representa la notificación de cierre -->
<intermediateThrowEvent id="msg-task-11-4-close"
                        name="Proceso Cerrado">
  <messageEventDefinition messageRef="msg-closure-confirmed"/>
</intermediateThrowEvent>

<message id="msg-closure-confirmed" name="ClosureConfirmed"/>

<sequenceFlow sourceRef="task-11-4-cierre"
              targetRef="msg-task-11-4-close"/>
<sequenceFlow sourceRef="msg-task-11-4-close"
              targetRef="end-process-completed"/>

<endEvent id="end-process-completed" name="Proceso Completado"/>
```

**Representación visual en el editor:**

```
[task-11-4]  ──→  ✉ "Proceso Cerrado"  ──→  ◉ "Proceso Completado"
                  (intermediate msg)        (end event verde)
```

**Codificación visual:**

| Elemento | Color | Icono | Borde |
|---|---|---|---|
| Tarea con `info` alert | Fondo azul cielo (#e0f2fe) | `ℹ` badge | Azul (#0284c7) |
| IntermediateThrowEvent | Fondo blanco | Sobre azul | Azul |
| End event | Fondo verde (#dcfce7) | `✓` | Verde (#16a34a) |
| Sequence flow | Azul sólido | → | — |

**Flujo de creación en el editor (GatewayWizard):**

```
1. Diseñador selecciona una tarea en el canvas
2. Click derecho → "Agregar Alerta de Confirmación"
3. GatewayWizard muestra selector de tipo:
   ┌─────────────────────────────────────────────────────┐
   │  Selecciona el tipo de alerta                       │
   │                                                     │
   │  ○ ℹ  Informativa  — Solo confirma, siempre avanza  │
   │  ○ ⚠  Advertencia  — Puede regresar a paso anterior │
   │  ○ ⛔ Crítica       — Rechazo termina el proceso     │
   └─────────────────────────────────────────────────────┘
4. Selecciona "Informativa"
5. Panel de propiedades muestra campos:
   - Título de la alerta
   - Descripción (texto del modal)
   - Etiqueta botón Confirmar
   - Etiqueta botón Cancelar (texto solo, sin flujo de retorno)
6. Al confirmar, el editor genera automáticamente:
   - IntermediateThrowEvent conectado a la tarea
   - EndEvent "Proceso Completado" conectado al throw event
   - extensionElements yaml:completionAlert severity="info"
```

---

#### 4.8.2 Alerta de Advertencia (`severity: warning`)

**Semántica:** Punto de decisión con **posibilidad de retroceso**. Si el resultado no es satisfactorio, el flujo regresa a una tarea o fase anterior para corrección. Es el tipo más común en los procesos de validación.

**Patrón BPMN:** `userTask` → `exclusiveGateway (XOR)` → [flujo positivo adelante] / [flujo negativo hacia atrás]

```xml
<userTask id="task-10-2-confirmar-validacion"
          name="Confirmar Validación de Despliegue">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:completionAlert severity="warning"
        title="Validación de Despliegue"
        description="¿El despliegue cumple con la propuesta aprobada?"
        confirmLabel="Sí, cumple — Avanzar a Fase 11"
        cancelLabel="No cumple — Regresar a Fase 9"
        returnTargetRef="task-9-1-ejecutar-despliegue"/>
    </yaml:taskConfig>
  </extensionElements>
</userTask>

<!-- XOR gateway de decisión -->
<exclusiveGateway id="gw-task-10-2-decision"
                  name="¿Validación exitosa?"
                  gatewayDirection="Diverging"/>

<!-- Flujo positivo: avanza al siguiente paso -->
<sequenceFlow id="sf-10-2-yes"
              name="Sí, cumple"
              sourceRef="gw-task-10-2-decision"
              targetRef="task-11-1-recibir-plantilla">
  <conditionExpression>${validacionExitosa == true}</conditionExpression>
</sequenceFlow>

<!-- Flujo negativo: regresa a fase 9 (flecha hacia atrás) -->
<sequenceFlow id="sf-10-2-no"
              name="No cumple"
              sourceRef="gw-task-10-2-decision"
              targetRef="task-9-1-ejecutar-despliegue">
  <conditionExpression>${validacionExitosa == false}</conditionExpression>
</sequenceFlow>
```

**Representación visual en el editor:**

```
                ┌───────────────── flujo de retorno (naranja, curva) ──────┐
                ↓                                                           │
[task-9-1] ... [task-10-2] ──→ ◇XOR "¿Validación exitosa?"                │
                                   ├── "Sí, cumple" ──→ [task-11-1]        │
                                   └── "No cumple"  ──────────────────────┘
                                       (naranja, discontinua)
```

**Codificación visual:**

| Elemento | Color | Icono | Borde |
|---|---|---|---|
| Tarea con `warning` alert | Fondo ámbar (#fef3c7) | `⚠` badge | Ámbar (#d97706) |
| ExclusiveGateway | Fondo amarillo (#fef9c3) | `◇` estándar | Ámbar |
| Flujo positivo (confirmLabel) | Verde (#16a34a) | `→` sólida | — |
| Flujo negativo (cancelLabel) | Naranja (#ea580c) | `→` discontinua | — |
| Flecha de retorno | Naranja curva | `↩` | — |

**Flujo de creación en el editor (GatewayWizard):**

```
1. Diseñador selecciona la tarea y activa GatewayWizard
2. Selecciona "Advertencia (Warning)"
3. Panel de configuración:
   ┌──────────────────────────────────────────────────────────┐
   │  ⚠  Alerta de Advertencia                               │
   │  ─────────────────────────────────────────────────────  │
   │  Título:        [Validación de Despliegue          ]    │
   │  Descripción:   [¿El despliegue cumple con...?     ]    │
   │  Botón Confirmar: [Sí, cumple — Avanzar a Fase 11  ]    │
   │  Botón Cancelar:  [No cumple — Regresar a Fase 9   ]    │
   │                                                          │
   │  Destino si NO cumple:                                   │
   │  [ Selector de tarea del proceso ▼ ]                    │
   │  → task-9-1-ejecutar-despliegue                         │
   └──────────────────────────────────────────────────────────┘
4. El editor genera automáticamente:
   - ExclusiveGateway tras la tarea
   - SequenceFlow positivo (verde) → tarea siguiente en el flujo
   - SequenceFlow negativo (naranja, discontinuo) → tarea seleccionada
   - Actualiza extensionElements con returnTargetRef
```

**Propiedad YAML adicional sugerida:** `returnTargetRef` — almacena la tarea destino del flujo de retorno, para que el Executor pueda mostrar el botón "Regresar" funcionalmente.

---

#### 4.8.3 Alerta Crítica (`severity: critical`)

**Semántica:** Punto de NO retorno. Si el resultado es negativo, el proceso **se cancela o termina definitivamente**. No hay posibilidad de corrección. Se usa para aprobaciones formales donde el rechazo implica inicio de un proceso nuevo desde cero (ej: rechazo de presupuesto FinOps, rechazo de arquitectura).

**Patrón BPMN:** `userTask` → `exclusiveGateway (XOR)` → [flujo positivo adelante] / [flujo negativo → `endEvent terminante`] + `boundaryEvent (error)` adjunto a la tarea

```xml
<userTask id="task-6-2-autorizar-despliegue"
          name="Autorizar Presupuesto de Despliegue">
  <extensionElements>
    <yaml:taskConfig>
      <yaml:completionAlert severity="critical"
        title="Autorización de Presupuesto"
        description="¿El ID de presupuesto cumple todos los criterios?"
        confirmLabel="Autorizar — Avanzar a Fase 7"
        cancelLabel="Rechazar solicitud"
        cancellationReason="Budget rejected by FinOps"/>
    </yaml:taskConfig>
  </extensionElements>
</userTask>

<!-- XOR gateway de decisión -->
<exclusiveGateway id="gw-task-6-2-decision"
                  name="¿Presupuesto aprobado?"
                  gatewayDirection="Diverging"/>

<!-- Flujo positivo: avanza normalmente -->
<sequenceFlow id="sf-6-2-yes"
              name="Autorizar"
              sourceRef="gw-task-6-2-decision"
              targetRef="task-7-1-coordinar-areas">
  <conditionExpression>${presupuestoAprobado == true}</conditionExpression>
</sequenceFlow>

<!-- Flujo negativo: termina el proceso -->
<sequenceFlow id="sf-6-2-no"
              name="Rechazar solicitud"
              sourceRef="gw-task-6-2-decision"
              targetRef="end-process-rejected">
  <conditionExpression>${presupuestoAprobado == false}</conditionExpression>
</sequenceFlow>

<!-- End event de cancelación (terminate) -->
<endEvent id="end-process-rejected" name="Solicitud Rechazada">
  <terminateEventDefinition/>
  <extensionElements>
    <yaml:endReason>Budget rejected by FinOps</yaml:endReason>
  </extensionElements>
</endEvent>

<!-- BoundaryEvent de error (captura rechazos por excepción) -->
<boundaryEvent id="be-task-6-2-error"
               name="Error de Autorización"
               attachedToRef="task-6-2-autorizar-despliegue"
               cancelActivity="true">
  <errorEventDefinition errorRef="error-authorization-failed"/>
</boundaryEvent>

<error id="error-authorization-failed"
       name="AuthorizationFailed"
       errorCode="CRITICAL_REJECTION"/>

<sequenceFlow sourceRef="be-task-6-2-error"
              targetRef="end-process-rejected"/>
```

**Representación visual en el editor:**

```
[task-6-2] ──→ ◇XOR "¿Presupuesto aprobado?"
  ⊙ (err)         ├── "Autorizar"  (verde) ──→ [task-7-1]
  │               └── "Rechazar"   (rojo)  ──→ ⊛ "Solicitud Rechazada"
  └────────────────────────────────────────→ ⊛ (terminate, rojo)
```

**Codificación visual:**

| Elemento | Color | Icono | Borde |
|---|---|---|---|
| Tarea con `critical` alert | Fondo rojo claro (#fee2e2) | `⛔` badge | Rojo (#dc2626) |
| ExclusiveGateway | Fondo rojo claro | `◇` con `!` | Rojo |
| BoundaryEvent (error) | Fondo rojo | `⚡` | Rojo grueso |
| Flujo positivo (confirmLabel) | Verde (#16a34a) sólido | `→` | — |
| Flujo negativo (cancelLabel) | Rojo (#dc2626) grueso | `→` | — |
| EndEvent terminante | Fondo rojo (#dc2626) | `⊛` relleno | Rojo |

**Flujo de creación en el editor (GatewayWizard):**

```
1. Diseñador selecciona la tarea y activa GatewayWizard
2. Selecciona "Crítica"
3. Panel de configuración con advertencia visual:
   ┌──────────────────────────────────────────────────────────┐
   │  ⛔ Alerta Crítica — El rechazo TERMINA el proceso       │
   │  ─────────────────────────────────────────────────────   │
   │  Título:         [Autorización de Presupuesto      ]     │
   │  Descripción:    [¿El ID de presupuesto cumple...? ]     │
   │  Botón Confirmar: [Autorizar — Avanzar a Fase 7    ]     │
   │  Botón Rechazar:  [Rechazar solicitud               ]    │
   │                                                           │
   │  Razón de cancelación:                                    │
   │  [Budget rejected by FinOps                         ]    │
   │                                                           │
   │  Nombre del End Event:                                    │
   │  [Solicitud Rechazada                               ]    │
   │                                                           │
   │  ⚠ Se generará un BoundaryEvent de error y un           │
   │    EndEvent terminante. Esta acción no es reversible     │
   │    en el contexto del proceso.                            │
   └──────────────────────────────────────────────────────────┘
4. El editor genera automáticamente:
   - ExclusiveGateway tras la tarea (color rojo)
   - SequenceFlow positivo (verde) → tarea siguiente
   - SequenceFlow negativo (rojo) → EndEvent terminante
   - BoundaryEvent de error adjunto a la tarea
   - EndEvent con terminateEventDefinition (color rojo)
   - <error> definido a nivel de proceso con errorCode
```

---

#### 4.8.4 Comparativa Visual de los Tres Tipos

```
─────────────────────────────────────────────────────────────────────────────
   INFO                  WARNING                  CRITICAL
─────────────────────────────────────────────────────────────────────────────

 [tarea]                [tarea]                  [tarea]
   ℹ badge               ⚠ badge                  ⛔ badge
 fondo azul            fondo ámbar              fondo rojo claro
    │                     │                    ⊙ boundary (rojo)
    │                     ↓                         │
    ↓               ◇XOR (ámbar)              ◇XOR (rojo)
 ✉ msg event         /         \              /         \
    │            [Sí] verde  [No] naranja  [Sí] verde  [No] rojo
    ↓               │           │              │           │
 ◉ end (verde)   [next]     [prev task]     [next]      ⊛ terminate
                             (retorno)                   (rojo)

 Flujo:          Flujo:                    Flujo:
 Solo avanza     Avanza O regresa          Avanza O TERMINA

 YAML severity:  YAML severity:            YAML severity:
   info            warning                   critical
─────────────────────────────────────────────────────────────────────────────
```

#### 4.8.5 Propiedades Panel por Tipo de Alerta

Al seleccionar la tarea o el gateway en el canvas, el panel de propiedades muestra campos específicos según el `severity`:

| Campo | INFO | WARNING | CRITICAL |
|---|---|---|---|
| `title` | ✅ | ✅ | ✅ |
| `description` | ✅ | ✅ | ✅ |
| `confirmLabel` | ✅ | ✅ | ✅ |
| `cancelLabel` | ✅ (solo texto) | ✅ | ✅ |
| `returnTargetRef` | ❌ | ✅ selector tarea | ❌ |
| `cancellationReason` | ❌ | ❌ | ✅ texto libre |
| End event name | ❌ | ❌ | ✅ |
| BoundaryEvent errorCode | ❌ | ❌ | ✅ auto-generado |

---

### 4.6 Tabla Resumen de Gateways

| BPMN Gateway | YAML Origen | Generación | Transformación Inversa |
|---|---|---|---|
| `exclusiveGateway` (diverging) | `completionAlert` warning/info | Auto tras tarea con alert | Detectar GW + flows → `completionAlert` |
| `boundaryEvent` (error) | `completionAlert` critical | Adjunto a tarea + EndEvent | Detectar boundary → `severity: critical` |
| `inclusiveGateway` (converging) | `type: multicheck` | SubProcess interno | SubProcess con OR join → `checkItems[]` |
| `parallelGateway` (split+join) | Fases paralelas (futuro) | Entre fases | GW par → `parallel: true` en fases |
| `eventBasedGateway` + timer | `timeoutDays` (futuro) | Tras fase con timeout | Timer event → `timeoutDays` |
| `exclusiveGateway` (converging) | Retorno de flujo negativo | Merge antes de tarea destino | Detectar merge → dependencia múltiple |

---

### 4.7 Algoritmo de Detección de Gateways al Importar BPMN Externo

Cuando se importa un BPMN externo (Camunda, Bizagi, Signavio), los gateways pueden no tener `extensionElements` con el namespace `yaml:`. El algoritmo de detección por heurística:

```typescript
function detectGatewayIntent(gateway: BpmnGateway, context: BpmnContext): GatewayIntent {
  const outgoingFlows = gateway.outgoing;
  const incomingFlows = gateway.incoming;

  // 1. XOR diverging con un flujo hacia atrás en el proceso → completionAlert warning
  if (gateway.type === 'exclusiveGateway' && isGatewayDiverging(gateway)) {
    const hasBackwardFlow = outgoingFlows.some(f => isBackwardFlow(f, context));
    if (hasBackwardFlow) return { intent: 'completionAlert', severity: 'warning' };
  }

  // 2. XOR diverging con un flujo hacia EndEvent terminante → completionAlert critical
  if (gateway.type === 'exclusiveGateway' && isGatewayDiverging(gateway)) {
    const leadsToTerminate = outgoingFlows.some(f => leadsToTerminateEvent(f, context));
    if (leadsToTerminate) return { intent: 'completionAlert', severity: 'critical' };
  }

  // 3. OR/AND converging dentro de subprocess → multicheck join
  if (['inclusiveGateway', 'parallelGateway'].includes(gateway.type) && isInsideSubProcess(gateway)) {
    return { intent: 'multicheckJoin' };
  }

  // 4. AND split+join abarcando múltiples lanes → parallel phases
  if (gateway.type === 'parallelGateway' && isGatewayDiverging(gateway)) {
    const spansMultipleLanes = outgoingFlows.every(f => flowEntersLane(f, context));
    if (spansMultipleLanes) return { intent: 'parallelPhases' };
  }

  // 5. Gateway no reconocido → warning al usuario, ignorar
  return { intent: 'unknown', warning: `Gateway ${gateway.id} no tiene mapeo YAML conocido` };
}
```

---

## 5. Ideas Nuevas e Innovadoras

### 5.1 Paleta Personalizada por Tipo de Tarea YAML
Reemplazar la paleta genérica de bpmn-js con tipos propios del proyecto: Standard, Check, Multicheck, Form, Dynamic List, Detail Table, Export Excel.

### 5.2 Live YAML Preview con Validación
```
┌─────────────────────┬──────────────────────┐
│   BPMN Diagram      │   YAML Preview       │
│   (bpmn-js)         │   (Monaco Editor)    │
│                     │   ✓ Schema válido    │
│                     │   ─ Línea 34: error  │
└─────────────────────┴──────────────────────┘
```

### 5.3 Import desde Proceso Existente
Selector de cualquier YAML del catálogo → carga en editor como BPMN para modificar → genera YAML nuevo.

### 5.4 Simulación de Token BPMN
`bpmn-js-token-simulation`: animar el flujo del token antes de guardar. Valida visualmente gateways y flujos de retorno.

### 5.5 Exportación Multi-Formato
YAML, BPMN XML, SVG/PNG, PDF.

### 5.6 Versionado de Diseños
Historial de versiones del diagrama en localStorage, con diff visual.

### 5.7 Validación Pre-Export
Antes de exportar YAML, el editor valida: sin dependencias circulares, `checkItems` con id único, `evidence` definido en todas las tareas.

---

## 6. Arquitectura Técnica

### Nueva ruta: `/studio`

```
app/
├── studio/
│   ├── page.tsx                ← Página principal del editor
│   ├── layout.tsx              ← Layout sin nav (full-screen)
│   └── _components/
│       ├── BpmnModeler.tsx     ← Wrapper bpmn-js (lazy loaded, ssr:false)
│       ├── YamlPreview.tsx     ← Monaco Editor con schema
│       ├── StudioToolbar.tsx   ← Import/Export/Simulate
│       ├── PropertiesPanel.tsx ← Panel propiedades YAML-aware
│       ├── ProcessPalette.tsx  ← Paleta custom por tipo
│       └── GatewayWizard.tsx   ← Asistente visual para configurar gateways
├── api/
│   └── studio/
│       ├── convert/
│       │   ├── bpmn-to-yaml/route.ts
│       │   └── yaml-to-bpmn/route.ts
│       └── validate/route.ts
```

### Motor de Transformación

```
lib/
├── bpmn-transformer/
│   ├── index.ts
│   ├── bpmn-to-yaml.ts
│   ├── yaml-to-bpmn.ts
│   ├── gateway-detector.ts     ← Heurísticas de detección de gateways
│   ├── gateway-generator.ts    ← Generación BPMN de cada tipo de gateway
│   ├── extension-elements.ts
│   └── layout-engine.ts
```

---

## 7. Plan de Sprints

### Sprint 1 — Scaffolding del Editor (3–4 días)
- [ ] Instalar `bpmn-js`, `bpmn-moddle`, `@monaco-editor/react`
- [ ] Ruta `/studio` con layout full-screen
- [ ] `BpmnModeler.tsx` (lazy import, SSR disabled)
- [ ] Layout dividido: 60% diagrama / 40% YAML preview
- [ ] Botón "Nuevo proceso" → BPMN vacío con 1 lane y 1 tarea
- [ ] Unit test: bpmn-js importa/exporta XML correctamente

### Sprint 2 — YAML → BPMN (4–5 días)
- [ ] Implementar `yamlToBpmn()` en `lib/bpmn-transformer/yaml-to-bpmn.ts`
  - Mapear `phases[]` → `<lane>` con auto-layout
  - Mapear `tasks[]` → `<userTask>` con `extensionElements`
  - Mapear `dependencies[]` → `<sequenceFlow>`
  - Mapear `completionAlert` → gateway correspondiente (ver sección 4)
  - Mapear `variables[]` → `<dataObject>`
- [ ] API route `POST /api/studio/convert/yaml-to-bpmn`
- [ ] Botón "Importar desde catálogo"
- [ ] Botón "Subir YAML"
- [ ] Unit tests del transformer (10+ casos cubriendo todos los tipos de gateway)

### Sprint 3 — BPMN → YAML (4–5 días)
- [ ] Implementar `bpmnToYaml()` + `gateway-detector.ts`
- [ ] Lógica de detección heurística para los 5 tipos de gateway
- [ ] API route `POST /api/studio/convert/bpmn-to-yaml`
- [ ] Live preview: cambio en diagrama → regenera YAML
- [ ] Validación en tiempo real contra `process.schema.json`
- [ ] Unit tests del transformer inverso + gateway-detector

### Sprint 4 — Import XML + Propiedades (3–4 días)
- [ ] Botón "Importar XML" → file input `.bpmn` / `.xml`
- [ ] Botón "Pegar XML" → textarea modal
- [ ] Panel de propiedades contextual YAML-aware
- [ ] `GatewayWizard.tsx`: asistente visual para configurar tipo y etiquetas de cada gateway
- [ ] Unit tests del panel de propiedades

### Sprint 5 — Paleta + Renderer Custom (3–4 días)
- [ ] Paleta custom con los 7 tipos YAML
- [ ] Renderer: color y badge por tipo de tarea
- [ ] Colores diferenciados por tipo de gateway (XOR=amarillo, OR=azul, AND=verde, boundary=rojo)
- [ ] Tooltip en hover con campos YAML del elemento
- [ ] Auto-snap de tasks dentro de lanes

### Sprint 6 — Exportación + Simulación (3–4 días)
- [ ] Exportar YAML, BPMN XML, SVG/PNG
- [ ] `bpmn-js-token-simulation` → validar flujos de gateways visualmente
- [ ] Botón "Cargar en Executor"
- [ ] Validación pre-export completa

### Sprint 7 — Testing + Pulido (3–4 días)
- [ ] Suite completa de tests (ver sección 8)
- [ ] README.process.md actualizado con guía del Studio
- [ ] Bump versión patch + historial

---

## 8. Estrategia de Testing

La estrategia cubre cuatro niveles: **Unit**, **Integration**, **E2E** y **Visual Regression**, con énfasis especial en los transformadores y en los gateways por su complejidad.

---

### 8.1 Unit Tests — Motor de Transformación

Archivo base: `__tests__/unit/lib/bpmn-transformer/`

#### 8.1.1 `yaml-to-bpmn.test.ts`

```typescript
describe('yamlToBpmn()', () => {

  describe('Process metadata', () => {
    it('maps process.id and process.name to <process> attributes')
    it('maps process.description to <documentation>')
    it('maps process.variables[] to <dataObject> elements')
  })

  describe('Phases → Lanes', () => {
    it('generates one <lane> per phase in order')
    it('assigns sequential Y positions to lanes (auto-layout)')
    it('maps phase.description to lane <documentation>')
  })

  describe('Tasks → userTask', () => {
    it('maps task.id, task.name to userTask attributes')
    it('embeds task.type in extensionElements yaml:type')
    it('embeds task.evidence in extensionElements yaml:evidence')
    it('maps task.dependencies[] to <sequenceFlow> elements')
  })

  describe('Gateway generation', () => {
    it('generates exclusiveGateway for completionAlert severity:warning')
    it('generates exclusiveGateway for completionAlert severity:info')
    it('generates boundaryEvent+endEvent for completionAlert severity:critical')
    it('generates subProcess+inclusiveGateway for type:multicheck')
    it('sets correct conditionExpression on positive/negative sequenceFlows')
    it('sets gateway name from completionAlert.title')
    it('maps confirmLabel to positive flow name')
    it('maps cancelLabel to negative flow name')
    it('backward flow for warning gateway points to correct task')
    it('terminate endEvent generated for critical gateway rejection path')
  })

  describe('Round-trip fidelity', () => {
    it('YAML → BPMN → YAML preserves all phases and tasks')
    it('YAML → BPMN → YAML preserves all dependencies')
    it('YAML → BPMN → YAML preserves all completionAlerts')
    it('YAML → BPMN → YAML preserves all checkItems')
    it('YAML → BPMN → YAML preserves all variables')
    it('YAML → BPMN → YAML preserves all outputVars')
  })

})
```

#### 8.1.2 `bpmn-to-yaml.test.ts`

```typescript
describe('bpmnToYaml()', () => {

  describe('Standard elements', () => {
    it('extracts process id, name, version from <process>')
    it('orders phases by lane Y position')
    it('extracts tasks with correct type from extensionElements')
    it('builds dependencies[] from sequenceFlow sourceRef')
  })

  describe('Gateway detection → YAML fields', () => {
    it('XOR diverging with backward flow → completionAlert severity:warning')
    it('XOR diverging with terminate end → completionAlert severity:critical')
    it('OR converging inside subprocess → type:multicheck + checkItems')
    it('Parallel gateway split+join → parallel:true on phases (future)')
    it('Unknown gateway → warning message, element ignored gracefully')
    it('XOR converging (merge) → multiple entries in task.dependencies[]')
  })

  describe('External BPMN (Camunda/Bizagi)', () => {
    it('imports BPMN without yaml: namespace without crashing')
    it('heuristic detects XOR + backward flow as completionAlert')
    it('heuristic detects boundary error as critical alert')
    it('reports unrecognized elements as warnings, not errors')
  })

})
```

#### 8.1.3 `gateway-detector.test.ts`

```typescript
describe('detectGatewayIntent()', () => {
  it('returns completionAlert:warning for XOR + backward flow')
  it('returns completionAlert:critical for XOR + terminate end')
  it('returns multicheckJoin for OR inside subprocess')
  it('returns parallelPhases for AND spanning multiple lanes')
  it('returns unknown for event-based gateway with no timer')
  it('returns timedEscalation for event-based + timer intermediate event')
})
```

#### 8.1.4 Fixtures para tests

```
__tests__/
└── fixtures/
    └── bpmn/
        ├── simple-process.bpmn          ← 1 lane, 3 tasks
        ├── with-xor-warning.bpmn        ← XOR con backward flow
        ├── with-xor-critical.bpmn       ← XOR + terminate end
        ├── with-multicheck.bpmn         ← OR subprocess
        ├── with-parallel-phases.bpmn    ← AND split/join
        ├── camunda-external.bpmn        ← BPMN sin extensiones yaml:
        ├── bizagi-external.bpmn         ← BPMN de Bizagi
        └── gestion-ambientes.bpmn       ← Generado desde proceso real
```

**Cobertura objetivo unit tests:** ≥ 85% en `lib/bpmn-transformer/`

---

### 8.2 Integration Tests — API Routes

Archivo base: `__tests__/integration/studio/`

```typescript
describe('POST /api/studio/convert/yaml-to-bpmn', () => {
  it('returns 200 with valid BPMN XML for each of the 10 YAMLs del catálogo')
  it('returns 400 with validation error for invalid YAML input')
  it('returns BPMN with correct number of lanes = phases count')
  it('returns BPMN with correct number of userTasks = tasks count')
  it('returns BPMN with exclusiveGateway for every completionAlert')
  it('BPMN output is valid against BPMN 2.0 XSD schema')
})

describe('POST /api/studio/convert/bpmn-to-yaml', () => {
  it('returns 200 with YAML that passes validate:processes for simple BPMN')
  it('returns YAML with correct phase order from lane Y positions')
  it('returns 400 for malformed XML input')
  it('round-trip: yaml-to-bpmn then bpmn-to-yaml returns equivalent YAML')
  it('handles BPMN from Camunda Modeler without crashing')
})

describe('POST /api/studio/validate', () => {
  it('returns {valid: true} for valid YAML')
  it('returns {valid: false, errors:[]} for YAML with missing required fields')
  it('returns errors for unsupported task types')
})
```

---

### 8.3 E2E Tests — Playwright

Archivo base: `__tests__/e2e/flows/studio/`

#### `studio-new-process.spec.ts`
```typescript
test('should create a new process from scratch and export YAML', async ({ page }) => {
  // 1. Navegar a /studio
  // 2. Click "Nuevo proceso"
  // 3. Agregar lane "Fase 1"
  // 4. Arrastrar task "Check Task" al lane
  // 5. Editar nombre en panel de propiedades
  // 6. Click "Exportar YAML"
  // 7. Verificar descarga con nombre correcto
  // 8. Verificar YAML contiene phase y task creados
})
```

#### `studio-upload-xml.spec.ts`
```typescript
test('should upload BPMN XML and display diagram', async ({ page }) => {
  // 1. Navegar a /studio
  // 2. Click "Importar XML"
  // 3. Subir archivo simple-process.bpmn (fixture)
  // 4. Verificar que el diagrama se renderiza
  // 5. Verificar YAML preview se actualiza
  // 6. Verificar número de phases en YAML = lanes en BPMN
})

test('should paste BPMN XML and display diagram', async ({ page }) => {
  // Flujo con textarea paste modal
})
```

#### `studio-load-from-catalog.spec.ts`
```typescript
test('should load existing YAML process into BPMN editor', async ({ page }) => {
  // 1. Navegar a /studio
  // 2. Click "Importar desde catálogo"
  // 3. Seleccionar "Gestión de Ambientes"
  // 4. Verificar 11 lanes generados
  // 5. Verificar gateways presentes (5 completionAlerts)
  // 6. Modificar nombre de fase 1
  // 7. Exportar YAML
  // 8. Verificar nombre de fase 1 actualizado
})
```

#### `studio-gateway-flows.spec.ts`
```typescript
test('should render warning completionAlert as XOR gateway', async ({ page }) => {
  // 1. Cargar YAML con completionAlert severity:warning
  // 2. Verificar que aparece un exclusiveGateway en el diagrama
  // 3. Verificar que el gateway tiene 2 outgoing flows
  // 4. Verificar labels de los flows coinciden con confirmLabel/cancelLabel
})

test('should render critical completionAlert as boundary error event', async ({ page }) => {
  // 1. Cargar YAML con completionAlert severity:critical
  // 2. Verificar que aparece un boundaryEvent en la tarea
  // 3. Verificar que el boundary fluye a un terminate endEvent
})

test('should render multicheck task as subprocess with OR gateway', async ({ page }) => {
  // 1. Cargar YAML con type:multicheck y 9 checkItems
  // 2. Verificar subprocess en el diagrama
  // 3. Expandir subprocess y verificar 9 userTasks dentro
  // 4. Verificar inclusiveGateway converging al final
})
```

#### `studio-roundtrip.spec.ts`
```typescript
test('round-trip YAML → BPMN → YAML preserves semantic equivalence', async ({ page }) => {
  // Para cada uno de los 10 YAMLs del catálogo:
  // 1. Cargar YAML en editor → se convierte a BPMN
  // 2. Sin modificar, exportar YAML
  // 3. Comparar YAML original vs exportado (mismas fases, tasks, alerts)
  // 4. Verificar YAML exportado pasa validate:processes
})
```

---

### 8.4 Visual Regression Tests

Usando Playwright `toHaveScreenshot()` para capturar y comparar el estado visual del editor:

```typescript
// __tests__/e2e/visual/studio-snapshots.spec.ts

test('studio empty state matches snapshot', async ({ page }) => {
  await page.goto('/studio');
  await expect(page.locator('.bpmn-canvas')).toHaveScreenshot('studio-empty.png');
})

test('studio with gestion-ambientes loaded matches snapshot', async ({ page }) => {
  // Cargar proceso y tomar screenshot
  await expect(page.locator('.bpmn-canvas')).toHaveScreenshot('studio-gestion-ambientes.png');
})

test('XOR gateway renders correctly', async ({ page }) => {
  // Cargar fixture con XOR y verificar visual
  await expect(page.locator('#gw-decision')).toHaveScreenshot('xor-gateway.png');
})
```

---

### 8.5 Matriz de Cobertura por Componente

| Componente | Unit | Integration | E2E | Visual |
|---|---|---|---|---|
| `yaml-to-bpmn.ts` | ✅ ≥85% | ✅ | — | — |
| `bpmn-to-yaml.ts` | ✅ ≥85% | ✅ | — | — |
| `gateway-detector.ts` | ✅ ≥90% | — | ✅ | — |
| `gateway-generator.ts` | ✅ ≥85% | — | ✅ | ✅ |
| `BpmnModeler.tsx` | — | — | ✅ | ✅ |
| `YamlPreview.tsx` | — | — | ✅ | — |
| `PropertiesPanel.tsx` | ✅ | — | ✅ | — |
| `GatewayWizard.tsx` | ✅ | — | ✅ | ✅ |
| API `/convert/*` | — | ✅ | — | — |
| API `/validate` | — | ✅ | — | — |
| Round-trip fidelity | ✅ | ✅ | ✅ | — |

---

### 8.6 Comandos de Testing

```bash
# Unit tests del transformer
npx vitest run __tests__/unit/lib/bpmn-transformer/

# Integration tests de API routes
npx vitest run __tests__/integration/studio/

# E2E completo del studio
npx playwright test __tests__/e2e/flows/studio/

# Visual regression (generar baselines primera vez)
npx playwright test __tests__/e2e/visual/ --update-snapshots

# Cobertura completa
npx vitest run --coverage
```

---

## 9. Arquitectura de Exportación Excel (`process.export`)

El schema `process.schema.json` incluye un sistema completo de exportación declarativa Excel que es **crítico para la compatibilidad** del YAML generado por el editor. Sin este soporte, procesos como `release-checklist.yaml` no pueden representarse fielmente.

---

### 9.1 Estructura de `process.export`

Se define a **nivel de proceso** (no de tarea) y controla la generación completa del archivo Excel:

```yaml
process:
  export:
    templatePath: "/templates/TEMPLATE_Checklist.xlsx"   # REQUERIDO
    templateVersion: "1.0.0"
    templateSha256: "abc123..."    # hash SHA-256 del template (64 hex chars)
    outputFilename: "Checklist_{today:DDMMYYYY}_RFC{vars.rfc}_{process.name}"
    autoDownload: true
    mappings:
      sheets:
        - sheet: "Checklist"
          sources: [...]
        - sheet: "Evidencias"
          startRow: 3
          timestampColumn: B
          nameColumn: C
          maxRows: 50
```

**Tokens en `outputFilename`:**

| Token | Resuelve a |
|---|---|
| `{today:DDMMYYYY}` | Fecha actual formateada |
| `{today:YYYY-MM-DD}` | Fecha actual ISO |
| `{now:HHmm}` | Hora actual |
| `{vars.rfc}` | Valor de la variable de proceso `rfc` |
| `{process.name}` | Nombre del proceso |
| `{process.version}` | Versión del proceso |
| `{process.id}` | ID del proceso |

**BPMN → `extensionElements` a nivel de `<process>`:**

```xml
<process id="proc-release-checklist">
  <extensionElements>
    <yaml:exportConfig
      templatePath="/templates/TEMPLATE_Checklist.xlsx"
      templateVersion="1.0.0"
      outputFilename="Checklist_{today:DDMMYYYY}_RFC{vars.rfc}_{process.name}"
      autoDownload="true">
      <yaml:mappings>
        <yaml:sheet name="Checklist">
          <!-- sources declaradas aquí -->
        </yaml:sheet>
        <yaml:sheet name="Evidencias" startRow="3"
                    timestampColumn="B" nameColumn="C"/>
      </yaml:mappings>
    </yaml:exportConfig>
  </extensionElements>
</process>
```

---

### 9.2 Los 12 Tipos de `ExportTaskSource` (kinds)

Cada `sheet` contiene un array `sources[]` donde cada source tiene un `kind`:

| `kind` | Descripción | Campos clave |
|---|---|---|
| `variables` | Mapea `capturedVariables` a celdas Excel | `mapping: {varKey: "CellRef"}` |
| `static` | Valores literales a celdas específicas | `cells: {"A1": "valor", "B2": 42}` |
| `time` | Timestamps del proceso a celdas | `today`, `startedAt`, `completedAt`, `totalElapsedMinutes`, `totalElapsedHours` |
| `process` | Metadatos del proceso a celdas | `id`, `name`, `version` → `CellRef` |
| `comments` | Texto interpolado a una sola celda | `cell: CellRef`, `template: "texto {vars.xxx}"` |
| `list` | Lista de `dynamic-list` → columna Excel | `sourceTaskId`, `column`, `startRow`, `endRow`, `maxItems` |
| `detail` | Lista de `detail-list` → múltiples columnas | `sourceTaskId`, `sections[]` con `column, startRow, endRow` |
| `form` | Datos de tarea `form` → celdas via `valueCell` | `sourceTaskId` |
| `checklist` | CheckItems de `multicheck` → filas Excel | `sourceTaskId`, `startRow`, `maxRows`, `columns: {aplica, validado, url, nombre}` |
| `detail-table` | Tabla `detail-table` → columnas mapeadas | `sourceTaskId`, `startRow`, `columns: {colId: "ColumnLetter"}` |
| `cell` | Campos específicos de cualquier tarea → celdas | `sourceTaskId`, `fields: [{field: "dot.path", cell: CellRef}]` |
| `range` | **Lee** rango del template Excel → `capturedVariable` | `range: "A1:B10"`, `outputVar: "varName"`, `flatten: true` |

> **`kind: range` es especial:** es el único source que **lee del template hacia la app** (inverso). Permite pre-cargar opciones desde celdas del Excel.

**Ejemplo completo de sheet con múltiples sources:**

```yaml
- sheet: "Checklist"
  sources:
    - kind: variables
      mapping:
        torre: "F3"
        rfc: "F14"
        tipoLiberacion: "F86"
    - kind: time
      today: "U3"
      startedAt: "S86"
      completedAt: "S87"
    - kind: process
      id: "F84"
    - kind: comments
      cell: "B100"
      template: "Proceso: {process.name} - RFC: {vars.rfc}"
    - kind: list
      sourceTaskId: task-1-2
      column: F
      startRow: 5
      endRow: 13
    - kind: detail-table
      sourceTaskId: task-1-2a
      startRow: 47
      columns:
        integracionMaster: H
        deudaTecnica: I
        urlRepo: L
    - kind: cell
      sourceTaskId: task-7-1b
      fields:
        - field: "evidence.text"
          cell: "B110"
        - field: "checkItems.check-presupuesto.checked"
          cell: "D15"
```

---

### 9.3 Implicaciones para el Editor BPMN

El editor debe poder **representar visualmente** la configuración de exportación y **generarla** en el YAML. Las implicaciones:

1. **Panel de exportación del proceso**: cuando se selecciona el pool/proceso en el canvas, el panel de propiedades muestra la sección `export` con campos para `templatePath`, `outputFilename`, `autoDownload`.

2. **Configurador de sheets**: UI para agregar/editar sheets con `sources[]`. Cada source type tiene su propio sub-formulario.

3. **Vinculación tarea → export source**: al seleccionar una tarea con `type: dynamic-list`, el editor sugiere automáticamente agregar un source `kind: list` en el export config, con el `sourceTaskId` ya pre-completado.

4. **`kind: range` en el editor**: representado como un `<dataInputAssociation>` desde el proceso hacia la tarea que usará esos datos. Es el único flujo de datos "de vuelta" en el diagrama.

5. **Validación del templatePath**: el editor valida que el `templatePath` apunta a un archivo existente (si es `local`) o advierte que debe existir en el servidor.

6. **No hay equivalente BPMN estándar para el export completo**: todo el `process.export` se serializa en `<extensionElements>` a nivel de `<process>`. Herramientas externas lo ignorarán gracefully.

---

### 9.4 Unit Tests del Motor de Exportación

```typescript
// __tests__/unit/lib/bpmn-transformer/export-config.test.ts

describe('yamlToBpmn() - process.export', () => {
  it('embeds exportConfig in process extensionElements')
  it('generates yaml:sheet elements for each sheet in mappings')
  it('preserves all 12 source kind types in extensionElements')
  it('serializes outputFilename tokens without modification')
})

describe('bpmnToYaml() - process.export round-trip', () => {
  it('extracts exportConfig from process extensionElements')
  it('round-trip preserves all sources for release-checklist.yaml export')
  it('round-trip preserves kind:range outputVar and flatten flag')
  it('round-trip preserves detail-table columns mapping')
  it('round-trip preserves comments template string')
})
```

---

## 10. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| bpmn-js incompatible con SSR (Next.js) | Alto | `dynamic(() => import(...), { ssr: false })` |
| BPMN XML externo con gateways no mapeables | Medio | `gateway-detector.ts` heurístico + warning al usuario |
| Auto-layout de lanes produce diagramas feos | Medio | Usar `dagre` layout engine |
| `extensionElements` no reconocidos por otras tools | Bajo | Documentar namespace `yaml:` + fallback graceful |
| Multicheck con 20+ items satura el subprocess | Bajo | Vista compacta + toggle expandir/colapsar |
| Round-trip no preserva 100% fidelidad | Medio | Tests de fidelidad semántica (no igualdad textual) |
| `process.export` no tiene equivalente BPMN estándar | Medio | Serializar todo en `extensionElements`; documentar pérdida al exportar a tools externas |
| `kind: range` (lectura inversa Excel→app) sin representación BPMN | Bajo | Modelar como `dataInputAssociation` desde `<dataStore>` hacia proceso |
| Activities (nivel 3) complejizan auto-layout | Medio | Usar subProcess colapsado por defecto; expandir bajo demanda |

---

## 11. Impacto sobre el Código Existente

| Área | Impacto | Acción |
|---|---|---|
| `package.json` | Nuevas deps | bpmn-js, bpmn-moddle, @monaco-editor/react |
| YAML schema | Extensión opcional | `parallel`, `timeoutDays`, `laneAssignment` |
| `validate:processes` | Sin cambio | YAML generado debe pasar validación existente |
| Executor (`/process`) | Sin cambio | Carga el YAML generado sin modificaciones |
| Tests existentes | Sin impacto | Suite nueva e independiente en `/studio/` |

---

## 12. Dependencias a Agregar

```json
{
  "dependencies": {
    "bpmn-js": "^17.x",
    "bpmn-js-properties-panel": "^3.x",
    "@bpmn-io/properties-panel": "^3.x",
    "bpmn-moddle": "^9.x",
    "bpmn-js-token-simulation": "^0.x",
    "@monaco-editor/react": "^4.x",
    "jspdf": "^2.x",
    "html-to-image": "^1.x"
  },
  "devDependencies": {
    "dagre": "^0.8.x"
  }
}
```

---

## Resumen Ejecutivo

| Sprint | Objetivo | Días |
|---|---|---|
| 1 | Scaffolding editor | 3–4 |
| 2 | YAML → BPMN (incl. gateways) | 4–5 |
| 3 | BPMN → YAML (incl. gateway-detector) | 4–5 |
| 4 | Import XML + Properties Panel | 3–4 |
| 5 | Paleta + Renderer custom | 3–4 |
| 6 | Export + Simulación | 3–4 |
| 7 | Testing completo + Pulido | 3–4 |
| **Total** | | **23–30 días** |
