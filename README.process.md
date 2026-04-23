# Guía Completa de Procesos YAML

Esta guía proporciona una documentación exhaustiva sobre cómo crear y configurar procesos YAML para el DevSecOps Process Tracker.

## 📋 Tabla de Contenidos

- [Introducción](#introducción)
- [Estructura General](#estructura-general)
- [Sección Process](#sección-process)
- [Variables de Proceso](#variables-de-proceso)
- [Fases (Phases)](#fases-phases)
- [Actividades (Activities)](#actividades-activities)
- [Subprocesos (Subprocesses)](#subprocesos-subprocesses)
- [Tipos de Tareas](#tipos-de-tareas)
  - [Standard](#standard)
  - [Check](#check)
  - [Multicheck](#multicheck)
  - [Export-Excel](#export-excel)
  - [Dynamic-List](#dynamic-list)
  - [Detail-List](#detail-list)
  - [Detail-Table](#detail-table)
  - [Form](#form)
  - [Variables de Salida (outputVars)](#variables-de-salida-de-tareas-outputvars)
  - [Opciones Dinámicas (optionsFrom)](#variables-de-proceso-con-opciones-dinámicas-optionsfrom)
- [Configuraciones Avanzadas](#configuraciones-avanzadas)
  - [Referencias](#referencias)
  - [Dependencias](#dependencias)
  - [Links Dinámicos](#links-dinámicos)
  - [Evidencia](#evidencia)
  - [Confirmación de cierre (completionAlert)](#confirmación-de-cierre-completionalert)
- [Ejemplo Paso a Paso](#ejemplo-paso-a-paso)
- [Buenas Prácticas](#buenas-prácticas)
- [Referencias de Archivos Existentes](#referencias-de-archivos-existentes)

---

## Introducción

Los archivos YAML de procesos definen flujos de trabajo estructurados para validar y documentar procesos de DevOps, seguridad, auditoría y más. Cada proceso consiste en una serie de fases, actividades y tareas que deben completarse en un orden específico.

**Ubicación:** `data/processes/*.yaml`

**Ventajas:**
- Definición declarativa de procesos
- Versionado controlado de flujos de trabajo
- Reutilización de componentes
- Validación automática de estructura

---

## Estructura General

```yaml
process:
  id: "unique-process-id"
  name: "Nombre del Proceso"
  description: "Descripción detallada del propósito"
  version: "1.0.0"
  estimatedTime: "2h"
  
  variables: []
  
  phases: []
```

**Campos obligatorios:**
- `id`: Identificador único del proceso
- `name`: Nombre descriptivo
- `description`: Explicación del propósito
- `version`: Versión del proceso (formato semántico)
- `estimatedTime`: Tiempo estimado (formato: "2h", "30m", "1h30m")
- `phases`: Lista de fases del proceso

**Campos opcionales:**
- `variables`: Variables parametrizables del proceso

---

## Sección Process

### ID del Proceso

El ID debe ser único y descriptivo:

```yaml
process:
  id: "devops-pipeline-2026"
```

**Buenas prácticas:**
- Usar kebab-case
- Incluir año o versión
- Ser descriptivo del dominio

### Versión

Formato semántico (MAJOR.MINOR.PATCH), con soporte opcional de pre-release y build metadata:

```yaml
process:
  version: "1.2.3"
  # También válidos:
  # version: "2.0.0-rc.1"
  # version: "1.0.0+build.5"
```

- **MAJOR**: Cambios incompatibles en estructura.
- **MINOR**: Nuevas funcionalidades compatibles.
- **PATCH**: Correcciones de errores.
- **Pre-release / build**: identificadores separados por `-` o `+` (`rc.1`, `beta.2`, `build.42`).

> El patrón se valida contra el JSON Schema **v1.2.0** (`schemas/process.schema.json`) con la expresión `^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$`.

### Tiempo Estimado

Formato legible para humanos, compuesto por segmentos `h` (horas), `m` (minutos) o `s` (segundos). Se admiten decimales. Los segmentos son aditivos.

```yaml
process:
  estimatedTime: "1h30m"   # 1 hora y 30 minutos
  # Otros ejemplos válidos:
  # "45m"     # 45 minutos
  # "2h"      # 2 horas
  # "1.5h"    # 1.5 horas (decimal admitido)
  # "3h15m"   # 3 horas y 15 minutos
  # "30s"     # 30 segundos
```

> El parser (`parseTimeString` en `lib/helpers.ts`) **no soporta días (`d`)**. Use horas (`24h` = 1 día).

---

## Variables de Proceso

Las variables permiten parametrizar el proceso con valores ingresados por el usuario al inicio.

```yaml
variables:
  - key: "organization"
    label: "Organización (GitHub/GitLab)"
    type: "text"
    required: true
    placeholder: "ej: mi-empresa"
  
  - key: "environment"
    label: "Ambiente de Despliegue"
    type: "select"
    required: true
    options:
      - "development"
      - "staging"
      - "production"
  
  - key: "projectId"
    label: "ID del Proyecto"
    type: "text"
    required: false
    placeholder: "ej: PRJ-001"
    defaultValue: "DEFAULT-001"
```

**Campos:**
- `key`: Identificador único de la variable
- `label`: Etiqueta mostrada al usuario
- `type`: Tipo de input (`text`, `select`, `number`)
- `required`: Si es obligatoria
- `placeholder`: Texto de ayuda en el input
- `defaultValue`: Valor por defecto (opcional)
- `options`: Lista de opciones (para tipo `select`)

**Uso en el proceso:**
Las variables se pueden usar en:
- Links dinámicos: `{organization}`
- Descripciones de tareas
- Configuraciones de exportación

---

## Fases (Phases)

Las fases agrupan tareas relacionadas en etapas lógicas del proceso.

```yaml
phases:
  - id: "phase-1-preparation"
    name: "Fase 1: Preparación"
    description: "Preparar el entorno y recursos"
    order: 1
    dynamicLinks: []
    tasks: []
```

**Campos:**
- `id`: Identificador único de la fase
- `name`: Nombre descriptivo
- `description`: Explicación del propósito
- `order`: Orden de ejecución (1, 2, 3...)
- `dynamicLinks`: Links dinámicos a nivel de fase (opcional)
- `tasks`: Lista de tareas directas de la fase
- `activities`: Lista de actividades agrupadas (opcional)

**Buenas prácticas:**
- Usar IDs descriptivos: `phase-1-preparation`
- Incluir número de orden en el nombre
- Mantener fases cohesivas en propósito
- Limitar a 3-7 fases por proceso

---

## Actividades (Activities)

Las actividades permiten agrupar tareas dentro de una fase para mayor organización.

```yaml
phases:
  - id: "phase-1"
    name: "Fase 1"
    order: 1
    activities:
      - id: "activity-1-1"
        name: "Actividad 1.1"
        description: "Subgrupo de tareas"
        order: 1
        dynamicLinks: []
        images: []
        tasks: []
```

**Cuándo usar actividades:**
- Cuando una fase tiene muchos tareas (>10)
- Para agrupar tareas por categoría o responsable
- Para estructurar procesos complejos jerárquicamente

**Cuándo NO usar actividades:**
- Procesos simples con pocas tareas
- Cuando todas las tareas son independientes

---

## Subprocesos (Subprocesses)

Los subprocesos permiten incluir procesos externos dentro de un proceso principal, permitiendo reutilización y composición de procesos.

### Estructura de Subproceso

```yaml
subprocesses:
  - id: "sub-1"
    name: "Validación de Seguridad"
    order: 1
    source:
      type: "github"
      url: "https://github.com/org/repo/blob/main/security-checklist.yaml"
      ref: "v1.2.0"
    variables:
      application: "{application}"
      environment: "{environment}"
    optional: false
```

**Campos:**
- `id`: Identificador único del subproceso
- `name`: Nombre descriptivo
- `order`: Orden de ejecución (1, 2, 3...)
- `source`: Configuración de la fuente del subproceso
- `variables`: Variables a pasar al subproceso (opcional)
- `optional`: Si el subproceso puede ser omitido (default: false)

### Tipos de Fuente (Source)

#### GitHub

Carga un subproceso desde un repositorio de GitHub.

```yaml
source:
  type: "github"
  url: "https://github.com/org/repo/blob/main/process.yaml"
  ref: "v1.0.0"  # Opcional: tag o branch específico
```

**Campos específicos:**
- `url`: URL del archivo en GitHub (formato blob)
- `ref`: Tag o branch específico (opcional, default: branch del URL)

**Comportamiento:**
- Convierte automáticamente URL blob a raw URL
- Soporta tags y branches específicos
- Carga contenido en tiempo de ejecución

#### URL

Carga un subproceso desde una URL directa.

```yaml
source:
  type: "url"
  url: "https://example.com/processes/security-checklist.yaml"
```

**Campos específicos:**
- `url`: URL directa al archivo YAML

**Comportamiento:**
- Fetch directo del contenido
- No requiere conversión de URL
- Útil para servidores personalizados

#### Local

Carga un subproceso desde el sistema de archivos local.

```yaml
source:
  type: "local"
  path: "./processes/security-checklist.yaml"
```

**Campos específicos:**
- `path`: Ruta relativa al archivo YAML

**Comportamiento:**
- Carga vía API route `/api/subprocess?path=...`
- Requiere que el archivo sea accesible
- Útil para desarrollo y procesos internos

### Variables de Subproceso

Las variables permiten pasar valores del proceso principal al subproceso.

```yaml
subprocesses:
  - id: "sub-1"
    name: "Validación de Seguridad"
    order: 1
    source:
      type: "github"
      url: "https://github.com/org/repo/blob/main/security.yaml"
    variables:
      application: "{application}"      # Variable del proceso principal
      environment: "{environment}"       # Variable del proceso principal
      customValue: "fixed-value"         # Valor fijo
```

**Sustitución de variables:**
- `{variableName}`: Variable del proceso principal
- `"fixed-value"`: Valor literal
- Las variables se aplican a: nombre, descripción, fases, tareas del subproceso

### Subprocesos Opcionales

Los subprocesos opcionales pueden ser omitidos por el usuario.

```yaml
subprocesses:
  - id: "sub-1"
    name: "Validación de Seguridad Avanzada"
    order: 1
    source:
      type: "github"
      url: "https://github.com/org/repo/blob/main/advanced-security.yaml"
    optional: true
```

**Comportamiento:**
- El usuario puede elegir omitir el subproceso
- No bloquea el proceso principal
- Estado: `pending` → `loaded` o `skipped`

### Estados de Subproceso

Los subprocesos tienen los siguientes estados:

- **pending**: Pendiente de carga
- **loading**: Cargando...
- **loaded**: Cargado exitosamente
- **error**: Error en la carga
- **skipped**: Omitido por el usuario (solo optional)

### Ejemplo Completo con Subprocesos

```yaml
process:
  id: "release-with-security-2026"
  name: "Release con Validación de Seguridad"
  description: "Proceso de release que incluye validación de seguridad como subproceso"
  version: "1.0.0"
  estimatedTime: "2h"
  
  variables:
    - key: "application"
      label: "Aplicación"
      type: "text"
      required: true
    - key: "environment"
      label: "Ambiente"
      type: "select"
      required: true
      options:
        - "staging"
        - "production"
  
  subprocesses:
    - id: "sub-1-security"
      name: "Validación de Seguridad"
      order: 1
      source:
        type: "github"
        url: "https://github.com/my-org/security-processes/blob/main/security-checklist.yaml"
        ref: "v1.2.0"
      variables:
        application: "{application}"
        environment: "{environment}"
      optional: false
    
    - id: "sub-2-performance"
      name: "Validación de Performance"
      order: 2
      source:
        type: "url"
        url: "https://internal.example.com/processes/performance-checklist.yaml"
      variables:
        app: "{application}"
      optional: true
  
  phases:
    - id: "phase-1-preparation"
      name: "Fase 1: Preparación"
      order: 1
      tasks:
        - id: "task-1-1"
          name: "Verificar Subprocesos"
          description: "Confirmar que los subprocesos están cargados"
          order: 1
          type: "check"
          checkItems:
            - id: "check-1"
              description: "Subproceso de seguridad cargado"
              required: true
          evidence:
            type: "text"
            required: true
```

### Buenas Prácticas para Subprocesos

**Uso:**
- Usar para procesos reutilizables (checklists de seguridad, compliance)
- Mantener subprocesos independientes y autocontenidos
- Documentar las variables requeridas en la descripción del subproceso

**Versionado:**
- Usar refs específicos (tags) para estabilidad
- Documentar cambios en versiones del subproceso
- Probar subprocesos antes de usarlos en producción

**Variables:**
- Pasar solo las variables necesarias
- Usar nombres descriptivos de variables
- Documentar el propósito de cada variable

**Opcionalidad:**
- Marcar como opcional solo cuando sea apropiado
- Documentar cuándo omitir un subproceso opcional
- Considerar impacto en el proceso principal

---

## Tipos de Tareas

### Standard

Tarea básica que requiere evidencia de texto o imagen.

```yaml
- id: "task-1-1"
  name: "Verificar Configuración"
  description: "Revisar que la configuración es correcta"
  order: 1
  type: "standard"
  evidence:
    type: "both"
    required: true
    description: "Captura de la configuración"
  dependencies: []
```

**Campos específicos:**
- `type: "standard"` (opcional, es el default)
- `evidence.type`: `"text"`, `"image"`, `"both"`, `"none"`
- `evidence.required`: Si la evidencia es obligatoria
- `evidence.description`: Instrucciones para el usuario

---

### Check

Tarea con un solo checkbox de verificación.

```yaml
- id: "task-2-1"
  name: "Confirmar Build Exitoso"
  description: "Verificar que el build completó sin errores"
  order: 1
  type: "check"
  checkItems:
    - id: "check-1"
      description: "Build completado exitosamente"
      required: true
  evidence:
    type: "text"
    required: true
```

**Casos de uso:**
- Validaciones binarias (sí/no)
- Confirmaciones de pasos críticos
- Verificaciones de estado

---

### Multicheck

Tarea con múltiples checkboxes de verificación.

```yaml
- id: "task-3-1"
  name: "Checklist de Seguridad"
  description: "Verificar todos los aspectos de seguridad"
  order: 1
  type: "multicheck"
  checkItems:
    - id: "check-1"
      description: "Autenticación configurada"
      required: true
    - id: "check-2"
      description: "HTTPS habilitado"
      required: true
    - id: "check-3"
      description: "Headers de seguridad configurados"
      required: false
  evidence:
    type: "image"
    required: true
```

**Casos de uso:**
- Checklists de validación
- Verificaciones de múltiples requisitos
- Listas de control de calidad

---

### Export-Excel

Dispara la generación de un reporte Excel a partir de un template `.xlsx`. Desde la v2.1.0 la configuración de exportación es **declarativa a nivel de proceso** (`process.export`) y la tarea `export-excel` es apenas el **gatillo**.

#### 1) Estructura mínima de la tarea

La tarea solo necesita declarar su tipo; el template y los mapeos se heredan de `process.export` (sección siguiente):

```yaml
- id: "task-gen-excel"
  name: "Generar Reporte Excel"
  description: "Genera el reporte final en formato Excel"
  order: 3
  type: "export-excel"
  evidence:
    type: "text"
    required: false
  dependencies: ["task-previa"]
```

#### 2) Overrides a nivel de tarea (opcional)

Si una tarea concreta debe usar un template distinto o un nombre de archivo distinto al declarado en `process.export`, puede sobrescribirlo:

```yaml
- id: "task-gen-excel"
  type: "export-excel"
  exportConfig:
    templatePath: "/templates/OTRO_TEMPLATE.xlsx"   # opcional: sobreescribe process.export.templatePath
    outputFilename: "Reporte_{today:YYYYMMDD}"      # opcional: sobreescribe outputFilename
    autoDownload: true                               # opcional: default true
    inherit: true                                    # default true; pon false para ignorar process.export
    mappings: { ... }                                # opcional: se FUSIONA con process.export.mappings
```

**Comportamiento del merge**:

- `templatePath` y `outputFilename` de la tarea **ganan** sobre `process.export` si se declaran.
- `mappings.variables`, `mappings.staticCells`, `mappings.time`, `mappings.process` se **combinan** (override por llave).
- `mappings.taskSources` se **concatena** (base + override).
- `mappings.comments` y `mappings.evidences` se **reemplazan** completos si el override los declara.
- `inherit: false` desactiva por completo la herencia del `process.export`.

#### 3) Validación

- Una tarea `export-excel` **requiere** que haya un `templatePath` alcanzable (propio o heredado); si no, el YAML falla al cargar con un mensaje explícito.
- Todas las referencias de celda deben cumplir el formato `^[A-Z]+[0-9]+$` (ej. `F85`, `AA10`). Se validan en `yaml-parser.ts` antes de ejecutar.
- Ya **no** existe un fallback silencioso a un template por defecto: la falta de `templatePath` muestra un toast de error al usuario.

#### 4) Interpolación en `outputFilename` y `comments.template`

Tokens soportados:

| Token | Significado | Ejemplo |
|-------|-------------|---------|
| `{today}` | Fecha actual (`YYYYMMDD`) | `20260419` |
| `{today:YYYY-MM-DD}` | Fecha con formato custom | `2026-04-19` |
| `{now:HHmm}` | Hora actual | `2235` |
| `{fecha}` | Alias legacy (`DDMMYYYY`) | `19042026` |
| `{process.name}` | Metadato del proceso | `Checklist de Liberación` |
| `{process.id}` / `{process.version}` | Metadato del proceso | `release-checklist-2026` |
| `{vars.<key>}` | Variable capturada | `{vars.rfc}` → `RFC123456` |
| `{<key>}` | Atajo: variable capturada directa | `{rfc}` → `RFC123456` |

En `outputFilename` los valores se **sanean** automáticamente (caracteres inválidos de Windows/Linux) y se garantiza la extensión `.xlsx`.

---

### Export Declarativo (`process.export`)

Bloque **a nivel de proceso** que define cómo se llena el Excel. El motor genérico (`executeExportPlan`) lee este bloque y escribe celdas sin código TypeScript específico del proceso.

```yaml
process:
  id: "mi-proceso"
  # ...

  export:
    templatePath: "/templates/MI_TEMPLATE.xlsx"        # obligatorio
    templateVersion: "1.0.0"                           # opcional, informativo
    templateSha256: "..."                              # opcional, integridad
    outputFilename: "Reporte_{today:YYYYMMDD}_{vars.rfc}"
    autoDownload: true

    mappings:
      # Arquitectura sheets[]: cada sección declara una hoja y sus fuentes
      sheets:
        # --- Hoja principal ---
        - sheet: "Checklist"
          sources:
            # 1) Celdas estáticas (valor literal)
            - kind: static
              cells:
                A1: "DevSecOps Process Tracker"
                Z99: 42

            # 2) Variables del proceso (capturedVariables) -> celdas
            - kind: variables
              mapping:
                torre: "F3"
                rfc: "F9"
                desarrollador: "W12"

            # 3) Metadato del proceso -> celdas
            - kind: process
              id: "F84"
              name: "F2"
              version: "Z2"

            # 4) Time tracking -> celdas
            - kind: time
              today: "W3"
              startedAt: "W85"
              completedAt: "W86"
              totalElapsedMinutes: "Z10"
              totalElapsedHours: "Z11"

            # 5) Comentarios con template interpolable
            - kind: comments
              cell: "B100"
              template: "Proceso: {process.name}\nRFC: {vars.rfc}"

            # 6) Leer rango de celdas del template -> variable de proceso
            - kind: range
              range: "H46:L46"
              outputVar: "columnHeaders"     # capturedVariables.columnHeaders = ["val1", "val2", ...]
              flatten: true                  # true=string[], false=string[][]

            # 7) Fuentes basadas en tareas
            - kind: list
              sourceTaskId: task-1-2
              column: F
              startRow: 5
              endRow: 13

            - kind: detail
              sourceTaskId: task-1-2b
              sections:
                - { column: B, startRow: 47, endRow: 56 }

            - kind: form
              sourceTaskId: task-7-1b

            - kind: checklist
              startRow: 18
              maxRows: 20
              columns:
                aplica: T
                validado: U
                url: V
                nombre: B

            - kind: detail-table
              sourceTaskId: task-1-2a
              startRow: 47
              columns:
                integracionMaster: H
                deudaTecnica: I
                vulnerabilidades: J
                urlRepo: L

            - kind: cell
              sourceTaskId: task-1-1
              fields:
                - field: "evidence.text"
                  cell: "B100"
                - field: "completedAt"
                  cell: "W100"

        # --- Hoja de evidencias ---
        - sheet: "Evidencias"
          startRow: 3
          timestampColumn: B
          nameColumn: C
          maxRows: 200
```

#### Source kinds disponibles

| `kind` | Requiere | Qué hace |
|--------|----------|---------|
| `variables` | `mapping` | Escribe cada variable en su celda |
| `static` | `cells` | Escribe literales en celdas |
| `time` | (al menos un campo) | Escribe metadatos de tiempo |
| `process` | (al menos un campo) | Escribe metadatos del proceso |
| `comments` | `cell` | Escribe texto interpolado en una celda |
| `range` | `range`, `outputVar` | Lee rango del template → `capturedVariables` |
| `list` | `sourceTaskId`, `column`, `startRow` | Items de dynamic-list en rango vertical |
| `detail` | `sourceTaskId`, `sections[]` | Textos de detail-list en secciones |
| `form` | `sourceTaskId` | Cada `field.valueCell` del form |
| `checklist` | `startRow`, `columns` | Una fila por tarea con estado |
| `detail-table` | `sourceTaskId`, `startRow`, `columns` | Filas de detail-table en columnas |
| `cell` | `sourceTaskId`, `fields[]` | Campos específicos de tarea a celdas |

#### `kind: range` — Leer datos del template

Lee un rango de celdas del template Excel y lo almacena como variable de proceso en `capturedVariables`. Útil para extraer headers, listas de opciones, o datos de referencia del template.

```yaml
- kind: range
  range: "H46:L46"              # Notación Excel: ColumnaFila:ColumnaFila
  outputVar: "columnHeaders"    # Nombre de variable en capturedVariables
  flatten: true                 # true (default) = string[], false = string[][]
```

**Comportamiento:**
- `flatten: true` (default): Lee todos los valores no vacíos del rango y los almacena como `string[]`
- `flatten: false`: Lee el rango como matriz `string[][]` (filas × columnas)
- Las celdas vacías se omiten con `flatten: true`, se incluyen como `""` con `flatten: false`

**Casos de uso:**
- Extraer headers de columnas del template para usar como opciones de `select`
- Leer datos de referencia del template (ej: lista de torres, ambientes)
- Combinar con `optionsFrom` para poblar dropdowns dinámicamente

#### Agregar un proceso nuevo con template

Sin tocar código TypeScript:

1. Coloque el archivo `.xlsx` en `nextjs_space/public/templates/<nombre>.xlsx`.
2. Declare `process.export` en el YAML del proceso con los `mappings` correspondientes.
3. Anote `valueCell` en los campos `form` que deban volcar datos al Excel.
4. Registre el proceso en `nextjs_space/data/processes/index.json`.

#### Errores de validación comunes

| Mensaje | Causa |
|---------|-------|
| `process.export: 'templatePath' is required` | Falta `templatePath` a nivel proceso |
| `Task '<id>' (type=export-excel) ... requires ... templatePath` | Tarea sin heredar y sin `templatePath` propio |
| `Invalid cell reference "..." in process.export.mappings.variables['xxx']` | Valor no cumple `^[A-Z]+[0-9]+$` |
| `...taskSources[i]: 'sourceTaskId' required for kind=list` | Falta `sourceTaskId` en una source `list`/`detail`/`form` |
| `...taskSources[i]: unknown kind 'xyz'` | `kind` distinto a `list`/`detail`/`form`/`checklist` |

---

### Dynamic-List

Captura una lista dinámica de items.

```yaml
- id: "task-5-1"
  name: "Lista de Repositorios"
  description: "Capturar todos los repositorios afectados"
  order: 1
  type: "dynamic-list"
  listConfig:
    label: "Repositorio"
    minItems: 1
    maxItems: 10
    separator: "comma"
    placeholder: "Ingrese repositorios separados por coma"
  evidence:
    type: "form"
    required: true
```

**Campos específicos:**
- `listConfig.label`: Etiqueta para cada item
- `listConfig.minItems`: Mínimo de items requeridos
- `listConfig.maxItems`: Máximo de items permitidos
- `listConfig.separator`: Separador para parsing (`comma`, `semicolon`, `newline`)
- `listConfig.placeholder`: Texto de ayuda

**Casos de uso:**
- Listas de repositorios, componentes, URLs
- Inventario de activos
- Colección de identificadores

---

### Detail-List

Captura detalles para cada item de una lista dinámica.

```yaml
- id: "task-6-1"
  name: "Detalles de Repositorios"
  description: "Capturar detalles para cada repositorio"
  order: 1
  type: "detail-list"
  detailConfig:
    sourceTaskId: "task-5-1"
    placeholder: "Describa el propósito de {item}"
    maxLength: 200
  evidence:
    type: "form"
    required: true
```

**Campos específicos:**
- `detailConfig.sourceTaskId`: ID de la tarea dynamic-list origen
- `detailConfig.placeholder`: Texto de ayuda (soporta `{item}` variable)
- `detailConfig.maxLength`: Longitud máxima del detalle

**Casos de uso:**
- Descripciones detalladas de items
- Comentarios por cada elemento
- Información adicional contextual

---

### Form

Formulario estructurado con múltiples campos.

```yaml
- id: "task-7-1"
  name: "Formulario de Validación"
  description: "Completar campos de validación"
  order: 1
  type: "form"
  formConfig:
    layout:
      type: "grid"
      columns: 2
      gap: "medium"
    fields:
      - id: "campo1"
        label: "Nombre del Validador"
        type: "text"
        required: true
        placeholder: "Nombre completo"
        maxLength: 100
        colSpan: 1
        valueCell: "F85"
      - id: "campo2"
        label: "Fecha de Validación"
        type: "date"
        required: true
        colSpan: 1
        valueCell: "F86"
      - id: "campo3"
        label: "Estado"
        type: "select"
        required: true
        options:
          - "Aprobado"
          - "Aprobado con observaciones"
          - "Rechazado"
        colSpan: 1
        valueCell: "S85"
      - id: "campo4"
        label: "Observaciones"
        type: "textarea"
        required: false
        placeholder: "Comentarios adicionales"
        maxLength: 500
        colSpan: 2
        valueCell: "S86"
  evidence:
    type: "form"
    required: true
```

**Campos específicos:**
- `formConfig.layout.type`: `"vertical"` o `"grid"`
- `formConfig.layout.columns`: Número de columnas (1-4)
- `formConfig.layout.gap`: Espaciado entre campos (`small`, `medium`, `large`)
- `formConfig.fields`: Lista de campos del formulario

**Tipos de campos:**
- `text`: Input de texto
- `number`: Input numérico
- `email`: Input de email
- `date`: Selector de fecha
- `time`: Selector de hora
- `datetime`: Selector de fecha y hora
- `boolean`: Checkbox
- `textarea`: Área de texto multilínea
- `select`: Dropdown de opciones
- `image`: Subida de imagen

**Validaciones por campo:**
- `required`: Campo obligatorio
- `minLength`: Longitud mínima
- `maxLength`: Longitud máxima
- `pattern`: Regex de validación
- `valueCell`: Celda de Excel para mapeo

**Tokens dinámicos en labels:**
```yaml
fields:
  - id: "campo1"
    label: "#OFFSET-1#"  # Toma valor de celda a la izquierda de valueCell
    valueCell: "F85"    # Usará valor de E85
  - id: "campo2"
    label: "#CELDA#D85"  # Referencia absoluta a celda D85
```

---

### Detail-Table

Captura datos estructurados en formato tabla para cada item de una lista dinámica. Cada fila corresponde a un item fuente y las columnas son campos configurables.

```yaml
- id: "task-1-2a"
  name: "Validación por Repositorio"
  description: "Para cada repositorio, valide los criterios de calidad"
  order: 3
  type: "detail-table"
  detailTableConfig:
    sourceTaskId: "task-1-2"          # ID de tarea dynamic-list (alternativa: sourceVar)
    # sourceVar: "repos"             # Alternativa: leer items desde una variable de proceso
    columns:
      - id: "integracionMaster"
        label: "#H46#"               # Sintaxis #CELL# para leer label del template Excel
        type: "boolean"
        required: false
      - id: "deudaTecnica"
        label: "#I46#"
        type: "boolean"
        required: false
      - id: "vulnerabilidades"
        label: "#J46#"
        type: "boolean"
        required: false
      - id: "urlRepo"
        label: "#L46#"
        type: "computed-text"
        template: "{vars.repositoryUrl}/{item}"
        required: false
  evidence:
    type: "text"
    required: false
  dependencies: ["task-1-2"]
```

**Campos de `detailTableConfig`:**
- `sourceTaskId`: ID de la tarea `dynamic-list` origen (método clásico)
- `sourceVar`: Nombre de variable de proceso que contiene una lista (alternativa dinámica)
- `columns`: Lista de definiciones de columnas

**Tipos de columna:**

| Tipo | Descripción | Input |
|------|-------------|-------|
| `boolean` | Checkbox | Toggle |
| `text` | Texto libre | Input |
| `date` | Fecha | Date picker |
| `list` | Selección de opciones | Select dropdown |
| `computed-text` | Auto-calculado con template | Input (editable) |

**`computed-text` templates:**
- `{item}`: Nombre del item fuente (fila actual)
- `{vars.xxx}`: Variable de proceso capturada
- Otros tokens: se resuelven contra `capturedVariables`

**Labels con `#CELL#`:**
- `label: "#H46#"` → lee el valor de la celda H46 del template Excel como label de la columna
- Requiere que `process.export.templatePath` esté configurado

**`sourceVar` vs `sourceTaskId`:**
- `sourceTaskId`: Lee items de `listData` de otra tarea (estático, definido en tiempo de diseño)
- `sourceVar`: Lee items de una `capturedVariable` que contiene un array (dinámico, puede venir de `outputVars` o `kind: range`)

---

### Variables de Salida de Tareas (`outputVars`)

Cualquier tarea puede declarar opcionalmente `outputVars` que se escriben en `capturedVariables` al completarse. Esto permite que otras tareas o variables del proceso consuman los datos producidos.

```yaml
- id: "task-1-2"
  name: "Lista de Repositorios"
  type: "dynamic-list"
  listConfig:
    label: "Repositorio"
  outputVars:
    - name: "repos"               # Nombre de la variable en capturedVariables
      type: "list"                # text | list | object
      source: "listData"          # Campo de TaskState (dot-notation path)
      mapTo: "value"              # Para list: propiedad a extraer de cada item
  evidence:
    type: "text"
    required: false
```

**Campos de `outputVars[]`:**

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `name` | sí | Nombre de la variable en `capturedVariables` |
| `type` | sí | `text` (string), `list` (string[]), `object` (JSON string) |
| `source` | sí | Path dot-notation sobre TaskState (ej: `listData`, `evidence.text`, `formData`) |
| `mapTo` | no | Para `type: list`, propiedad a extraer de cada item (ej: `value` de `ListItem`) |

**Tipos de salida:**

| `type` | Resultado en `capturedVariables` | Ejemplo |
|--------|----------------------------------|---------|
| `text` | `string` | `capturedVariables.evidenceOutput = "mi texto"` |
| `list` | `string[]` | `capturedVariables.repos = ["repo-a", "repo-b"]` |
| `object` | `string` (JSON) | `capturedVariables.formDump = "[{...}]"` |

**Sources comunes:**

| Source path | Tarea tipo | Qué produce |
|-------------|-----------|-------------|
| `listData` | dynamic-list | Array de items |
| `evidence.text` | cualquier | Texto de evidencia |
| `formData` | form | Array de campos |
| `completedAt` | cualquier | Timestamp ISO |
| `checkItems` | check/multicheck | Array de estados |

**Flujo típico:**
1. Tarea `dynamic-list` con `outputVars` → completa → `capturedVariables.repos = ["a", "b"]`
2. Variable `select` con `optionsFrom: "repos"` → dropdown muestra "a", "b"
3. Tarea `detail-table` con `sourceVar: "repos"` → tabla con filas "a", "b"

---

### Variables de Proceso con Opciones Dinámicas (`optionsFrom`)

Las variables tipo `select` pueden obtener sus opciones dinámicamente desde una variable de proceso que contenga una lista, en lugar de definirlas estáticamente con `options`.

```yaml
variables:
  # Select con opciones estáticas (clásico)
  - key: "environment"
    label: "Ambiente"
    type: "select"
    required: true
    options:
      - "development"
      - "staging"
      - "production"

  # Select con opciones dinámicas (desde outputVar o kind: range)
  - key: "repositorioSeleccionado"
    label: "Repositorio"
    type: "select"
    required: true
    optionsFrom: "repos"          # Lee opciones de capturedVariables.repos
```

**Campos:**
- `options`: Lista estática de strings (clásico)
- `optionsFrom`: Nombre de una `capturedVariable` que contiene `string[]` o un string separado por comas

**Restricciones:**
- `optionsFrom` solo es válido para `type: "select"`
- La variable referenciada debe existir en `capturedVariables` al momento de renderizar
- Si la variable no existe o está vacía, el dropdown no muestra opciones

---

## Configuraciones Avanzadas

### Referencias

Enlaces a documentación externa.

```yaml
references:
  - label: "Documentación Oficial"
    url: "https://docs.example.com"
  - label: "Guía de Buenas Prácticas"
    url: "https://bestpractices.example.com"
```

**Casos de uso:**
- Documentación de referencia
- Guías de cumplimiento
- Manuales de procedimientos

---

### Dependencias

Define el orden de ejecución entre tareas.

```yaml
dependencies:
  - "task-1-1"
  - "task-1-2"
  - "task-2-1"
```

**Comportamiento:**
- Las tareas bloqueadas no pueden completarse
- Se muestran con indicador visual
- Se desbloquean automáticamente al completar dependencias

**Buenas prácticas:**
- Usar dependencias solo cuando es necesario
- Evitar dependencias circulares
- Mantener el grafo de dependencias simple

---

### Links Dinámicos

Enlaces parametrizados que se generan dinámicamente usando variables.

```yaml
dynamicLinks:
  - label: "GitHub Repository"
    urlTemplate: "https://github.com/{organization}/{repository}"
    behavior: "click"
    newTab: true
    requiresVariables: ["organization", "repository"]
  - label: "Jira Ticket"
    urlTemplate: "https://jira.atlassian.net/browse/{ticketId}"
    behavior: "auto"
    delay: 2
    requiresVariables: ["ticketId"]
```

**Campos:**
- `label`: Texto del link
- `urlTemplate`: URL con variables en formato `{variable}`
- `behavior`: `"click"` (requiere click) o `"auto"` (se abre automáticamente)
- `delay`: Segundos de espera antes de abrir (solo para `auto`)
- `newTab`: Abrir en nueva pestaña
- `requiresVariables`: Lista de variables necesarias

**Niveles:**
- Nivel proceso: Links disponibles en toda la fase
- Nivel fase: Links disponibles en la fase
- Nivel tarea: Links específicos de la tarea

---

### Evidencia

Define qué tipo de evidencia requiere una tarea.

```yaml
evidence:
  type: "both"
  required: true
  description: "Captura del resultado con logs"
```

**Tipos:**
- `text`: Solo texto
- `image`: Solo imagen
- `both`: Texto e imagen
- `form`: Datos de formulario (para form tasks)
- `none`: Sin evidencia

**Para dynamic-list, detail-list, form:**
```yaml
evidence:
  type: "form"
  required: true
  description: "Complete los campos del formulario"
```

---

### Confirmación de cierre (completionAlert)

Cualquier tarea puede declarar un bloque opcional `completionAlert` que muestra un modal de confirmación **antes** de finalizar la tarea. Si el usuario cancela, el estado previo se preserva.

```yaml
tasks:
  - id: "deploy-to-prod"
    name: "Promover release a producción"
    type: standard
    evidence:
      type: text
      required: true
    completionAlert:
      severity: "critical"                  # info | warning | critical (default: info)
      title: "Confirmar despliegue a producción"
      description: "Esta acción promueve el build actual a producción y no se puede deshacer. ¿Continuar?"
      confirmLabel: "Sí, promover"          # opcional: default i18n 'common.confirm'
      cancelLabel: "Cancelar"               # opcional: default i18n 'common.cancel'
```

**Campos:**

| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| `description` | sí | Cuerpo principal del modal. |
| `severity` | no | `info` (default, azul), `warning` (ámbar) o `critical` (rojo con pulse animado). |
| `title` | no | Encabezado del modal. Default: `alert.completion.defaultTitle` i18n. |
| `confirmLabel` | no | Texto del botón primario. |
| `cancelLabel` | no | Texto del botón secundario. |

**Comportamiento:**

- El modal se renderiza con `CompletionAlertDialog` (ver `app/process/_components/completion-alert-dialog.tsx`).
- Los estilos derivan de `lib/alert-feedback.ts` (paleta + icono por severidad).
- Respeta `prefers-reduced-motion`: desactiva las animaciones `pulse-once`/`pulse-strong`.
- No se muestra al **desmarcar** una tarea ya completada; solo al cerrar.
- Internacionalizado (ES/EN) via `lib/i18n-context.tsx`.

**Cuándo usarlo:**

- Acciones irreversibles (despliegues a producción, borrado de datos).
- Pasos con implicaciones de compliance o auditoría.
- Tareas con efectos colaterales en sistemas externos (notificaciones, webhooks, pipelines).

---

## Ejemplo Paso a Paso

### Paso 1: Definir el proceso base

```yaml
process:
  id: "custom-process-2026"
  name: "Mi Proceso Personalizado"
  description: "Proceso para validar despliegues"
  version: "1.0.0"
  estimatedTime: "1h"
```

### Paso 2: Agregar variables

```yaml
variables:
  - key: "application"
    label: "Nombre de la Aplicación"
    type: "text"
    required: true
    placeholder: "ej: backend-api"
  - key: "environment"
    label: "Ambiente"
    type: "select"
    required: true
    options:
      - "development"
      - "staging"
      - "production"
```

### Paso 3: Definir la primera fase

```yaml
phases:
  - id: "phase-1-preparation"
    name: "Fase 1: Preparación"
    description: "Preparar el entorno"
    order: 1
    tasks: []
```

### Paso 4: Agregar tareas standard

```yaml
tasks:
  - id: "task-1-1"
    name: "Verificar Entorno"
    description: "Confirmar que el entorno está listo"
    order: 1
    type: "standard"
    evidence:
      type: "text"
      required: true
      description: "Estado del entorno"
    dependencies: []
```

### Paso 5: Agregar tarea con check

```yaml
- id: "task-1-2"
  name: "Confirmar Dependencias"
  description: "Verificar que todas las dependencias están instaladas"
  order: 2
  type: "check"
  checkItems:
    - id: "check-1"
      description: "Dependencias instaladas"
      required: true
  evidence:
    type: "image"
    required: true
    description: "Captura de package.json"
  dependencies: ["task-1-1"]
```

### Paso 6: Agregar tarea dynamic-list

```yaml
- id: "task-1-3"
  name: "Lista de Componentes"
  description: "Capturar componentes afectados"
  order: 3
  type: "dynamic-list"
  listConfig:
    label: "Componente"
    minItems: 1
    maxItems: 20
    separator: "comma"
  evidence:
    type: "form"
    required: true
  dependencies: ["task-1-1"]
```

### Paso 7: Agregar tarea form

```yaml
- id: "task-1-4"
  name: "Formulario de Validación"
  description: "Completar validación final"
  order: 4
  type: "form"
  formConfig:
    layout:
      type: "grid"
      columns: 2
      gap: "medium"
    fields:
      - id: "validator"
        label: "Validador"
        type: "text"
        required: true
        colSpan: 1
      - id: "date"
        label: "Fecha"
        type: "date"
        required: true
        colSpan: 1
      - id: "status"
        label: "Estado"
        type: "select"
        required: true
        options:
          - "Aprobado"
          - "Rechazado"
        colSpan: 2
  evidence:
    type: "form"
    required: true
  dependencies: ["task-1-2", "task-1-3"]
```

### Paso 8: Agregar tarea export-excel

```yaml
- id: "task-1-5"
  name: "Generar Reporte"
  description: "Crear reporte Excel"
  order: 5
  type: "export-excel"
  exportConfig:
    templatePath: "templates/my-report.xlsx"
    outputFilename: "report-{application}-{environment}.xlsx"
    mappings:
      - cell: "B5"
        source: "variable:application"
      - cell: "B6"
        source: "variable:environment"
      - cell: "F5"
        source: "task:task-1-1.evidence.text"
      - cell: "F10"
        source: "task:task-1-3.listData"
      - cell: "F15"
        source: "task:task-1-4.formData"
  evidence:
    type: "none"
  dependencies: ["task-1-4"]
```

### Archivo completo resultante

```yaml
process:
  id: "custom-process-2026"
  name: "Mi Proceso Personalizado"
  description: "Proceso para validar despliegues"
  version: "1.0.0"
  estimatedTime: "1h"
  
  variables:
    - key: "application"
      label: "Nombre de la Aplicación"
      type: "text"
      required: true
      placeholder: "ej: backend-api"
    - key: "environment"
      label: "Ambiente"
      type: "select"
      required: true
      options:
        - "development"
        - "staging"
        - "production"
  
  phases:
    - id: "phase-1-preparation"
      name: "Fase 1: Preparación"
      description: "Preparar el entorno"
      order: 1
      tasks:
        - id: "task-1-1"
          name: "Verificar Entorno"
          description: "Confirmar que el entorno está listo"
          order: 1
          type: "standard"
          evidence:
            type: "text"
            required: true
            description: "Estado del entorno"
          dependencies: []
        
        - id: "task-1-2"
          name: "Confirmar Dependencias"
          description: "Verificar que todas las dependencias están instaladas"
          order: 2
          type: "check"
          checkItems:
            - id: "check-1"
              description: "Dependencias instaladas"
              required: true
          evidence:
            type: "image"
            required: true
            description: "Captura de package.json"
          dependencies: ["task-1-1"]
        
        - id: "task-1-3"
          name: "Lista de Componentes"
          description: "Capturar componentes afectados"
          order: 3
          type: "dynamic-list"
          listConfig:
            label: "Componente"
            minItems: 1
            maxItems: 20
            separator: "comma"
          evidence:
            type: "form"
            required: true
          dependencies: ["task-1-1"]
        
        - id: "task-1-4"
          name: "Formulario de Validación"
          description: "Completar validación final"
          order: 4
          type: "form"
          formConfig:
            layout:
              type: "grid"
              columns: 2
              gap: "medium"
            fields:
              - id: "validator"
                label: "Validador"
                type: "text"
                required: true
                colSpan: 1
              - id: "date"
                label: "Fecha"
                type: "date"
                required: true
                colSpan: 1
              - id: "status"
                label: "Estado"
                type: "select"
                required: true
                options:
                  - "Aprobado"
                  - "Rechazado"
                colSpan: 2
          evidence:
            type: "form"
            required: true
          dependencies: ["task-1-2", "task-1-3"]
        
        - id: "task-1-5"
          name: "Generar Reporte"
          description: "Crear reporte Excel"
          order: 5
          type: "export-excel"
          exportConfig:
            templatePath: "templates/my-report.xlsx"
            outputFilename: "report-{application}-{environment}.xlsx"
            mappings:
              - cell: "B5"
                source: "variable:application"
              - cell: "B6"
                source: "variable:environment"
              - cell: "F5"
                source: "task:task-1-1.evidence.text"
              - cell: "F10"
                source: "task:task-1-3.listData"
              - cell: "F15"
                source: "task:task-1-4.formData"
          evidence:
            type: "none"
          dependencies: ["task-1-4"]
```

---

## Buenas Prácticas

### Nomenclatura

**IDs:**
- Usar kebab-case: `task-1-1`, `phase-2-preparation`
- Incluir nivel jerárquico: `phase-1`, `activity-1-1`, `task-1-1-1`
- Ser descriptivos pero concisos

**Nombres:**
- Usar lenguaje natural: "Verificar Configuración" vs "ConfigCheck"
- Incluir acción: "Verificar", "Validar", "Generar"
- Ser específicos: "Verificar Configuración de Firewall" vs "Verificar Configuración"

### Estructura

**Organización de fases:**
- 3-7 fases por proceso
- Cada fase con propósito claro
- Orden lógico de ejecución

**Organización de tareas:**
- 3-10 tareas por fase
- Tareas cohesivas en propósito
- Dependencias mínimas necesarias

### Validación

**Evidencia:**
- Siempre requerir evidencia para tareas críticas
- Usar descripciones claras de qué se espera
- Combinar texto e imagen cuando sea apropiado

**Dependencias:**
- Evitar dependencias circulares
- Mantener el grafo simple
- Documentar el propósito de cada dependencia

### Mantenimiento

**Versionado:**
- Incrementar versión en cambios mayores
- Documentar cambios en descripción
- Mantener compatibilidad hacia atrás cuando sea posible

**Documentación:**
- Incluir comentarios en YAML complejos
- Mantener descripciones actualizadas
- Referenciar documentación externa

---

## Referencias de Archivos Existentes

### release-checklist.yaml
- **Complejidad:** Alta
- **Características:** Variables, dynamic-list, detail-list, form, export-excel + **`process.export` declarativo** (desde v2.1.0)
- **Casos de uso:** Proceso de release completo con generación de reporte Excel
- **Template:** `public/templates/TEMPLATE_Checklist_Liberacion.xlsx`
- **Referencia canónica** del bloque `process.export` con `variables`, `time`, `comments`, `taskSources` (list/detail/form) y `evidences`

### pull-request-validation.yaml
- **Complejidad:** Alta
- **Características:** Variables, dynamicLinks, check, multicheck
- **Casos de uso:** Validación de PR con enlaces a herramientas DevOps

### devops-pipeline.yaml
- **Complejidad:** Media
- **Características:** Variables, dynamicLinks, references
- **Casos de uso:** Pipeline DevOps parametrizado

### incident-response.yaml
- **Complejidad:** Media
- **Características:** Referencias, dependencias
- **Casos de uso:** Procedimiento de respuesta a incidentes

### it-security-audit.yaml
- **Complejidad:** Media
- **Características:** Referencias, evidencia variada
- **Casos de uso:** Auditoría de seguridad estructurada

### devops-release.yaml
- **Complejidad:** Baja
- **Características:** Referencias, dependencias
- **Casos de uso:** Proceso de release simple

---

## Recursos Adicionales

- **Validación de YAML:** Use un validador YAML para verificar la sintaxis
- **Templates Excel:** Ubicación: `templates/*.xlsx`
- **Testing:** Pruebe el proceso en desarrollo antes de producción
- **Documentación:** Mantenga esta guía actualizada con cambios

---

## Soporte

Para preguntas o problemas con la creación de procesos:
1. Revise los ejemplos en `data/processes/`
2. Consulte esta guía
3. Verifique la sintaxis YAML
4. Pruebe con un proceso simple antes de complejos

---

**Última actualización:** 2026-04-21
**Versión de la guía:** 1.2.0
**Schema:** `schemas/process.schema.json` v1.2.0
