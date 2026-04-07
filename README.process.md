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
  - [Form](#form)
- [Configuraciones Avanzadas](#configuraciones-avanzadas)
  - [Referencias](#referencias)
  - [Dependencias](#dependencias)
  - [Links Dinámicos](#links-dinámicos)
  - [Evidencia](#evidencia)
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

Formato semántico (MAJOR.MINOR.PATCH):

```yaml
process:
  version: "1.2.3"
```

- **MAJOR**: Cambios incompatibles en estructura
- **MINOR**: Nuevas funcionalidades compatibles
- **PATCH**: Correcciones de errores

### Tiempo Estimado

Formato legible para humanos:

```yaml
process:
  estimatedTime: "1h30m"  # 1 hora y 30 minutos
  # Otros ejemplos:
  # "45m"  # 45 minutos
  # "2h"   # 2 horas
  # "3h15m" # 3 horas y 15 minutos
```

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

Genera un reporte Excel basado en un template.

```yaml
- id: "task-4-1"
  name: "Generar Reporte Excel"
  description: "Crear reporte en formato Excel"
  order: 1
  type: "export-excel"
  exportConfig:
    templatePath: "templates/release-report.xlsx"
    outputFilename: "release-report-{torre}-{fecha}.xlsx"
    mappings:
      - cell: "B5"
        source: "variable:torre"
      - cell: "B6"
        source: "variable:fecha"
      - cell: "F5"
        source: "task:task-1-1.evidence.text"
      - cell: "F6"
        source: "task:task-2-1.checkItems.0.checked"
```

**Campos específicos:**
- `templatePath`: Ruta al archivo Excel template
- `outputFilename`: Nombre del archivo generado (soporta variables)
- `mappings`: Mapeo de celdas a fuentes de datos

**Fuentes de datos:**
- `variable:nombre`: Variable del proceso
- `task:taskId.evidence.text`: Evidencia de texto
- `task:taskId.checkItems.N.checked`: Estado de checkbox
- `task:taskId.listData`: Lista de items (dynamic-list)
- `task:taskId.formData`: Datos de formulario

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
- **Características:** Variables, dynamic-list, detail-list, form, export-excel
- **Casos de uso:** Proceso de release completo con generación de reporte

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

**Última actualización:** 2026-04-07
**Versión de la guía:** 1.0.0
