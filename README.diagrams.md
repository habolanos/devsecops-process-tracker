# 🗺️ Diagramas de Arquitectura — DevSecOps Process Tracker

> Documentación técnica de arquitectura con diagramas Mermaid.  
> Renderiza correctamente en GitHub, GitLab, Notion y VSCode con la extensión Markdown Preview Mermaid Support.

---

## 📑 Índice

1. [Contexto del Sistema (C4 L1)](#1-contexto-del-sistema-c4-l1)
2. [Arquitectura de Contenedores (C4 L2)](#2-arquitectura-de-contenedores-c4-l2)
3. [Capas de la Aplicación Next.js](#3-capas-de-la-aplicación-nextjs)
4. [Jerarquía del Schema YAML](#4-jerarquía-del-schema-yaml)
5. [Modelo de Datos en Runtime (ProcessState)](#5-modelo-de-datos-en-runtime-processstate)
6. [Arquitectura de Stores Zustand](#6-arquitectura-de-stores-zustand)
7. [Máquina de Estados: Tarea](#7-máquina-de-estados-tarea)
8. [Máquina de Estados: Proceso (Tray)](#8-máquina-de-estados-proceso-tray)
9. [Flujo: Carga y Ejecución de Proceso](#9-flujo-carga-y-ejecución-de-proceso)
10. [Flujo: Captura de Evidencia y Completado de Tarea](#10-flujo-captura-de-evidencia-y-completado-de-tarea)
11. [Flujo: BPMN Studio — Diseño Bidireccional](#11-flujo-bpmn-studio--diseño-bidireccional)
12. [Pipeline de Exportación Excel](#12-pipeline-de-exportación-excel)
13. [Pipeline de Exportación Word](#13-pipeline-de-exportación-word)
14. [Tipos de Tarea y sus Configuraciones](#14-tipos-de-tarea-y-sus-configuraciones)
15. [Flujo: Autenticación OAuth (Planificado)](#15-flujo-autenticación-oauth-planificado)
16. [Arquitectura: Colaboración Multi-Usuario (Planificado)](#16-arquitectura-colaboración-multi-usuario-planificado)

---

## 1. Contexto del Sistema (C4 L1)

Vista de alto nivel: actores externos y sistemas con los que interactúa la plataforma.

```mermaid
graph TB
    subgraph Personas
        EJ["👤 Ejecutor de Proceso\n(DevSecOps Engineer)"]
        DI["👤 Diseñador de Proceso\n(Arquitecto / Tech Lead)"]
    end

    subgraph Sistema["DevSecOps Process Tracker"]
        APP["🖥️ Next.js 15 App\n/process · /studio"]
    end

    subgraph Externos["Sistemas Externos"]
        S3["☁️ Amazon S3\nEvidencias (archivos, imágenes)"]
        XLSX["📊 Excel Templates\n.xlsx en /public/templates"]
        WORD["📄 Word Generator\n.docx en memoria"]
        OAUTH["🔐 OAuth Providers\nGoogle · Microsoft · Facebook · X\n(planificado)"]
    end

    EJ -->|"Ejecuta procesos\nCaptura evidencia"| APP
    DI -->|"Diseña procesos BPMN\nEdita YAML"| APP
    APP -->|"Upload / Download\nevidencias"| S3
    APP -->|"Lee template\nEscribe datos"| XLSX
    APP -->|"Genera reporte\ncompleto"| WORD
    OAUTH -.->|"Autenticación\n(planificado)"| APP
```

---

## 2. Arquitectura de Contenedores (C4 L2)

Unidades desplegables y su responsabilidad dentro del sistema.

```mermaid
graph TB
    subgraph Browser["Navegador (Client-Side)"]
        RC["React Client Components\n'use client'\nZustand + localStorage"]
    end

    subgraph NextJS["Next.js 15 — App Router (Server + Client)"]
        RSC["React Server Components\nlayouts · catálogo"]
        API_PROC["API Route\nGET /api/processes\n→ lee YAML del FS"]
        API_UPLOAD["API Route\nPOST /api/upload\n→ proxy S3"]
        API_HEALTH["API Route\nGET /api/health"]
    end

    subgraph Libs["Librerías de Proceso (isomórficas)"]
        PARSER["yaml-parser.ts\nYAML → ProcessState"]
        STORE["store.ts\nZustand + Immer + Persist"]
        SESSION["session-store.ts\nProcess Tray multi-proceso"]
        PROFILE["user-profile-store.ts\nPerfil + Avatar"]
        WORD_G["word-generator.ts\ndocx en memoria"]
        EXCEL_G["excel-generator.ts\nMotor declarativo .xlsx"]
        BPMN2Y["bpmn-to-yaml.ts\nBPMN XML → YAML"]
        BPMN_G["bpmn-generator.ts\nYAML → BPMN XML"]
    end

    subgraph Data["Datos en Disco (FS)"]
        YAML_F["data/processes/*.yaml\n10+ procesos definidos"]
        TMPL["public/templates/*.xlsx\nTemplates de exportación"]
        SCHEMA["schemas/process.schema.json\nJSON Schema 2020-12"]
    end

    subgraph Ext["Externos"]
        S3_EXT["Amazon S3"]
    end

    Browser <-->|"HydrationRSC streaming"| NextJS
    RC <--> STORE
    RC <--> SESSION
    RC <--> PROFILE
    API_PROC -->|"readFile"| YAML_F
    API_UPLOAD -->|"putObject"| S3_EXT
    STORE --> PARSER
    PARSER -->|"valida contra"| SCHEMA
    EXCEL_G --> TMPL
```

---

## 3. Capas de la Aplicación Next.js

Organización interna por responsabilidad dentro de `nextjs_space/`.

```mermaid
graph LR
    subgraph UI["🖼️ UI Layer — app/"]
        HOME["app/page.tsx\nHome · Catálogo"]
        PROC_PAGE["app/process/page.tsx\nEjecutor de Proceso"]
        STUDIO_PAGE["app/studio/page.tsx\nBPMN Studio"]
        COMP["app/process/_components/\ntask-card · phase-panel\nevidence-input · export-button"]
        STUDIO_COMP["app/studio/_components/\nbpmn-modeler · yaml-preview\nstudio-toolbar"]
    end

    subgraph STATE["⚙️ State Layer — lib/stores"]
        STORE_P["store.ts\nProcessStore (Zustand)"]
        STORE_S["session-store.ts\nSessionStore (Tray)"]
        STORE_U["user-profile-store.ts\nUserProfileStore"]
        STORE_C["config-store.ts\nConfigStore"]
    end

    subgraph LOGIC["🧠 Business Logic — lib/"]
        YAML_P["yaml-parser.ts"]
        WORD_G2["word-generator.ts"]
        EXCEL_G2["excel-generator.ts"]
        BPMN_L["bpmn-to-yaml.ts\nbpmn-generator.ts"]
        HELPERS["helpers.ts\nupdateProgress · blockedStatus"]
        MERGE["process-merge.ts\nextractProgress · mergeProgress"]
    end

    subgraph API_L["🔌 API Layer — app/api/"]
        API_P2["GET /api/processes"]
        API_U2["POST /api/upload"]
        API_H2["GET /api/health"]
    end

    subgraph INFRA["🏗️ Infrastructure — lib/infra"]
        PERSIST["persist-storage.ts\nLZ-compress + localStorage"]
        S3_L["s3.ts · aws-config.ts"]
        RATE["rate-limit.ts"]
        DB_L["db.ts · Prisma Client"]
    end

    UI --> STATE
    UI --> LOGIC
    UI --> API_L
    STATE --> LOGIC
    STATE --> INFRA
    API_L --> INFRA
    LOGIC --> INFRA
```

---

## 4. Jerarquía del Schema YAML

Estructura completa del archivo `.yaml` de proceso tal como lo parsea `yaml-parser.ts`.

```mermaid
graph TD
    PROC["process\n─────────────\nid · name · description\nversion · estimatedTime"]

    PROC --> VARS["variables[]\n─────────────\nkey · label · type\nrequired · options"]
    PROC --> PHASES["phases[]"]
    PROC --> SUBS["subprocesses[]\n─────────────\nsource: github·url·local"]
    PROC --> EXPORT["export\n─────────────\ntemplatePath\noutputFilename\nautoDownload"]

    PHASES --> PHASE["phase\n─────────────\nid · name · description\norder · dynamicLinks"]
    PHASE --> ACT["activities[] (opcional)"]
    PHASE --> TASKS_D["tasks[] (directo)"]

    ACT --> ACTIVITY["activity\n─────────────\nid · name · order\ndynamicLinks · images"]
    ACTIVITY --> TASKS_A["tasks[]"]

    TASKS_D --> TASK
    TASKS_A --> TASK["task\n─────────────\nid · name · type · order\ndescription · dependencies"]

    TASK --> EVIDENCE["evidence\n─────────────\ntype: text·image·both·form·none\nrequired · description"]
    TASK --> ALERT["completionAlert (opcional)\n─────────────\nseverity: info·warning·critical\ntitle · description\nconfirmLabel · cancelLabel"]
    TASK --> OUTPUTS["outputVars[] (opcional)\n─────────────\nname · type · source · mapTo"]
    TASK --> TYPE_CFG["config según type"]

    TYPE_CFG --> T_STD["standard → (sin config extra)"]
    TYPE_CFG --> T_CHK["check → checkItem\n(id · label · description)"]
    TYPE_CFG --> T_MCHK["multicheck → checkItems[]"]
    TYPE_CFG --> T_FORM["form → formConfig\n(fields[]: id·label·type·valueCell)"]
    TYPE_CFG --> T_LIST["dynamic-list → listConfig\n(label · min/maxItems)"]
    TYPE_CFG --> T_DETAIL["detail-list → detailConfig\n(fields[] · sourceTaskId)"]
    TYPE_CFG --> T_TABLE["detail-table → detailTableConfig\n(columns[] · startRow)"]
    TYPE_CFG --> T_XLS["export-excel → exportConfig\n(templatePath · mappings)"]

    EXPORT --> MAPPINGS["mappings\n─────────────\nsheets[]"]
    MAPPINGS --> SHEET["sheet\n─────────────\nname · sources[]"]
    SHEET --> SRC["source kinds\n─────────────\nvariables · static · time\nprocess · comments · range\nlist · detail · form\nchecklist · detail-table · cell"]
```

---

## 5. Modelo de Datos en Runtime (ProcessState)

Estructura en memoria que mantiene `store.ts` durante la ejecución de un proceso.

```mermaid
classDiagram
    class ProcessState {
        +id: string
        +name: string
        +description: string
        +version: string
        +estimatedTime: string
        +startedAt: string
        +completedAt: string
        +isComplete: boolean
        +progress: number
        +capturedVariables: CapturedVariables
        +author: ProcessAuthor
        +workSession: WorkSession
        +phases: PhaseState[]
    }

    class PhaseState {
        +id: string
        +name: string
        +order: number
        +progress: number
        +activities: ActivityState[]
        +tasks: TaskState[]
    }

    class ActivityState {
        +id: string
        +name: string
        +order: number
        +tasks: TaskState[]
    }

    class TaskState {
        +id: string
        +name: string
        +type: TaskType
        +isComplete: boolean
        +isBlocked: boolean
        +completedAt: string
        +evidence: TaskEvidence
        +checkItems: CheckItemState[]
        +listData: ListItem[]
        +detailData: DetailItem[]
        +detailTableData: DetailTableRow[]
        +formData: FormFieldValue[]
        +completionAlert: CompletionAlertConfig
        +outputVars: TaskOutputVar[]
    }

    class TaskEvidence {
        +text: string
        +fileUrl: string
        +fileName: string
        +imageUrl: string
        +type: EvidenceType
    }

    class WorkSession {
        +startedAt: string
        +pausedAt: string
        +totalPausedMs: number
        +isRunning: boolean
    }

    class ProcessAuthor {
        +name: string
        +avatarId: string
    }

    ProcessState "1" --> "*" PhaseState
    PhaseState "1" --> "*" ActivityState
    PhaseState "1" --> "*" TaskState
    ActivityState "1" --> "*" TaskState
    TaskState "1" --> "1" TaskEvidence
    ProcessState "1" --> "1" WorkSession
    ProcessState "1" --> "1" ProcessAuthor
```

---

## 6. Arquitectura de Stores Zustand

Tres stores independientes con persistencia comprimida en `localStorage` y sus relaciones.

```mermaid
graph TB
    subgraph PS["ProcessStore — store.ts"]
        P_STATE["ProcessState | null\nprocess actual en ejecución"]
        P_NAV["currentPhaseId\ncurrentActivityId\ncurrentTaskId"]
        P_FLAGS["hasHydrated\nhasStartedInteraction"]
        P_ACTIONS["loadProcess · clearProcess\ncompleteTask · uncompleteTask\nupdateTaskEvidence\nupdateCapturedVariables\nstartProcessTimer · refreshFromYAML"]
    end

    subgraph SS["SessionStore — session-store.ts"]
        S_TRAY["ProcessTrayItem[]\n(snapshots de procesos)"]
        S_ACTIVE["activeTrayId"]
        S_ACTIONS["addProcess · switchToProcess\npauseCurrentProcess\ncompleteProcess · cancelProcess\nremoveFromTray"]
    end

    subgraph US["UserProfileStore — user-profile-store.ts"]
        U_PROF["UserProfile\nname · avatarId · isCustom"]
        U_ACTIONS["initProfile · updateName\nupdateAvatar · randomizeHero\nresetName · clearProfile"]
    end

    subgraph CS["ConfigStore — config-store.ts"]
        C_CFG["DevOps Config\nlanguage · theme settings"]
    end

    subgraph PERSIST_LAYER["Persistencia — persist-storage.ts"]
        LC["LZ-String Compress\n+ localStorage"]
    end

    PS -->|"snapshot al pausar"| SS
    SS -->|"restaura snapshot"| PS
    PS --> PERSIST_LAYER
    SS --> PERSIST_LAYER
    US --> PERSIST_LAYER
    CS --> PERSIST_LAYER

    subgraph CONSUMERS["Consumidores"]
        TASK_CARD["task-card.tsx"]
        PHASE_PANEL["phase-panel.tsx"]
        EXPORT_BTN["export-button.tsx"]
        HEADER["UserProfilePopover"]
        STUDIO_PG["studio/page.tsx"]
    end

    PS --> TASK_CARD
    PS --> PHASE_PANEL
    PS --> EXPORT_BTN
    US --> HEADER
    SS --> PHASE_PANEL
```

---

## 7. Máquina de Estados: Tarea

Ciclo de vida completo de una `TaskState` durante la ejecución de un proceso.

```mermaid
stateDiagram-v2
    [*] --> Pendiente : proceso cargado

    Pendiente --> Bloqueada : dependencias no completadas
    Bloqueada --> Pendiente : dependencias resueltas

    Pendiente --> EnCaptura : usuario abre tarea
    EnCaptura --> Pendiente : usuario cancela / cierra

    EnCaptura --> EsperandoConfirmacion : click completar\n[completionAlert definido]
    EsperandoConfirmacion --> EnCaptura : usuario cancela modal
    EsperandoConfirmacion --> Completada : usuario confirma modal

    EnCaptura --> Completada : click completar\n[sin completionAlert]\n[validaciones OK]

    Completada --> Pendiente : usuario reabre tarea

    Completada --> [*] : proceso completo

    state EnCaptura {
        [*] --> CapturaEvidencia
        CapturaEvidencia --> CapturaCheck : type=check·multicheck
        CapturaEvidencia --> CapturaForm : type=form
        CapturaEvidencia --> CapturaLista : type=dynamic-list
        CapturaEvidencia --> CapturaDetalle : type=detail-list·detail-table
        CapturaEvidencia --> ExportExcel : type=export-excel
    }
```

---

## 8. Máquina de Estados: Proceso (Tray)

Ciclo de vida de un proceso dentro del `SessionStore` (bandeja multi-proceso).

```mermaid
stateDiagram-v2
    [*] --> Activo : addProcess() — usuario carga YAML

    Activo --> Pausado : switchToProcess(otro)\npauseCurrentProcess()
    Pausado --> Activo : switchToProcess(este)

    Activo --> Completado : markProcessComplete()\ntodas las tareas done

    Activo --> Cancelado : cancelProcess()
    Pausado --> Cancelado : cancelProcess()

    Completado --> [*] : removeFromTray()
    Cancelado --> [*] : removeFromTray()

    note right of Pausado
        snapshot completo de ProcessState
        persiste en localStorage comprimido
    end note

    note right of Activo
        timer corriendo
        store principal sincronizado
    end note
```

---

## 9. Flujo: Carga y Ejecución de Proceso

Secuencia completa desde que el usuario selecciona un proceso hasta que lo completa.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant HOME as Home (Catálogo)
    participant API as GET /api/processes
    participant FS as YAML en Disco
    participant PARSER as yaml-parser.ts
    participant STORE as ProcessStore
    participant SESSION as SessionStore
    participant UI as Process Page

    U->>HOME: selecciona proceso del catálogo
    HOME->>API: fetch /api/processes/{id}
    API->>FS: readFile(data/processes/{id}.yaml)
    FS-->>API: YAML string
    API-->>HOME: { yaml: string }
    HOME->>PARSER: parseYAMLToProcess(yaml)
    PARSER-->>HOME: ProcessState
    HOME->>SESSION: addProcess(ProcessState) → trayId
    HOME->>STORE: loadProcess(ProcessState)
    HOME->>UI: navigate /process

    loop Por cada fase/tarea
        U->>UI: completa evidencia
        UI->>STORE: updateTaskEvidence(...)
        U->>UI: click "Completar"
        UI->>STORE: completeTask(...)
        STORE->>STORE: updateProgress()\nupdateTaskBlockedStatus()
        STORE-->>UI: re-render progress
    end

    STORE->>STORE: markProcessComplete()
    UI->>U: muestra resumen + botón exportar
```

---

## 10. Flujo: Captura de Evidencia y Completado de Tarea

Detalle del proceso de completado con y sin `completionAlert`.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant TC as task-card.tsx
    participant STORE as ProcessStore
    participant S3C as s3.ts
    participant MODAL as CompletionAlertModal

    U->>TC: adjunta archivo / escribe texto / sube imagen
    TC->>S3C: uploadFile(file) [si es archivo/imagen]
    S3C-->>TC: { url, fileName }
    TC->>STORE: updateTaskEvidence(phaseId, taskId, evidence)

    U->>TC: click "Completar tarea"

    alt completionAlert definido en tarea
        TC->>MODAL: open({ severity, title, description })
        MODAL-->>U: muestra diálogo de confirmación
        alt usuario confirma
            U->>MODAL: click "Confirmar"
            MODAL->>STORE: completeTask(phaseId, taskId)
            STORE->>STORE: persist capturedVariables\n+ outputVars → capturedVariables
        else usuario cancela
            U->>MODAL: click "Cancelar"
            MODAL-->>TC: tarea queda pendiente
        end
    else sin completionAlert
        TC->>STORE: completeTask(phaseId, taskId)
    end

    STORE->>STORE: updateProgress()\nupdateTaskBlockedStatus(dependents)
    STORE-->>TC: re-render UI
```

---

## 11. Flujo: BPMN Studio — Diseño Bidireccional

Cómo el editor BPMN y el preview YAML se mantienen sincronizados.

```mermaid
graph TB
    subgraph EDITOR["bpmn-modeler.tsx (bpmn-js v18)"]
        CANVAS["Canvas BPMN\n(drag & drop)"]
        CS["commandStack.changed\nevent"]
        SAVE["saveXML(format:true)\n→ XML string"]
        SIM["TokenSimulationModule\n(bpmn-js-token-simulation)"]
    end

    subgraph STUDIO_PAGE["studio/page.tsx"]
        XML_STATE["xmlState\n(ref)"]
        YAML_STATE["yamlState\n(useState)"]
        AUTO_SYNC["autoSync toggle\n(polling 800ms)"]
        MANUAL_SYNC["handleSync()"]
    end

    subgraph YAML_PREVIEW["yaml-preview.tsx"]
        READ_MODE["Modo Lectura\nsyntax highlight"]
        EDIT_MODE["Modo Edición\ntextarea + Tab=2sp\nvalidación draft"]
        APPLY["Aplicar cambios\nonYamlChange(draft)"]
    end

    subgraph CONVERTERS["Conversores"]
        B2Y["bpmn-to-yaml.ts\nparseBpmnXml()\nbpmnToYaml()"]
        Y2B["bpmn-generator.ts\nyamlToXml()"]
    end

    subgraph TOOLBAR["studio-toolbar.tsx"]
        NEW["Nuevo proceso"]
        IMPORT["Importar XML\n(paste / file)"]
        CATALOG["Cargar catálogo"]
        EXPORT_XML["Exportar XML"]
        EXPORT_YAML["Exportar YAML"]
        SIMULATE["Simular tokens\n▶ / ■"]
    end

    CANVAS -->|"evento onChange"| CS
    CS --> SAVE
    SAVE -->|"XML actualizado"| XML_STATE
    AUTO_SYNC -->|"polling activo"| MANUAL_SYNC
    MANUAL_SYNC --> B2Y
    XML_STATE --> B2Y
    B2Y --> YAML_STATE
    YAML_STATE --> READ_MODE
    READ_MODE -->|"click Editar"| EDIT_MODE
    EDIT_MODE --> APPLY
    APPLY --> YAML_STATE

    IMPORT -->|"importXML(xml)"| CANVAS
    CATALOG -->|"Y2B → importXML"| Y2B
    Y2B --> CANVAS
    EXPORT_XML -->|"saveXML()"| SAVE
    EXPORT_YAML --> YAML_STATE
    SIMULATE --> SIM
```

---

## 12. Pipeline de Exportación Excel

Motor declarativo `excel-generator.ts` que rellena un template `.xlsx` con datos del proceso.

```mermaid
graph LR
    subgraph TRIGGER["Disparador"]
        TASK_XLS["Tarea type=export-excel\ncompleted"]
    end

    subgraph ENGINE["excel-generator.ts"]
        RESOLVE["resolveExportPlan()\nmerge process.export\n+ task.exportConfig"]
        FETCH["fetch(templatePath)\n→ ArrayBuffer"]
        WORKBOOK["ExcelJS.Workbook\nloadFile(buffer)"]
        EXEC["executeExportPlan()\nitera sheets[].sources[]"]
        INTERPOLATE["interpolateExportTokens()\n{today:FMT} · {vars.*}\n{process.*}"]
        FILENAME["buildExportFilename()\ntoken pattern → nombre"]
    end

    subgraph SOURCES["Tipos de Source (ExportSource)"]
        SRC_VAR["variables\n→ capturedVariables → celdas"]
        SRC_STATIC["static\n→ valores fijos → celdas"]
        SRC_TIME["time\n→ timestamps, elapsed"]
        SRC_PROC["process\n→ id · name · version"]
        SRC_LIST["list\n→ listData[] → columna"]
        SRC_DETAIL["detail\n→ detailData[] → secciones"]
        SRC_FORM["form\n→ formData[].valueCell"]
        SRC_CHECK["checklist\n→ checkItems → filas"]
        SRC_TABLE["detail-table\n→ rows[] → columnas"]
        SRC_CELL["cell\n→ dot-path → celda específica"]
        SRC_RANGE["range\n→ lee rango → outputVar"]
        SRC_CMT["comments\n→ template interpolado"]
    end

    subgraph OUTPUT["Salida"]
        BLOB["Blob .xlsx"]
        DOWNLOAD["Auto-download\n(link click)"]
    end

    TASK_XLS --> RESOLVE
    RESOLVE --> FETCH
    FETCH --> WORKBOOK
    WORKBOOK --> EXEC
    EXEC --> SRC_VAR & SRC_STATIC & SRC_TIME & SRC_PROC
    EXEC --> SRC_LIST & SRC_DETAIL & SRC_FORM & SRC_CHECK
    EXEC --> SRC_TABLE & SRC_CELL & SRC_RANGE & SRC_CMT
    EXEC --> INTERPOLATE
    RESOLVE --> FILENAME
    EXEC --> BLOB
    BLOB --> DOWNLOAD
```

---

## 13. Pipeline de Exportación Word

Generación de documento `.docx` como reporte de auditoría del proceso completado.

```mermaid
graph TB
    subgraph TRIGGER2["Disparador"]
        BTN["Botón Exportar Word\n(proceso completado)"]
    end

    subgraph WORD_GEN["word-generator.ts (docx library)"]
        COLLECT["Recolecta datos\n• ProcessState completo\n• ProcessAuthor (nombre · avatar)\n• CapturedVariables\n• WorkSession (tiempo total)\n• Evidencias por tarea"]
        BUILD["Construye documento\n• Portada con metadatos\n• Tabla de variables capturadas\n• Secciones por fase/actividad\n• Tarjeta por tarea:\n  – Tipo · Estado · Tiempo\n  – Evidencia (texto / URL)\n  – CheckItems completados\n  – FormData / ListData"]
        SIGN["Sección Firma\n• Nombre del ejecutor\n• Avatar ID\n• Fecha y hora de exportación"]
    end

    subgraph OUTPUT2["Salida"]
        DOCX["Blob .docx\nen memoria"]
        DL2["saveAs(blob,\n'proceso-FECHA.docx')"]
    end

    BTN --> COLLECT
    COLLECT --> BUILD
    BUILD --> SIGN
    SIGN --> DOCX
    DOCX --> DL2
```

---

## 14. Tipos de Tarea y sus Configuraciones

Mapa de los 8 tipos de tarea YAML y qué datos producen / consumen.

```mermaid
graph LR
    subgraph TYPES["task.type"]
        STD["standard\nEvidencia libre"]
        CHK["check\nUn checkbox"]
        MCHK["multicheck\nN checkboxes\nreq. todos checked"]
        FORM["form\nFormulario\ncon campos tipados"]
        LIST["dynamic-list\nLista dinámica\nde items (texto)"]
        DETAIL["detail-list\nLista estructurada\npor secciones"]
        TABLE["detail-table\nTabla por columnas\nbooleans·dates·lists"]
        XLS["export-excel\nEjecuta motor\ndeclarativo Excel"]
    end

    subgraph INPUT["Config requerida (YAML)"]
        CI_CHK["checkItem:\n  id · label · description"]
        CI_MCHK["checkItems[]:\n  id · label · description"]
        CI_FORM["formConfig:\n  fields[]: id·label·type·valueCell"]
        CI_LIST["listConfig:\n  label · min/maxItems · separators"]
        CI_DETAIL["detailConfig:\n  fields[] · sourceTaskId?"]
        CI_TABLE["detailTableConfig:\n  columns[] · startRow · maxRows"]
        CI_XLS["exportConfig:\n  templatePath · mappings"]
    end

    subgraph OUTPUT3["Output (outputVars)"]
        OV1["evidence.text"]
        OV2["checkItems.*.checked\n→ booleanos"]
        OV3["formData[]\n→ FormFieldValue[]"]
        OV4["listData[]\n→ ListItem[]"]
        OV5["detailData[]\n→ DetailItem[]"]
        OV6["detailTableData[]\n→ DetailTableRow[]"]
    end

    CHK --> CI_CHK --> OV2
    MCHK --> CI_MCHK --> OV2
    FORM --> CI_FORM --> OV3
    LIST --> CI_LIST --> OV4
    DETAIL --> CI_DETAIL --> OV5
    TABLE --> CI_TABLE --> OV6
    STD --> OV1
    XLS --> CI_XLS
```

---

## 15. Flujo: Autenticación OAuth (Planificado)

Secuencia de autenticación con NextAuth.js v4 y sincronización con el store Zustand.

```mermaid
sequenceDiagram
    actor U as Usuario
    participant UI as Login Page\n/auth/signin
    participant NA as NextAuth.js\n/api/auth
    participant OP as OAuth Provider\n(Google/Microsoft/etc.)
    participant AS as AuthStore\n(Zustand)
    participant PS2 as ProcessStore
    participant WORD2 as Word Generator

    U->>UI: click "Iniciar con Google"
    UI->>NA: signIn('google')
    NA->>OP: redirect OAuth2 authorize
    OP-->>U: pantalla de login del provider
    U->>OP: credenciales / consiente permisos
    OP-->>NA: authorization code
    NA->>OP: exchange code → access_token
    OP-->>NA: { name, email, picture }
    NA-->>UI: session JWT firmada

    UI->>AS: AuthSync.sync(session)
    AS->>AS: setUser({ name, email, provider })
    AS->>PS2: updateCapturedVariables\n({ USUARIO: name, EMAIL: email })

    Note over AS,PS2: La identidad real reemplaza\nla del UserProfileStore local

    U->>UI: ejecuta y completa proceso
    UI->>WORD2: generateReport(process, author)
    WORD2-->>U: .docx con nombre + email\nen portada y firma
```

---

## 16. Arquitectura: Colaboración Multi-Usuario (Planificado)

Visión objetivo de la arquitectura con backend real para trabajo simultáneo.

```mermaid
graph TB
    subgraph CLIENTS["Clientes (Navegadores)"]
        C1["👤 Usuario A\n(editor)"]
        C2["👤 Usuario B\n(reviewer)"]
        C3["👤 Usuario C\n(viewer)"]
    end

    subgraph NEXT_SERVER["Next.js 15 — Server"]
        AUTH_MW["Middleware Auth\ngetServerSession()"]
        API_RUN["POST /api/runs\nPATCH /api/runs/{id}/tasks"]
        API_RT["WebSocket / SSE\n/api/runs/{id}/events"]
        RBAC["RBAC Check\nadmin·editor·reviewer·viewer"]
    end

    subgraph DB["Base de Datos (Prisma + PostgreSQL)"]
        MDL_RUN["ProcessInstance\n(run del proceso)"]
        MDL_TASK["TaskProgress\n(estado por tarea)"]
        MDL_EV["Evidence\n(archivos · texto)"]
        MDL_USR["User · Organization"]
        MDL_LOG["AuditLog\n(quién·qué·cuándo)"]
    end

    subgraph SYNC["Sincronización"]
        CRDT["CRDT / Optimistic Update\nupdatedAt → last-write-wins"]
        EVENTS["Server-Sent Events\no WebSocket (Socket.io)"]
    end

    subgraph STORAGE["Almacenamiento"]
        S3_F["Amazon S3\nevidencias"]
        REDIS["Redis (Upstash)\nrate-limit · session cache"]
    end

    C1 & C2 & C3 -->|"HTTPS + JWT"| AUTH_MW
    AUTH_MW --> RBAC
    RBAC --> API_RUN
    RBAC --> API_RT
    API_RUN --> CRDT
    CRDT --> MDL_RUN & MDL_TASK & MDL_EV & MDL_LOG
    MDL_TASK --> EVENTS
    EVENTS -->|"push diff"| C1 & C2 & C3
    API_RUN --> S3_F
    AUTH_MW --> REDIS
    MDL_USR --> RBAC
```

---

## 📎 Referencias

| Recurso | Descripción |
|---|---|
| [`README.features.md`](README.features.md) | Inventario de features con estado y esfuerzo |
| [`README.history.md`](README.history.md) | Historial completo de versiones |
| [`docs/features/`](docs/features/) | Documentos de diseño por feature |
| [`schemas/process.schema.json`](schemas/process.schema.json) | JSON Schema 2020-12 del YAML |
| [`nextjs_space/lib/types.ts`](nextjs_space/lib/types.ts) | Tipos TypeScript canónicos |

---

*Última actualización: 2026-06-02 · Versión actual: v3.0.3 · Diagramas generados con [Mermaid](https://mermaid.js.org)*
