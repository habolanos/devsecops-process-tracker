# DevSecOps Process Tracker

Aplicación web para gestión y seguimiento de procesos DevSecOps con soporte para evidencias, dependencias entre tareas, links dinámicos y exportación de resultados.

## ✨ Características Principales

- **Gestión de Procesos**: Carga de plantillas YAML, JSON importado o procesos personalizados
- **Tipos de Tareas**: Standard, Check (checkbox individual), Multicheck (múltiples checkboxes), Dynamic-list (listas de items), Detail-list (detalles por item de lista), Form (formularios con layout de columnas), Export-excel
- **Sistema de Dependencias**: Bloqueo automático de tareas hasta completar dependencias
- **Evidencias**: Texto e imágenes (upload a S3 o modo local Base64)
- **Variables Dinámicas**: Auto-fill desde configuración DevOps
- **Links Dinámicos**: URLs parametrizables con variables del proceso
- **Timer de Proceso**: Tracking de tiempo con sesiones múltiples
- **Exportación**: JSON y documentos Word con evidencias
- **Modo Dark/Light**: Toggle de tema con soporte del sistema operativo
- **Gestión Multi-proceso**: Tabs para trabajar con múltiples procesos simultáneamente
- **Persistencia**: Estado guardado en localStorage con compresión
- **i18n**: Soporte para español e inglés

## 📊 Diagramas

La documentación visual de la aplicación está organizada en diagramas detallados que ilustran diferentes aspectos del sistema. Cada diagrama incluye contexto, descripción y explicaciones complementarias.

### 📋 [Flujo del Proceso de la Aplicación](docs/diagrams/flujo-proceso.md)

Diagrama de flujo completo que muestra la interacción del usuario con la aplicación desde el inicio hasta la exportación de resultados. Incluye:

- **Selección de origen**: Templates, YAML personalizado o JSON exportado
- **Gestión de dependencias**: Sistema de bloqueo/desbloqueo de tareas
- **Evidencias**: Upload a S3 o modo local con Base64
- **Variables dinámicas**: Auto-fill desde configuración DevOps
- **Exportación**: Generación de JSON y documentos Word

**[Ver diagrama completo →](docs/diagrams/flujo-proceso.md)**

### 🏗️ [Arquitectura del Sistema](docs/diagrams/arquitectura-sistema.md)

Diagrama de arquitectura en capas que detalla la estructura completa de la aplicación. Muestra:

- **Frontend Layer**: Next.js 15, React, Tailwind CSS, shadcn/ui
- **State Management**: Zustand con persistencia localStorage
- **Business Logic**: Parsers, helpers, utils y generadores
- **API Routes**: Endpoints REST para templates y uploads
- **Data Sources**: Templates YAML y configuraciones DevOps
- **External Services**: S3, NextAuth, Prisma (opcionales)
- **Testing**: Vitest (51 tests unitarios) + Playwright (E2E)

**[Ver diagrama completo →](docs/diagrams/arquitectura-sistema.md)**

### 🔄 [Flujo de Datos](docs/diagrams/flujo-datos.md)

Diagrama de secuencia que ilustra las interacciones temporales entre componentes durante operaciones clave:

- **Carga de proceso**: Desde selección de template hasta renderizado
- **Gestión de evidencias**: Upload con S3 vs modo local Base64
- **Actualización de estado**: Progreso, dependencias y persistencia
- **Exportación**: Serialización y descarga de resultados

**[Ver diagrama completo →](docs/diagrams/flujo-datos.md)**

## 🚀 Stack Tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Next.js** | 15.5.14 | Framework React con App Router |
| **TypeScript** | 5.2.2 | Tipado estático |
| **Tailwind CSS** | 3.3.3 + shadcn/ui | Estilos y componentes UI |
| **Zustand** | 5.0.12 | Estado global con persistencia localStorage |
| **Immer** | ^10.1.0 | Mutaciones inmutables eficientes |
| **Vitest** | 4.1.2 | Tests unitarios |
| **Playwright** | 1.40.0 | Tests E2E |
| **Vite** | 6.4.1 | Build tool y dev server para tests |
| **AWS SDK** | 3.1019.0 | Integración S3 (opcional) |
| **next-auth** | 4.24.13 | Autenticación (opcional) |
| **Prisma** | 6.7.0 | ORM para base de datos (opcional) |
| **js-yaml** | 4.1.1 | Parseo de YAML |
| **docx** | 9.6.1 | Generación de documentos Word |
| **Lucide React** | 0.446.0 | Iconos |
| **lodash** | 4.17.23 | Utilidades JavaScript |
| **webpack** | 5.105.4 | Bundler (usado por Next.js) |

## 📁 Estructura del Proyecto

```
nextjs_space/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # Página principal - selección de plantillas
│   ├── layout.tsx               # Layout raíz con providers
│   ├── globals.css              # Estilos globales + Tailwind
│   ├── process/                 # Página de proceso activo
│   │   ├── page.tsx            # Vista principal del proceso
│   │   └── _components/        # Componentes específicos del proceso
│   │       ├── task-card.tsx       # Tarjeta de tarea individual
│   │       ├── activity-card.tsx   # Tarjeta de actividad con tareas
│   │       ├── dynamic-list-input.tsx # Input para listas dinámicas
│   │       ├── process-sidebar.tsx # Sidebar de navegación de fases
│   │       ├── progress-bar.tsx    # Barra de progreso visual
│   │       ├── evidence-modal.tsx  # Modal de gestión de evidencias
│   │       ├── variables-form.tsx  # Formulario de variables dinámicas
│   │       ├── config-upload.tsx   # Upload de configuración DevOps
│   │       ├── dynamic-link-button.tsx # Botones con URLs dinámicas
│   │       └── process-timer.tsx   # Timer de proceso (Start/Pause)
│   └── api/                     # API Routes (Next.js)
│       ├── processes/          # GET /api/processes - listar plantillas
│       │   └── [id]/          # GET /api/processes/[id] - detalle
│       └── upload/             # Gestión de uploads
│           ├── presigned/     # POST - URL prefirmada S3 o modo local
│           ├── complete/      # POST - URL final del archivo
│           └── delete/        # POST - eliminar de S3
│
├── components/                  # Componentes UI reutilizables (50+ de shadcn)
│   └── ui/                     # Botones, inputs, modals, etc.
│
├── lib/                         # Lógica de negocio central
│   ├── types.ts                # Tipos TypeScript principales
│   ├── store.ts                # Zustand store - proceso actual
│   ├── session-store.ts        # Zustand store - gestión multi-proceso
│   ├── loading-store.ts        # Zustand store - tracking de operaciones
│   ├── config-store.ts         # Zustand store - config DevOps
│   ├── persist-storage.ts      # Storage comprimido con debounce
│   ├── helpers.ts              # Funciones: progreso, dependencias, validación
│   ├── yaml-parser.ts          # Parser YAML → ProcessState
│   ├── json-utils.ts           # Import/Export JSON con evidencias
│   ├── word-generator.ts       # Generador de documentos Word
│   ├── excel-generator.ts      # Generador de reportes Excel
│   ├── i18n-context.tsx        # Contexto de internacionalización (ES/EN)
│   ├── sanitize.ts             # Sanitización XSS
│   ├── aws-config.ts           # Config AWS S3 (modo local si no hay credenciales)
│   ├── s3.ts                   # Utilidades S3 (upload, download, delete)
│   ├── config-loader.ts        # Carga y parseo de config DevOps
│   └── devops-config-types.ts  # Tipos para configuración DevOps
│
├── data/                        # Datos estáticos
│   ├── processes/              # Procesos YAML predefinidos
│   │   ├── index.json         # Catálogo: 6 plantillas
│   │   ├── it-security-audit.yaml      # 3 fases, 13 tareas
│   │   ├── devops-release.yaml         # 3 fases, 10 tareas
│   │   ├── incident-response.yaml        # 4 fases, 12 tareas
│   │   ├── devops-pipeline.yaml        # Con variables y links dinámicos
│   │   ├── pull-request-validation.yaml # 6 fases, 21 tareas, 8 variables
│   │   └── release-checklist.yaml      # Checklist de liberación con dynamic-list
│   └── process-tracker-config.example.json  # Template de configuración
│
├── __tests__/                   # Tests
│   ├── unit/                   # Tests unitarios
│   │   ├── lib/               # Tests de lógica de negocio
│   │   │   ├── helpers.test.ts    # Progreso, dependencias, validación
│   │   │   ├── yaml-parser.test.ts # Parseo YAML
│   │   │   ├── json-utils.test.ts  # Import/export JSON
│   │   │   └── excel-generator.test.ts # Generación Excel
│   │   └── components/       # Tests de componentes UI
│   │       └── dynamic-list-input.test.tsx # Input de listas dinámicas
│   ├── e2e/                   # Tests E2E con Playwright
│   │   ├── flows/              # Flujos principales
│   │   │   ├── load-process.spec.ts    # Carga plantillas/YAML/JSON
│   │   │   ├── dependencies.spec.ts    # Flujo de dependencias
│   │   │   └── export-results.spec.ts  # Exportación JSON y Word
│   │   └── release-checklist-export.spec.ts # Export Excel para release checklist
│   └── fixtures/               # Archivos de prueba
│       ├── simple-process.yaml
│       ├── complex-dependencies.yaml
│       ├── sample-export.json
│       └── invalid-yaml.yaml
│
├── prisma/
│   └── schema.prisma           # Schema opcional para persistencia
│
└── scripts/
    └── safe-seed.ts            # Seed de datos iniciales
```

## 🚀 Inicio Rápido

### Prerequisitos
- Node.js 20+
- npm 8+

### Instalación

```bash
# Entrar al directorio
cd nextjs_space

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:3000` (o `3001` si 3000 está ocupado).

## 🔧 Configuración

### Variables de Entorno (Opcional)

Crear `.env.local` para activar modo S3 (sin esto, usa base64 local):

```env
# AWS S3 Configuration
AWS_BUCKET_NAME=tu-bucket-s3
AWS_FOLDER_PREFIX=process-tracker/
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=tu-access-key
AWS_SECRET_ACCESS_KEY=tu-secret-key

# Opcional: NextAuth
NEXTAUTH_SECRET=tu-secret
NEXTAUTH_URL=http://localhost:3000
```

**Sin configurar S3**: Las imágenes se convierten a base64 y se almacenan en localStorage.

### Configuración DevOps (JSON)

Template para autocompletado de variables:

```json
{
  "version": "1.0.0",
  "engineer": {
    "name": "Tu Nombre",
    "email": "tu.email@empresa.com"
  },
  "azureDevOps": {
    "organization": "mi-org",
    "projects": ["proyecto-1"],
    "repositories": ["backend-api"],
    "environments": ["dev", "staging", "prod"]
  },
  "aws": {
    "regions": ["us-east-1"],
    "clusters": [{"name": "eks-prod", "region": "us-east-1"}],
    "s3Buckets": ["artifacts"]
  },
  "defaults": {
    "project": "proyecto-1",
    "environment": "staging"
  }
}
```

## ✨ Funcionalidades Principales

### 1. Gestión de Procesos
- **5 Plantillas predefinidas**: Auditoría IT, DevOps Release, Incident Response, Pipeline DevOps, PR Validation
- **Carga YAML**: Importar procesos personalizados
- **Importación JSON**: Cargar estado guardado
- **Progreso visual**: Barras de progreso por fase y global

### 2. Sistema de Tareas
- **Fases organizadas**: Agrupación lógica de tareas
- **Dependencias**: Tareas bloqueadas hasta completar dependencias
- **Evidencias**: Soporte texto + imágenes (archivo, URL o clipboard)
- **Estados**: Visualización de Completado/Pendiente/Bloqueado
- **Tipos de tarea**: `standard`, `check` (verificación única), `multicheck` (lista de verificaciones)

#### Tipos de Tareas

| Tipo | Descripción | Uso |
|------|-------------|-----|
| `standard` | Tarea tradicional con evidencias | Tareas generales |
| `check` | Un checkbox de verificación | Confirmaciones simples |
| `multicheck` | Lista de checkboxes | Listas de verificación |

```yaml
tasks:
  # Tarea estándar (default)
  - id: "task-standard"
    name: "Documentar cambios"
    type: standard
    evidence:
      type: text
      required: true

  # Tarea tipo check (verificación única)
  - id: "task-check"
    name: "Revisión de seguridad"
    type: check
    checkItem:
      description: "He verificado que no hay vulnerabilidades críticas"
      required: true

  # Tarea tipo multicheck (lista de verificaciones)
  - id: "task-multicheck"
    name: "Checklist de despliegue"
    type: multicheck
    checkItems:
      - description: "Backup de base de datos realizado"
        required: true
      - description: "Tests de humo ejecutados"
        required: true
      - description: "Notificación a stakeholders"
        required: false
```

### 3. Evidencias
| Tipo | Modo S3 | Modo Local |
|------|---------|------------|
| **Texto** | Guardado en JSON | Guardado en localStorage |
| **Imágenes archivo** | Upload a S3 | Conversión base64 |
| **Imágenes URL** | Descarga + S3 | Descarga + base64 |
| **Clipboard (Ctrl+V)** | Upload a S3 | Conversión base64 |

**Ventaja modo local**: Funciona sin internet, sin costos AWS, portable.

#### Clipboard Paste
- **Atajo**: `Ctrl+V` (Windows/Linux) o `Cmd+V` (Mac) en el modal de evidencias
- **Formatos**: PNG, JPG, GIF, WebP
- **Workflow**: Captura de pantalla → Pegar → Auto-upload
- **Indicador visual**: Badge muestra origen "clipboard" en imágenes pegadas

### 4. Variables y Configuración
- **Variables dinámicas**: Definidas en YAML (texto, select, número)
- **Config DevOps**: JSON con datos de entornos, clusters, repositorios
- **Auto-fill**: Variables se completan automáticamente desde config
- **Links dinámicos**: URLs con variables interpoladas (ej: `https://github.com/{org}/{repo}`)

### 5. Time Tracking (Process Timer)
- **Timer de proceso**: Start/Pause manual para controlar tiempo de trabajo
- **Sesiones múltiples**: Historial de sesiones de trabajo con timestamps
- **Tiempo activo**: Cálculo automático de tiempo real trabajado (excluyendo pausas)
- **Persistencia**: Se guarda automáticamente en localStorage
- **Reporte en Word**: Sección detallada con tiempos de inicio, sesiones y duración total

### 6. Gestión de Procesos Múltiples (Tabs + Command Palette)
Sistema profesional de gestión de múltiples procesos inspirado en VS Code/Chrome:

#### Process Tabs (Header)
- **Tabs visuales**: Procesos activos visibles en el header con iconos de estado
- **Estados con iconografía**:
  | Estado | Icono | Color | Descripción |
  |--------|-------|-------|-------------|
  | ▶️ Activo | `Play` | Verde | Proceso en ejecución actual |
  | ⏸️ En Pausa | `Pause` | Ámbar | Proceso pausado al cambiar a otro |
  | ✅ Completado | `CheckCircle2` | Azul | Proceso finalizado exitosamente |
  | ❌ Cancelado | `XCircle` | Rojo | Proceso cancelado por usuario |
- **Overflow menu**: Si hay más de 4 procesos, los adicionales aparecen en dropdown
- **Barra de progreso**: Indicador visual de progreso en cada tab
- **Cerrar tabs**: Botón X al hacer hover para remover procesos

#### Command Palette (`Ctrl+P` / `⌘P`)
- **Acceso rápido**: Shortcut de teclado para búsqueda instantánea
- **Búsqueda fuzzy**: Filtrar procesos por nombre
- **Navegación con teclado**: ↑↓ para navegar, Enter para seleccionar, Esc para cerrar
- **Acciones rápidas**: Exportar o eliminar directamente desde el palette
- **Vista detallada**: Estado, progreso y acciones por proceso

#### Sección "Procesos en Curso" (Home)
- **Tarjetas visuales**: Grid de procesos con iconos de estado y colores
- **Barra de progreso**: Indicador visual por proceso
- **Acciones rápidas**: Reanudar, Exportar JSON, Eliminar
- **Hint de Ctrl+P**: Recordatorio del atajo de teclado

#### Características Comunes
- **Cambio automático**: Al iniciar nuevo proceso, el actual se pausa automáticamente
- **Persistencia de sesión**: Todos los procesos se guardan en localStorage comprimido
- **Snapshots**: Estado completo guardado para restaurar en cualquier momento

### 7. Modo Dark/Light
- **Toggle en header**: Botón Sol/Luna para cambiar entre modos
- **Soporte sistema**: Detecta automáticamente preferencia del sistema operativo
- **Persistencia**: Guarda preferencia en localStorage
- **Variables CSS HSL**: Colores semánticos adaptados a cada modo
- **Componentes**: ThemeProvider (next-themes) + ThemeToggle

### 8. Activities y Subprocesses

#### Jerarquía de Procesos
```
Process
├── phases (obligatorio)
│   └── phase
│       ├── activities (opcional) → activity → tasks
│       └── tasks (directo, legacy)
│
└── subprocesses (opcional, al mismo nivel que phases)
    └── subprocess → referencia externa
```

#### Activities (Nivel Intermedio)
- **Propósito**: Agrupar tareas relacionadas dentro de una fase
- **Opcional**: Las fases pueden tener activities, tasks directos, o ambos
- **Expandible**: En sidebar, las activities se expanden/colapsan
- **Progreso**: Cálculo automático por activity y fase

```yaml
phases:
  - id: "phase-1"
    name: "Fase 1"
    activities:
      - id: "activity-1-1"
        name: "Revisión de Código"
        tasks:
          - id: "task-1-1-1"
            name: "Verificar commits"
```

#### Subprocesses (Referencias Externas)
- **Propósito**: Reutilizar procesos definidos en otros archivos
- **Fuentes soportadas**: GitHub, URL directa, archivo local
- **Opcional**: Pueden marcarse como opcionales (omitibles)
- **Variables**: Pasan variables del proceso padre al subproceso

```yaml
subprocesses:
  - id: "subprocess-security"
    name: "Validación de Seguridad"
    order: 2.5  # Se ejecuta entre fases
    source:
      type: "github"
      url: "https://github.com/org/shared-processes/security-scan.yaml"
    variables:
      repo: "{repository}"
    optional: false
```

**Tipos de fuente:**
| Tipo | Descripción | Ejemplo |
|------|-------------|---------|
| `github` | Archivo en repositorio GitHub | `https://github.com/org/repo/blob/main/process.yaml` |
| `url` | URL directa a archivo YAML | `https://company.com/processes/security.yaml` |
| `local` | Archivo local relativo | `./subprocesses/validation.yaml` |

### 9. Exportación
- **JSON**: Estado completo con evidencias base64 y time tracking (para reanudar)
- **Word**: Documento formal con portada, registro de tiempo, fases, tareas, evidencias

## 🧪 Testing

El proyecto tiene **77 tests unitarios** (100% pasando) y tests E2E con Playwright.

### Tests Unitarios (Vitest)

```bash
npm run test              # Modo watch interactivo
npm run test:run          # Ejecutar una vez
npm run test:coverage     # Con reporte de cobertura
```

**Cobertura de Tests**:
- ✅ **77 tests** pasando en 4 archivos
- Cálculo de progreso (`calculateTaskProgress`, `calculatePhaseProgress`, `calculateProcessProgress`)
- Gestión de dependencias (`checkTaskDependencies`, `updateTaskBlockedStatus`)
- Validación de evidencias (`validateTaskEvidence`, `canCompleteTask`)
- Parseo de YAML (`parseYAMLToProcess`) - 25 tests (incluye task types)
- Import/Export JSON (`importProcessFromJSON`, `exportProcessToJSON`) - 6 tests
- Helpers de proceso (`updateProgress`) - 31 tests
- Store actions (`toggleCheckItem`, `canCompleteCheckTask`) - 15 tests

**Ubicación**: `__tests__/unit/lib/`

### Tests E2E (Playwright)

#### Preparación
```bash
# Instalar navegadores de Playwright (solo primera vez)
npx playwright install chromium
```

#### Ejecución

**Opción A - Automático** (Playwright levanta el servidor):
```bash
npm run test:e2e          # Ejecutar todos los tests E2E
npm run test:e2e:ui       # Modo UI interactivo
```

**Opción B - Manual** (mejor para debugging):
```bash
# Terminal 1: Servidor de desarrollo
npm run dev

# Terminal 2: Ejecutar tests
npx playwright test --project=chromium
npx playwright test --headed              # Ver navegador
npx playwright test --ui                  # Modo UI
npx playwright test load-process          # Test específico
```

#### Flujos E2E Cubiertos

1. **Load Process** (`load-process.spec.ts`):
   - Carga desde plantillas predefinidas
   - Upload de archivos YAML
   - Importación de JSON exportado
   - Validación de errores en YAML inválido

2. **Dependencies** (`dependencies.spec.ts`):
   - Bloqueo de tareas con dependencias
   - Desbloqueo al completar dependencias
   - Cadenas de dependencias múltiples

3. **Export Results** (`export-results.spec.ts`):
   - Exportación a JSON con evidencias
   - Generación de documentos Word
   - Verificación de contenido exportado

#### Selectores data-testid

Componentes con selectores estables para tests:
- `app-header` - Header principal
- `process-template` - Cards de plantillas
- `process-sidebar` - Navegación de fases
- `task-card-{id}` - Tarjetas de tareas
- `task-checkbox` - Checkbox de completado
- `progress-bar` - Barra de progreso
- `export-json-btn`, `export-word-btn` - Botones de exportación

#### Reportes y Artefactos

- **HTML Report**: `playwright-report/index.html` (abrir en navegador)
- **JSON Results**: `test-results.json`
- **Screenshots**: `test-results/` (solo en fallos)
- **Videos**: `test-results/` (si está habilitado)

### Ejecutar Todos los Tests

```bash
npm run test:all          # Unitarios + E2E en secuencia
```

## 📚 Estructura de Procesos YAML

```yaml
process:
  id: example-process
  name: Ejemplo de Proceso
  description: Descripción
  version: "1.0.0"
  
  # Variables globales
  variables:
    - key: project
      label: Proyecto
      type: text          # text | select | number
      required: true
    - key: environment
      label: Ambiente
      type: select
      options: ["dev", "staging", "prod"]
  
  phases:
    - id: phase-1
      name: Fase Inicial
      order: 1
      
      # Links dinámicos a nivel de fase
      dynamicLinks:
        - label: "Dashboard"
          urlTemplate: "https://dash.com/{project}"
          behavior: click           # auto | click
          requiresVariables: ["project"]
      
      tasks:
        - id: task-1
          name: Primera Tarea
          order: 1
          evidence:
            type: both          # text | image | both
            required: true
          references:
            - text: "Documentación"
              url: "https://docs.example.com"
          
        - id: task-2
          name: Segunda Tarea
          order: 2
          dependencies: ["task-1"]    # Depende de task-1
          evidence:
            type: text
            required: false
```

### Tipos de Datos TypeScript

**ProcessState** - Estado completo del proceso:
```typescript
interface ProcessState {
  id: string;
  name: string;
  description: string;
  version: string;
  phases: PhaseState[];
  progress: number;              # 0.0 - 1.0
  variableDefinitions: ProcessVariableYAML[];
  capturedVariables: Record<string, string>;
  loadedAt?: string;
  exportedAt?: string;
  completedAt?: string;
}
```

**TaskState** - Tarea individual:
```typescript
interface TaskState {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  evidenceConfig: { type: 'text' | 'image' | 'both'; required: boolean };
  evidence?: { text?: string; images?: EvidenceImage[] };
  dependencies: string[];          # IDs de tareas requeridas
  isBlocked?: boolean;             # Calculado automáticamente
  dynamicLinks?: DynamicLink[];
}
```

**EvidenceImage** - Imagen de evidencia:
```typescript
interface EvidenceImage {
  id: string;
  name: string;
  cloudStoragePath?: string;     # Solo modo S3
  url: string;                   # URL S3 o data URL base64
  isPublic: boolean;
  source: 'file' | 'url';
  originalUrl?: string;          # Para imágenes de URL
  uploadedAt: string;
}
```

## 🔌 API Routes

### GET /api/processes
Retorna catálogo de plantillas disponibles.

**Response**:
```json
{
  "processes": [
    {
      "id": "it-security-audit",
      "name": "Auditoría de Seguridad IT",
      "description": "Proceso completo de auditoría...",
      "category": "security",
      "icon": "shield",
      "file": "it-security-audit.yaml",
      "version": "1.0.0"
    }
  ]
}
```

### GET /api/processes/[id]
Retorna contenido YAML de un proceso específico.

### POST /api/upload/presigned
Genera URL prefirmada para S3 o indica modo local.

**Request**:
```json
{
  "fileName": "imagen.jpg",
  "contentType": "image/jpeg",
  "isPublic": false
}
```

**Response Modo S3**:
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "cloudStoragePath": "uploads/1234567890-imagen.jpg"
}
```

**Response Modo Local**:
```json
{
  "localMode": true,
  "fileName": "imagen.jpg",
  "contentType": "image/jpeg"
}
```

## 🧩 Componentes UI Principales

### TaskCard
```typescript
interface TaskCardProps {
  task: TaskState;
  phaseId: string;
  onOpenEvidence: () => void;
}
```
- Checkbox de completado (deshabilitado si bloqueado)
- Badge de evidencias (texto/imagen)
- Icono de bloqueo si tiene dependencias
- Botón "Ver Detalles" para evidencias

### EvidenceModal
Modal de gestión de evidencias:
- **Tab Texto**: Textarea para notas
- **Tab Imágenes**: 
  - Upload drag & drop de archivos
  - Input URL para imágenes externas
  - Grid de previews con botón eliminar
- Conversión automática a base64 en modo local

### ProcessSidebar
Sidebar izquierdo:
- Lista de fases con badge de progreso
- Navegación por click
- Resumen de tareas completadas/total

### VariablesForm
Formulario dinámico:
- Generado desde `variableDefinitions`
- Soporte: text, select, number
- Validación de requeridos
- Botón "Auto-fill" desde config DevOps

### ConfigUpload
Upload de configuración:
- Drag & drop de JSON
- Validación de estructura
- Template generator basado en variables del proceso

## 🛠️ Desarrollo

### Comandos Disponibles

```bash
# Instalación
npm install              # Instalar todas las dependencias

# Desarrollo
npm run dev              # Servidor en localhost:3000 (o 3001)
npm run build            # Build de producción
npm run start            # Ejecutar build de producción
npm run lint             # Linting con ESLint

# Testing
npm run test             # Tests unitarios (modo watch)
npm run test:run         # Tests unitarios (una vez)
npm run test:coverage    # Tests con cobertura
npm run test:e2e         # Tests E2E con Playwright
npm run test:e2e:ui      # Tests E2E en modo UI
npm run test:all         # Todos los tests (unitarios + E2E)
```

### Scripts de Desarrollo

- **dev**: Inicia servidor de desarrollo con hot-reload
- **build**: Genera build optimizado para producción
- **start**: Ejecuta la aplicación en modo producción
- **lint**: Verifica código con ESLint
- **test**: Ejecuta Vitest en modo watch
- **test:run**: Ejecuta tests unitarios una sola vez
- **test:coverage**: Genera reporte de cobertura de código
- **test:e2e**: Ejecuta tests E2E (levanta servidor automáticamente)
- **test:e2e:ui**: Abre interfaz interactiva de Playwright
- **test:all**: Ejecuta todos los tests en secuencia

### Estructura de Desarrollo

```bash
# Workflow típico de desarrollo
1. npm install           # Instalar dependencias
2. npm run dev           # Levantar servidor
3. npm run test          # Tests en modo watch (opcional)
4. npm run build         # Verificar build antes de commit
5. npm run test:all      # Ejecutar todos los tests
```

## 🐳 Docker

### Opción 1: Ejecutar con Imagen Pre-construida (Recomendado)

Usa esta opción si solo quieres ejecutar la aplicación sin necesidad de compilar código fuente.

#### Paso 1: Descargar la Imagen

```bash
# Pull la última versión estable
docker pull habolanos/devsecops-process-tracker:latest

# O pull una versión específica (reemplaza X.X.X con el número de versión)
docker pull habolanos/devsecops-process-tracker:1.20.0
```

#### Paso 2: Ejecutar el Contenedor

**Opción A - Básica (modo local, datos en localStorage):**
```bash
docker run -d \
  --name devsecops-tracker \
  -p 3000:3000 \
  habolanos/devsecops-process-tracker:latest
```

**Opción B - Con persistencia de datos (volumen Docker):**
```bash
# Crear volumen para persistir datos
docker volume create devsecops-data

# Ejecutar con volumen montado
docker run -d \
  --name devsecops-tracker \
  -p 3000:3000 \
  -v devsecops-data:/app/data \
  habolanos/devsecops-process-tracker:latest
```

**Opción C - Con variables de entorno (S3 opcional):**
```bash
docker run -d \
  --name devsecops-tracker \
  -p 3000:3000 \
  -e AWS_BUCKET_NAME=tu-bucket \
  -e AWS_REGION=us-east-1 \
  -e AWS_ACCESS_KEY_ID=tu-key \
  -e AWS_SECRET_ACCESS_KEY=tu-secret \
  habolanos/devsecops-process-tracker:latest
```

#### Paso 3: Acceder a la Aplicación

- Abre tu navegador en: `http://localhost:3000`
- La aplicación estará lista en ~5-10 segundos

#### Paso 4: Comandos Útiles de Gestión

```bash
# Ver logs en tiempo real
docker logs -f devsecops-tracker

# Detener el contenedor
docker stop devsecops-tracker

# Iniciar el contenedor (después de detener)
docker start devsecops-tracker

# Eliminar el contenedor (datos se pierden si no usaste volumen)
docker rm devsecops-tracker

# Actualizar a nueva versión
docker pull habolanos/devsecops-process-tracker:latest
docker stop devsecops-tracker
docker rm devsecops-tracker
docker run -d --name devsecops-tracker -p 3000:3000 habolanos/devsecops-process-tracker:latest
```

#### Verificación de Seguridad (Firma Cosign)

```bash
# Verificar firma criptográfica de la imagen
cosign verify habolanos/devsecops-process-tracker:latest \
  --certificate-identity-regexp="https://github.com/habolanos/devsecops-process-tracker/*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

---

### Opción 2: Construir y Ejecutar desde Código Fuente

Usa esta opción si necesitas modificar el código, agregar funcionalidades personalizadas, o debuggear.

#### Paso 1: Clonar el Repositorio

```bash
# Clonar el código fuente
git clone https://github.com/habolanos/devsecops-process-tracker.git

# Entrar al directorio
cd devsecops-process-tracker
```

#### Paso 2: Opciones de Ejecución

**Opción A - Docker Compose (Recomendado para desarrollo):**

```bash
# Construir y ejecutar con docker-compose
docker-compose up --build

# Ejecutar en segundo plano
docker-compose up --build -d

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

**Opción B - Docker Build Manual:**

```bash
# Construir la imagen localmente
docker build -t devsecops-tracker:local .

# Ejecutar la imagen local
docker run -d \
  --name devsecops-tracker-local \
  -p 3000:3000 \
  devsecops-tracker:local
```

**Opción C - Desarrollo con Hot-Reload (volumen montado):**

```bash
# Ejecutar con código fuente montado (cambios se reflejan inmediatamente)
docker run -d \
  --name devsecops-tracker-dev \
  -p 3000:3000 \
  -v $(pwd)/nextjs_space:/app \
  -v /app/node_modules \
  devsecops-tracker:local
```

#### Paso 3: Desarrollo Local (Sin Docker)

Si prefieres desarrollar sin Docker:

```bash
# Entrar al directorio del proyecto Next.js
cd nextjs_space

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar tests
npm run test

# Build de producción
npm run build
npm run start
```

#### Paso 4: Publicar tu Propia Imagen (Opcional)

Si hiciste modificaciones y quieres publicar tu imagen:

```bash
# Taggear con tu usuario de Docker Hub
docker tag devsecops-tracker:local tuusuario/devsecops-process-tracker:custom

# Login a Docker Hub
docker login

# Push a Docker Hub
docker push tuusuario/devsecops-process-tracker:custom
```

---

### Resumen de Comparación

| Aspecto | Imagen Pre-construida | Construir desde Código |
|---------|----------------------|------------------------|
| **Tiempo de inicio** | ~5-10 segundos | ~2-5 minutos (primera vez) |
| **Requiere código** | No | Sí |
| **Personalizable** | No | Sí |
| **Hot-reload** | No | Sí (con volumen) |
| **Ideal para** | Usuarios finales | Desarrolladores |
| **Persistencia** | localStorage o S3 | localStorage, S3, o volúmenes |

### Troubleshooting Docker

| Problema | Solución |
|----------|----------|
| `port 3000 already in use` | Cambiar puerto: `-p 3001:3000` |
| `permission denied` | Ejecutar con `sudo` (Linux) o verificar Docker Desktop (Windows/Mac) |
| `image not found` | Ejecutar `docker pull` nuevamente |
| Datos no persisten | Usar volumen Docker o configurar S3 |
| Contenedor no inicia | Ver logs: `docker logs devsecops-tracker` |



## 🚀 CI/CD Pipelines

El proyecto incluye configuraciones de CI/CD para Azure DevOps y GitLab que automatizan el proceso de testing, seguridad, build y deployment.

### Azure DevOps Pipeline

**Archivo:** `azure-pipelines.yml`

El pipeline de Azure DevOps incluye 4 stages principales:

1. **Test Stage**
   - Tests unitarios con Vitest (51 tests)
   - Tests E2E con Playwright
   - Publicación de resultados y cobertura de código
   - Cache de dependencias npm para optimización

2. **Security Scan Stage**
   - `npm audit` para vulnerabilidades de dependencias
   - ESLint para análisis estático de código
   - Ejecución en paralelo con stage de tests

3. **Build Stage**
   - Build de producción de Next.js
   - Generación de artefactos comprimidos
   - Solo se ejecuta en branch `main`

4. **Deploy Stage**
   - Deployment a Azure App Service
   - Ambiente de producción con aprobación manual
   - Configuración de runtime Node.js 20 LTS

**Variables requeridas:**
- `azureSubscription`: Conexión de servicio de Azure
- `webAppName`: Nombre del Azure Web App

### GitLab CI/CD Pipeline

**Archivo:** `.gitlab-ci.yml`

El pipeline de GitLab incluye 5 stages:

1. **Install Stage**
   - Instalación de dependencias con cache
   - Artifacts compartidos entre jobs

2. **Test Stage**
   - Tests unitarios con Vitest
   - Tests E2E con Playwright (imagen Docker específica)
   - Linting con ESLint
   - Reportes de cobertura integrados

3. **Security Stage**
   - `npm audit` para escaneo de dependencias
   - Dependency Scanning (GitLab Ultimate)
   - SAST - Static Application Security Testing (GitLab Ultimate)

4. **Build Stage**
   - Build de Next.js para producción
   - Build de imagen Docker (opcional, manual)
   - Artifacts con expiración de 1 semana

5. **Deploy Stage**
   - Deploy a staging (branch `develop`, manual)
   - Deploy a producción (branch `main`, manual)
   - Soporte para Vercel, Docker, Kubernetes

**Características:**
- Cache inteligente basado en `package-lock.json`
- Reportes de cobertura visualizados en merge requests
- Cleanup automático de archivos temporales
- Soporte para múltiples estrategias de deployment

### Configuración Inicial

#### Azure DevOps
1. Crear Service Connection a Azure
2. Configurar variables `azureSubscription` y `webAppName`
3. Importar `azure-pipelines.yml` en Azure Pipelines
4. Configurar branch policies para `main`

#### GitLab
1. Configurar variables de entorno en Settings > CI/CD
2. Habilitar GitLab Runner
3. Configurar deployment tokens si es necesario
4. El pipeline se ejecuta automáticamente en push/merge request

### GitHub Actions Pipeline

**Archivos:** `.github/workflows/ci.yml`, `release.yml`, `docker-publish.yml`

El pipeline de GitHub Actions implementa estándares internacionales de seguridad y calidad:

#### Workflows

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| **CI Pipeline** | Push/PR a main, develop | Lint, Tests, Security Scan, Build |
| **Release** | Push a main | Semantic versioning + Changelog |
| **Docker Publish** | Release publicado | Build multi-arch, Sign, SBOM, Push |

#### Estándares Implementados

| Estándar | Herramienta | Descripción |
|----------|-------------|-------------|
| **Semantic Versioning** | semantic-release | Versionado automático basado en commits |
| **Conventional Commits** | commitlint | Validación de formato de commits |
| **SAST** | CodeQL | Análisis estático de seguridad |
| **Dependency Scan** | npm audit, Trivy | Vulnerabilidades en dependencias |
| **Container Scan** | Trivy | Vulnerabilidades en imagen Docker |
| **SBOM** | Syft | Software Bill of Materials (SPDX + CycloneDX) |
| **Image Signing** | Cosign (Sigstore) | Firma criptográfica de imágenes |
| **SLSA Level 3** | GitHub Attestations | Provenance de artefactos |
| **OCI Compliance** | Docker Buildx | Imágenes multi-plataforma (amd64/arm64) |

#### Configuración de Secrets

En GitHub Repository → Settings → Secrets and variables → Actions:

| Secret | Descripción | Cómo obtenerlo |
|--------|-------------|----------------|
| `DOCKERHUB_USERNAME` | Usuario de Docker Hub | Tu nombre de usuario |
| `DOCKERHUB_TOKEN` | Access Token de Docker Hub | Docker Hub → Account Settings → Security → New Access Token |
| `CODECOV_TOKEN` | Token para cobertura (opcional) | codecov.io → Settings → Repository Token |

#### Conventional Commits

Los commits deben seguir el formato:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Tipos permitidos:**
- `feat`: Nueva funcionalidad (trigger: minor release)
- `fix`: Corrección de bug (trigger: patch release)
- `docs`: Solo documentación
- `style`: Formato de código
- `refactor`: Refactorización
- `perf`: Mejora de rendimiento
- `test`: Tests
- `build`: Sistema de build
- `ci`: Configuración CI/CD
- `chore`: Mantenimiento

**Ejemplos:**
```bash
feat(tasks): add multicheck task type
fix(evidence): correct clipboard paste on Safari
docs(readme): update CI/CD documentation
perf(store): optimize state updates
```

## 📊 Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-04-06 | 1.29.0 | **Form Task Type**: Nuevo tipo de tarea `form` para formularios con layout de columnas (grid 1-4 columnas). Características: campos de tipos text, number, email, date, time, datetime, boolean, textarea, image, select; layout configurable (vertical/grid) con gap; colSpan para campos que ocupan múltiples columnas; validación por campo (required, minLength, maxLength, pattern regex); evidencia tipo "form" (datos del formulario como evidencia); mapeo a Excel por fieldId → celda (F85-F87, S85-S87). Componentes `FormInput` y `FormRenderer`, acción `updateFormData` en store, configuración YAML `formConfig` con `layout` y `fields`. Interfaces `FormFieldConfig`, `FormLayoutConfig`, `FormFieldValue` |
| 2026-04-06 | 1.28.0 | **Detail List Task Type**: Nuevo tipo de tarea `detail-list` para capturar texto detallado por cada item de una tarea `dynamic-list`. Características: referencia por ID a tarea fuente (sourceTaskId), renderizado dinámico de inputs por cada item, validación de completitud, mapeo a Excel (F5-F13 para lista, B47-B56/B60-B69/B72-B81 para detalles repetidos en 3 secciones). Componente `DetailListInput`, acción `updateDetailData` en store, configuración YAML `detailConfig`. Interface `DetailItem`, actualización de `processToReleaseReport` para extracción de datos |
| 2026-04-06 | 1.27.0 | **Performance Optimization & Evidence Flow**: Optimización de checkboxes usando Immer para mutaciones eficientes (sin recrear árbol de objetos), debounce de 1 segundo en localStorage (evita compresión LZ-string en cada click), React.memo en TaskCard/ActivityCard para evitar re-renders innecesarios, useCallback para funciones estables. UI mejorada: "Terminar Tarea" en lugar de "Marcar como Completada", botones "Guardar" y "Terminar Tarea" visibles directamente para dynamic-list/multicheck (sin "Ver Detalles"). Botón "Guardar": muestra toast para texto, abre modal para imagen. Botón "Terminar Tarea": abre modal si requiere evidencia (text/image/both) y required=true |
| 2026-04-06 | 1.26.0 | **Dynamic List Task Type**: Nuevo tipo de tarea `dynamic-list` para capturar listas de items (repositorios, componentes, URLs, etc.). Características: parsing automático por separadores (coma, punto y coma, salto de línea), validación de mínimo/máximo items, detección de duplicados, UI con textarea + chips eliminables. Componente `DynamicListInput`, acción `updateListData` en store, configuración YAML `listConfig`. Tests unitarios incluidos. Proceso `release-checklist.yaml` actualizado con tarea de ejemplo |
| 2026-04-06 | 1.25.0 | **Process Page Layout Refactor**: Header fijo con contenido scrollable. Nombre del proceso y tabs de fases en misma línea para optimizar espacio. Barra de progreso global en formato horizontal (label + barra + porcentaje en una línea). Botones del timer restaurados con texto visible. Tamaños de texto unificados (proceso y fase: text-xl) |
| 2026-04-06 | 1.24.0 | **Estimated Time & Semaphore Colors**: Nuevo campo `estimatedTime` en templates YAML (formato legible: "2h", "30m", "1h30m"). Timer con colorimetría semáforo: 🟢 verde (0-60%), 🟡 amarillo (60-100%), 🔴 rojo (>100%). Indicador de estado con mensaje y porcentaje. Funciones `parseTimeString()` y `getTimeStatus()` en helpers. Templates actualizados con tiempos estimados |
| 2026-04-06 | 1.23.0 | **Fixes & Performance**: Timer auto-start mejorado (funciona con procesos resumidos), botón "Volver al inicio" pausa el timer, animación barra de progreso GitHub corregida (position absolute, overflow-hidden), optimización de rendimiento con selectores Zustand individuales para evitar re-renders, fix botones anidados en ProcessTabs |
| 2026-04-06 | 1.22.0 | **Global Progress Indicator**: Implementación de indicador de progreso global estilo GitHub (barra azul delgada) que aparece durante operaciones de carga/exportación. Store global loading-store para rastrear operaciones activas. Integrado en layout.tsx y componentes existentes (exportaciones, carga de plantillas/archivos). Tests: 11 unitarios para store, 4 unitarios para componente, 6 E2E Playwright |
| 2026-04-06 | 1.21.0 | **Auto-start Process Timer**: Timer del proceso se inicia automáticamente en primera interacción del usuario (clic en tarea/cambio de fase). Flag hasStartedInteraction en store para rastrear interacción. Tests: 11 nuevos tests en store-timer.test.ts, 5 tests en process-timer-auto-start.test.ts |
| 2026-04-06 | 1.21.0 | **Security Vulnerabilities Fixed**: Resolución completa de vulnerabilidades npm (minimatch CVE-2026-27903/27904, brace-expansion CVE-2026-33750, picomatch CVE-2026-33671/33672, tar CVE-2026-29786/31802) mediante overrides en package.json (minimatch@3.1.4, brace-expansion@1.1.13, picomatch@4.0.4, tar@7.5.11) compatibles con ESLint, actualización de npm en Dockerfile, migración a Alpine 3.21.5 en base image Docker. Vulnerabilidades en npm global (brace-expansion, picomatch) ignoradas en .trivyignore ya que no son explotables en runtime. Trivy scan: 0 vulnerabilidades en Alpine y paquetes npm de la aplicación |
| 2026-04-04 | 1.20.0 | **Docker Hub Metadata & Cleanup**: Actualización automática de descripción, overview y categorías en Docker Hub, cleanup de imágenes antiguas preservando solo versión semver en Docker Hub y GHCR, fix API GHCR para paquetes de usuario |
| 2026-04-04 | 1.19.0 | **CI/CD Fixes**: Fix Node.js 24 warnings, Dockerfile ARG declarations para BUILD_DATE/VCS_REF/VERSION, CodeQL v4 upgrade, FORCE_JAVASCRIPT_ACTIONS_TO_NODE24, simplificación de tags Docker (solo semver sin major/minor aliases) |
| 2026-04-02 | 1.13.1 | **Fix CI/CD y Tests**: Migración ESLint de `next lint` a ESLint CLI, permisos SARIF corregidos (`security-events: write`), CodeQL actualizado a v4, coverage tests aumentado a 127 tests (67% coverage), tipos corregidos en json-utils.ts, script Abacus AI eliminado por seguridad |
| 2026-04-02 | 1.13.0 | **CI/CD con GitHub Actions**: Workflows completos (CI, Release, Docker), Semantic Versioning automático, Conventional Commits, CodeQL SAST, Trivy scanning, Docker multi-arch con Cosign signing, SBOM (SPDX/CycloneDX), SLSA Level 3 attestations, health check endpoint |
| 2026-04-02 | 1.12.0 | **Task Types y Clipboard**: Soporte para 3 tipos de tareas (`standard`, `check`, `multicheck`), validación de checkItems requeridos/opcionales, clipboard paste (Ctrl+V) para imágenes, botón "Terminar Tarea" en modal, ActivityCard con imágenes y links dinámicos, i18n actualizado |
| 2026-04-02 | 1.11.0 | **Activities y Subprocesses**: Nuevo nivel jerárquico `activities` entre phases y tasks, soporte para `subprocesses` como referencias a procesos externos (GitHub/URL/local), subprocess-loader para carga dinámica, sidebar expandible con actividades, i18n para nuevos componentes |
| 2026-04-01 | 1.10.0 | **Modo Dark/Light**: Toggle Sol/Luna en header, soporte sistema operativo, variables CSS HSL semánticas, ThemeProvider (next-themes), migración completa de colores en páginas y componentes |
| 2026-04-01 | 1.9.0 | **Gestión de Procesos Múltiples**: Process Tabs en header, Command Palette (Ctrl+P), sección "Procesos en Curso" con tarjetas visuales estilo templates. Iconografía de estados, barras de progreso, acciones rápidas. Session store con Zustand y persistencia comprimida |
| 2026-03-31 | 1.8.0 | **Seguridad y Performance Pro**: Validación Zod en APIs, Rate Limiting, Sanitización XSS, Persistencia comprimida (lz-string), Manejo de errores centralizado, Virtualización de listas (@tanstack/react-virtual), Sistema Optimistic Updates |
| 2026-03-31 | 1.7.1 | **Análisis Pro v2**: Reporte completo de arquitectura y UX con 30+ mejoras priorizadas (ver `outcome/ARCHITECTURE_UX_ANALYSIS_v2.md`) |
| 2026-03-31 | 1.7.0 | **Mejoras Pro**: Error Boundary global, accesibilidad ARIA, lazy loading modales, sistema Toast, optimización Zustand, skeletons |
| 2026-03-31 | 1.6.2 | **UI Compactación**: Tarjetas de tareas y sidebar más compactos, reducción ~30% espacio vertical |
| 2026-03-31 | 1.6.1 | **Bugfix**: Tiempos correctos en exports, imágenes con proporciones preservadas en Word |
| 2026-03-30 | 1.6.0 | **Process Timer**: Start/Pause para tracking de tiempo, múltiples sesiones, reporte de tiempos en Word |
| 2026-03-29 | 1.5.0 | Tests E2E con Playwright, modo local base64 para imágenes, 0 vulnerabilidades, actualización Next.js 15.5.14 |
| 2026-03-27 | 1.4.1 | Generación automática de template JSON basado en variables |
| 2026-03-27 | 1.4.0 | Configuración DevOps con auto-fill de variables |
| 2026-03-27 | 1.3.0 | Nuevo proceso `pull-request-validation.yaml` (6 fases, 21 tareas) |
| 2026-03-27 | 1.2.0 | Variables de proceso y links dinámicos parametrizables |
| 2026-03-27 | 1.1.0 | Procesos precargados, API `/api/processes` |
| 2026-03-01 | 1.0.0 | Versión inicial con carga YAML/JSON, evidencias, exportación Word |

## 📄 Licencia

GNU General Public License v3.0 (GPL-3.0) - Software libre para uso educativo y comercial.

Este programa es software libre: puedes redistribuirlo y/o modificarlo bajo los términos de la Licencia Pública General de GNU publicada por la Free Software Foundation, ya sea la versión 3 de la Licencia, o (a tu elección) cualquier versión posterior.

Este programa se distribuye con la esperanza de que sea útil, pero SIN NINGUNA GARANTÍA; sin siquiera la garantía implícita de COMERCIALIZACIÓN o IDONEIDAD PARA UN PROPÓSITO PARTICULAR. Consulta la Licencia Pública General de GNU para más detalles.

---

**DevSecOps Process Tracker** © 2026 - Desarrollado por **Harold Adrian** con ❤️ usando Next.js y TypeScript
