# DevSecOps Process Tracker

Aplicación web para gestión y seguimiento de procesos DevSecOps con soporte para evidencias, dependencias entre tareas, links dinámicos y exportación de resultados.

## 🚀 Stack Tecnológico

| Tecnología | Versión | Descripción |
|------------|---------|-------------|
| **Next.js** | 15.5.14 | Framework React con App Router |
| **TypeScript** | 5.2.2 | Tipado estático |
| **Tailwind CSS** | 3.3.3 + shadcn/ui | Estilos y componentes UI |
| **Zustand** | 5.0.12 | Estado global con persistencia localStorage |
| **Vitest** | 1.0.4 | Tests unitarios |
| **Playwright** | 1.40.0 | Tests E2E |
| **AWS SDK** | 3.758.0 | Integración S3 (opcional) |
| **js-yaml** | 4.1.1 | Parseo de YAML |
| **docx** | 9.6.1 | Generación de documentos Word |
| **Lucide React** | 0.446.0 | Iconos |

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
│   │       ├── process-sidebar.tsx # Sidebar de navegación de fases
│   │       ├── progress-bar.tsx    # Barra de progreso visual
│   │       ├── evidence-modal.tsx  # Modal de gestión de evidencias
│   │       ├── variables-form.tsx  # Formulario de variables dinámicas
│   │       ├── config-upload.tsx   # Upload de configuración DevOps
│   │       └── dynamic-link-button.tsx # Botones con URLs dinámicas
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
│   ├── config-store.ts         # Zustand store - config DevOps
│   ├── helpers.ts              # Funciones: progreso, dependencias, validación
│   ├── yaml-parser.ts          # Parser YAML → ProcessState
│   ├── json-utils.ts           # Import/Export JSON con evidencias
│   ├── word-generator.ts       # Generador de documentos Word
│   ├── i18n-context.tsx        # Contexto de internacionalización (ES/EN)
│   ├── aws-config.ts           # Config AWS S3 (modo local si no hay credenciales)
│   ├── s3.ts                   # Utilidades S3 (upload, download, delete)
│   ├── config-loader.ts        # Carga y parseo de config DevOps
│   └── devops-config-types.ts  # Tipos para configuración DevOps
│
├── data/                        # Datos estáticos
│   ├── processes/              # Procesos YAML predefinidos
│   │   ├── index.json         # Catálogo: 5 plantillas
│   │   ├── it-security-audit.yaml      # 3 fases, 13 tareas
│   │   ├── devops-release.yaml         # 3 fases, 10 tareas
│   │   ├── incident-response.yaml        # 4 fases, 12 tareas
│   │   ├── devops-pipeline.yaml        # Con variables y links dinámicos
│   │   └── pull-request-validation.yaml # 6 fases, 21 tareas, 8 variables
│   └── devops-config.example.json      # Template de configuración
│
├── __tests__/                   # Tests
│   ├── unit/lib/               # Tests unitarios (51 tests)
│   │   ├── helpers.test.ts    # Progreso, dependencias, validación
│   │   ├── yaml-parser.test.ts # Parseo YAML
│   │   └── json-utils.test.ts  # Import/export JSON
│   ├── e2e/flows/              # Tests E2E con Playwright
│   │   ├── load-process.spec.ts    # Carga plantillas/YAML/JSON
│   │   ├── dependencies.spec.ts    # Flujo de dependencias
│   │   └── export-results.spec.ts  # Exportación JSON y Word
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
- npm (recomendado usar `--legacy-peer-deps`)

### Instalación

```bash
# Entrar al directorio
cd nextjs_space

# Instalar dependencias (usar legacy-peer-deps por conflictos de versiones)
npm install --legacy-peer-deps

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
- **Evidencias**: Soporte texto + imágenes (archivo o URL)
- **Estados**: Visualización de Completado/Pendiente/Bloqueado

### 3. Evidencias
| Tipo | Modo S3 | Modo Local |
|------|---------|------------|
| **Texto** | Guardado en JSON | Guardado en localStorage |
| **Imágenes archivo** | Upload a S3 | Conversión base64 |
| **Imágenes URL** | Descarga + S3 | Descarga + base64 |

**Ventaja modo local**: Funciona sin internet, sin costos AWS, portable.

### 4. Variables y Configuración
- **Variables dinámicas**: Definidas en YAML (texto, select, número)
- **Config DevOps**: JSON con datos de entornos, clusters, repositorios
- **Auto-fill**: Variables se completan automáticamente desde config
- **Links dinámicos**: URLs con variables interpoladas (ej: `https://github.com/{org}/{repo}`)

### 5. Exportación
- **JSON**: Estado completo con evidencias base64 (para reanudar)
- **Word**: Documento formal con portada, fases, tareas, evidencias

## 🧪 Testing

El proyecto tiene **51 tests unitarios** y tests E2E con Playwright.

### Tests Unitarios (Vitest)
```bash
npm run test       # Modo watch
npm run test:run   # Una vez
npm run test:coverage  # Con cobertura
```

**Tests incluyen**:
- Cálculo de progreso (`calculateTaskProgress`, `calculatePhaseProgress`)
- Gestión de dependencias (`checkTaskDependencies`, `updateTaskBlockedStatus`)
- Validación de evidencias (`validateTaskEvidence`)
- Parseo de YAML (`parseYAMLToProcess`)
- Import/Export JSON (`importProcessFromJSON`, `exportProcessToJSON`)

### Tests E2E (Playwright)
```bash
# Opción 1: Playwright levanta servidor automáticamente
npm run test:e2e

# Opción 2: Manual (mejor para debug)
# Terminal 1:
npm run dev
# Terminal 2:
npx playwright test --project=chromium
```

**Flujos testeados**:
1. **Load Process**: Carga desde plantillas, YAML, JSON
2. **Dependencies**: Verifica bloqueo/desbloqueo de tareas
3. **Export**: Exportación JSON y Word con evidencias

**Selectores data-testid** para tests:
- `app-header`, `process-template`, `process-sidebar`
- `task-card-{id}`, `task-checkbox`, `progress-bar`
- `export-json-btn`, `export-word-btn`

### Reportes
- HTML: `playwright-report/index.html`
- JSON: `test-results.json`
- Screenshots: `test-results/` (solo fallos)

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

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Desarrollo
npm run dev              # Servidor en localhost:3000

# Testing
npm run test:run         # Tests unitarios (51 tests)
npm run test:e2e         # Tests E2E (Playwright)

# Build
npm run build            # Producción
npm run lint             # Linting
```

## 🐳 Docker

```bash
# Construir y ejecutar
docker-compose up --build

# Acceder en http://localhost:3000
```

## 📊 Historial de Cambios

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-03-29 | 1.5.0 | Tests E2E con Playwright, modo local para imágenes, vulnerabilidades parcheadas |
| 2026-03-27 | 1.4.1 | Generación automática de template JSON basado en variables |
| 2026-03-27 | 1.4.0 | Configuración DevOps con auto-fill de variables |
| 2026-03-27 | 1.3.0 | Nuevo proceso `pull-request-validation.yaml` (6 fases, 21 tareas) |
| 2026-03-27 | 1.2.0 | Variables de proceso y links dinámicos parametrizables |
| 2026-03-27 | 1.1.0 | Procesos precargados, API `/api/processes` |
| 2026-03-01 | 1.0.0 | Versión inicial con carga YAML/JSON, evidencias, exportación Word |

## 📄 Licencia

MIT License - Libre para uso educativo y comercial.

---

**DevSecOps Process Tracker** © 2026 - Desarrollado por **Harold Adrian** con ❤️ usando Next.js y TypeScript
