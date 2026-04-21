# Flujo de Datos

> Última revisión: 2026-04-21 · sincronizado con `develop`

Diagramas de secuencia de las operaciones clave entre actores, stores, helpers, API routes y servicios externos. Todos los flujos aplican rate-limit + validación Zod en los endpoints.

## 1. Carga de proceso desde plantilla

```mermaid
sequenceDiagram
    actor U as Usuario
    participant HP as HomePage
    participant RL as rate-limit
    participant API as /api/processes
    participant Parser as yaml-parser
    participant Schema as process.schema.json
    participant PS as ProcessStore
    participant SS as SessionStore
    participant PP as ProcessPage

    U->>HP: Selecciona template
    HP->>API: GET /api/processes/[id]
    API->>RL: withRateLimit(request, route, bucket)
    RL-->>API: allowed
    API->>API: validateSchema(processIdSchema)
    API-->>HP: { yaml, metadata }
    HP->>Parser: parseYAMLToProcess(yaml)
    Parser->>Schema: validate structure
    Parser->>Parser: validate cross-refs<br/>(deps, cellRefs, completionAlert, export plan)
    Parser-->>HP: ProcessState
    HP->>PS: loadProcess(state)
    PS->>PS: updateTaskBlockedStatus<br/>updateProgress
    PS->>PS: startProcessTimer (opt-in)
    HP->>SS: addProcess(state)
    SS->>SS: persist with LZ-compression
    HP->>PP: router.push('/process')
```

## 2. Carga de subproceso externo

```mermaid
sequenceDiagram
    actor U as Usuario
    participant HP as HomePage
    participant SL as subprocess-loader
    participant External as GitHub / URL / local
    participant Parser as yaml-parser
    participant PS as ProcessStore

    U->>HP: URL / path / github ref
    HP->>SL: loadSubprocess(source)
    SL->>External: fetch YAML<br/>(GitHub API / HTTP GET / fs.read)
    External-->>SL: YAML text
    SL->>SL: sanitize + verify ref/sha
    SL->>Parser: parseYAMLToProcess
    Parser-->>SL: sub-ProcessState
    SL-->>HP: merged ProcessState<br/>(parent + subprocess tree)
    HP->>PS: loadProcess(merged)
```

## 3. Completar una tarea con el gate opcional `completionAlert`

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TC as TaskCard
    participant H as helpers
    participant Dlg as CompletionAlertDialog
    participant EM as EvidenceModal
    participant Sanitize as sanitize
    participant PS as ProcessStore
    participant Feedback as alert-feedback

    U->>TC: click checkbox
    TC->>H: canCompleteCheckTask(phaseId, taskId)
    H-->>TC: true / false
    alt validaciones fallan
        TC->>U: toast.warning
    else type == export-excel
        TC->>TC: performComplete (see flow 5)
    end

    alt task.completionAlert declarado
        TC->>Feedback: getSeverityStyles(severity)
        Feedback-->>TC: { Icon, classes, animation }
        TC->>Feedback: useReducedMotion()
        Feedback-->>TC: bool
        TC->>Dlg: open with config
        U->>Dlg: Cancel
        Dlg-->>TC: close, task pendiente
    else sin alerta
        TC->>TC: performComplete directo
    end

    U->>Dlg: Confirm
    Dlg-->>TC: onConfirm
    TC->>TC: performComplete

    Note over TC: performComplete branch

    alt evidence.required
        TC->>EM: open
        U->>EM: texto + imágenes
        EM->>Sanitize: sanitizeText / sanitizeUrl
        EM->>PS: updateTaskEvidence
        U->>EM: Guardar (ver flow 4)
    else sin evidencia
        TC->>PS: completeTask(phaseId, taskId, activityId)
    end

    PS->>PS: updateProgress<br/>updateTaskBlockedStatus<br/>mark completedAt
    PS-->>TC: estado actualizado
    TC->>U: toast.success
```

## 4. Upload de evidencia (S3 con presigned URL)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant EM as EvidenceModal
    participant API as /api/upload/presigned
    participant RL as rate-limit
    participant Zod as api-schemas
    participant S3Utils as s3 / aws-config
    participant S3 as AWS S3 / Azure Blob
    participant PS as ProcessStore

    U->>EM: Selecciona imagen
    EM->>API: POST { filename, contentType, taskId }
    API->>RL: withRateLimit(bucket=upload)
    API->>Zod: validate presignedUploadSchema
    Zod-->>API: ok
    API->>S3Utils: generatePresignedUrl
    S3Utils-->>API: { uploadUrl, cloudStoragePath }
    API-->>EM: { uploadUrl, path }

    alt S3 configurado
        EM->>S3: PUT file binario directo
        S3-->>EM: 200 OK (ETag)
        EM->>API: POST /api/upload/complete<br/>{ path, metadata }
        API->>RL: withRateLimit(bucket=upload)
        API-->>EM: { finalUrl, isPublic }
    else Modo local (sin AWS config)
        API-->>EM: { localMode: true }
        EM->>EM: fileToBase64(file)
        EM->>EM: store Base64 inline
    end

    EM->>PS: updateTaskEvidence(phaseId, taskId, evidence)
    PS->>PS: persist (LZ-compressed localStorage)
    PS-->>EM: estado actualizado
    EM->>U: preview actualizado
```

## 5. Export declarativo (Excel) al completar una tarea `export-excel`

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TC as TaskCard
    participant EG as excel-generator
    participant ETH as excel-template-helper
    participant Template as public/templates/*.xlsx
    participant PS as ProcessStore

    U->>TC: click completar (tarea type=export-excel)
    TC->>EG: resolveExportPlan(process, task)
    EG->>EG: merge task.exportConfig + process.export<br/>(inherit: true default)
    EG-->>TC: ProcessExportConfig
    TC->>ETH: buildTemplatePath(plan)
    ETH->>Template: fetch .xlsx
    Template-->>ETH: ArrayBuffer
    ETH->>ETH: optional sha256 integrity check
    ETH-->>TC: workbook buffer

    TC->>EG: executeExportPlan(plan, process)
    Note over EG: Apply mappings
    EG->>EG: staticCells
    EG->>EG: variables → {vars.xxx}
    EG->>EG: time (startedAt, completedAt, elapsed)
    EG->>EG: process (id, name, version)
    EG->>EG: taskSources[] (list/detail/form/checklist)
    EG->>EG: evidences (optional sheet)
    EG->>EG: comments (tokens interpolados)
    EG-->>TC: Blob

    TC->>EG: buildExportFilename(pattern, process)
    EG-->>TC: filename.xlsx
    TC->>TC: downloadExcel(blob, filename)
    TC->>PS: completeTask
    TC->>U: toast.success
```

## 6. Exportación manual (JSON / Word / BPMN)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant PP as ProcessPage
    participant PS as ProcessStore
    participant JSON as json-utils
    participant Word as word-generator
    participant Bpmn as bpmn-generator

    U->>PP: click Export

    alt JSON
        PP->>PS: getState().process
        PS-->>PP: ProcessState
        PP->>JSON: exportProcessToJSON
        JSON-->>PP: ProcessExportJSON
        PP->>JSON: downloadJSON(data, filename)
    else Word
        PP->>PS: getState().process
        PP->>Word: generateWordDocument(state)
        Word-->>PP: docx.Document
        PP->>Word: downloadWordDocument
    else BPMN
        PP->>PS: getState().process
        PP->>Bpmn: generateBpmnXml(state)
        Bpmn-->>PP: string (BPMN 2.0)
        PP->>PP: download xml
    end

    PP->>U: archivo descargado
```

## 7. Bandeja multi-proceso (SessionStore)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant Tabs as ProcessTabs / Tray
    participant SS as SessionStore
    participant PS as ProcessStore
    participant Persist as persist-storage (LZ)

    Note over U,Persist: Usuario trabaja en Proceso A

    U->>Tabs: Abrir Proceso B
    Tabs->>SS: pauseCurrentProcess()
    SS->>PS: stopProcessTimer (snapshot)
    SS->>Persist: save snapshot(A)
    SS->>SS: status[A] = paused

    SS->>Persist: load snapshot(B)
    Persist-->>SS: ProcessState B
    SS->>PS: loadProcess(B)
    SS->>SS: status[B] = active
    Tabs-->>U: UI refleja Proceso B

    U->>Tabs: Reanudar Proceso A
    Tabs->>SS: switchToProcess(A.trayId)
    SS->>Persist: save snapshot(B)
    SS->>Persist: load snapshot(A)
    SS->>PS: loadProcess(A)
    SS->>SS: status[A] = active, status[B] = paused
    Tabs-->>U: UI refleja Proceso A

    U->>Tabs: Completar Proceso B
    Tabs->>SS: completeProcessInTray(B.trayId)
    SS->>SS: status[B] = completed
    SS->>Persist: freeze snapshot(B) (read-only)
```

## 8. Autocompletado de variables desde config DevOps

```mermaid
sequenceDiagram
    actor U as Usuario
    participant VF as VariablesForm
    participant CU as ConfigUpload
    participant CL as config-loader
    participant CS as ConfigStore
    participant PS as ProcessStore

    U->>CU: upload devops-config.json
    CU->>CL: parseDevOpsConfig(text)
    CL->>CL: validate schema
    CL-->>CU: DevOpsConfig
    CU->>CS: setConfig(devops)

    VF->>CS: getConfig()
    CS-->>VF: DevOpsConfig
    VF->>VF: match process.variables[].key<br/>contra config entries
    VF->>U: prefill inputs

    U->>VF: ajustar + submit
    VF->>PS: updateCapturedVariables
    PS->>PS: recompute dynamicLinks (templates)
```

## Notas transversales

### Rate limiting

Todas las API routes envuelven su lógica con `withRateLimit(request, routeName, bucket)`. Buckets declarados en `lib/rate-limit.ts`:

- `upload` — endpoints de subida/descarga.
- `strict` — operaciones destructivas (`/api/upload/delete`).
- default — resto.

Si se supera la ventana, se responde `429 Too Many Requests` antes de la validación Zod.

### Validación Zod

Todas las routes ejecutan `validateSchema(schema, body)` (`lib/api-schemas.ts`) antes de tocar lógica. Falla → `400` con detalle por campo.

### Sanitización

Texto libre en evidencias y referencias pasa por `sanitizeText` / `sanitizeUrl` antes de persistir en el store y antes de renderizar. Protege contra XSS en redisplay y al exportar a Word/Excel.

### Persistencia

`lib/persist-storage.ts` envuelve `zustand/middleware/persist` con LZ-string compression. Es transparente para los stores; permite procesos grandes (>1 MB) sin saturar la cuota de localStorage.

### Errores tipados

Los errores surgidos en API o en generadores se envuelven con clases de `lib/errors.ts` (nombres semánticos tipo `ProcessValidationError`, `ExportTemplateError`). La UI los traduce a toasts i18n.

## Ventajas del diseño

- **Separación nítida de preocupaciones**: un store por dominio, un helper por responsabilidad.
- **Flujos reversibles**: uncomplete restaura estado y propaga al grafo de dependencias.
- **Resilencia**: sin S3 → Base64; sin config → manual; sin auth → local.
- **Trazabilidad**: cada escritura pasa por un punto único que recalcula `updateProgress` + `updateTaskBlockedStatus`.
- **Auditable**: exports Excel/Word/JSON/BPMN cubren todas las audiencias (operativa, cumplimiento, ingeniería).
- **Testable**: cada flujo mapeado aquí tiene tests unitarios o E2E asociados.
