# Modelo C4 — DevSecOps Process Tracker

> Última revisión: 2026-04-21 · sincronizado con `develop`

Este documento describe la arquitectura del tracker siguiendo el [modelo C4](https://c4model.com/) de Simon Brown, con tres niveles de abstracción: **Context**, **Container** y **Component**. Los diagramas están codificados en Mermaid para integrarse con el resto de la documentación (`arquitectura-sistema.md`, `flujo-proceso.md`, `flujo-datos.md`).

---

## Nivel 1 — System Context

Visión general del sistema desde la perspectiva de sus usuarios y los sistemas externos con los que interactúa.

```mermaid
C4Context
    title System Context — DevSecOps Process Tracker

    Person(engineer, "Ingeniero DevSecOps", "Ejecuta procesos, completa tareas, adjunta evidencias y exporta reportes.")
    Person(lead, "Tech Lead / Auditor", "Revisa evidencias, exporta reportes Word/Excel y audita trazabilidad.")

    System(tracker, "DevSecOps Process Tracker", "Aplicación Next.js que orquesta procesos YAML, gestiona estado multi-proceso y genera evidencias y reportes.")

    System_Ext(s3, "AWS S3 / Azure Blob", "Almacenamiento de evidencias vía presigned URLs.")
    System_Ext(github, "GitHub / URL remota", "Fuente de subprocesos YAML cargados on-demand.")
    System_Ext(devops, "Azure DevOps / Jira (opcional)", "Origen de configuración DevOps autocompletada en variables.")
    System_Ext(auth, "NextAuth Provider (opcional)", "Autenticación federada cuando está habilitada.")

    Rel(engineer, tracker, "Ejecuta procesos y completa tareas", "HTTPS")
    Rel(lead, tracker, "Exporta reportes y audita", "HTTPS")
    Rel(tracker, s3, "Sube / descarga evidencias", "HTTPS + presigned URL")
    Rel(tracker, github, "Carga subprocesos YAML", "HTTPS")
    Rel(tracker, devops, "Lee configuración para autofill", "HTTPS / JSON")
    Rel(tracker, auth, "Delegación de identidad", "OAuth / OIDC")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Nivel 2 — Containers

Despliegue lógico del sistema: procesos, almacenes y servicios que componen el tracker.

```mermaid
C4Container
    title Container Diagram — DevSecOps Process Tracker

    Person(engineer, "Ingeniero DevSecOps", "Usuario principal")

    System_Boundary(tracker, "DevSecOps Process Tracker") {
        Container(spa, "Next.js App (SPA + SSR)", "Next.js 16 · React 18 · TypeScript 5", "App Router con páginas server-first y componentes cliente. UI shadcn/ui + Tailwind. Renderiza procesos, tareas, BPMN y formularios.")
        Container(state, "Client State", "Zustand 5 + persist + LZ-string", "5 stores: process · session · config · loading · userProfile. Persistencia selectiva en localStorage comprimido.")
        Container(api, "API Routes", "Next.js Route Handlers · Zod · rate-limit", "Endpoints REST: /api/health, /api/processes, /api/upload/*.")
        ContainerDb(yaml, "Process Templates", "YAML + JSON Schema", "7 plantillas en data/processes/ validadas contra schemas/process.schema.json.")
        ContainerDb(persist, "Local Persistence", "localStorage (LZ-string)", "Snapshot de bandeja multi-proceso, variables, timers.")
        Container(lib, "Business Logic", "lib/ · 29 módulos TypeScript puros", "Parser YAML, generadores (Excel/Word/BPMN), helpers de progreso, sanitize, alert-feedback, subprocess-loader, i18n.")
    }

    System_Ext(s3, "AWS S3 / Azure Blob", "Evidencias")
    System_Ext(github, "GitHub / URL", "Subprocesos remotos")
    System_Ext(devops, "Azure DevOps / Jira", "Config DevOps")

    Rel(engineer, spa, "Usa", "HTTPS")
    Rel(spa, state, "Lee / escribe estado reactivo")
    Rel(spa, lib, "Invoca funciones puras")
    Rel(spa, api, "fetch()", "JSON / HTTPS")
    Rel(state, persist, "Persiste snapshots")
    Rel(api, yaml, "Lee plantillas + schema")
    Rel(lib, yaml, "Parsea y valida")
    Rel(api, s3, "Genera presigned URL")
    Rel(spa, s3, "PUT/GET directo", "HTTPS")
    Rel(lib, github, "Descarga subprocesos", "HTTPS")
    Rel(lib, devops, "Lee JSON de config", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Nivel 3 — Components (Next.js App)

Detalle de los componentes dentro del container **Next.js App**, agrupados por responsabilidad.

```mermaid
C4Component
    title Component Diagram — Next.js App

    Container_Boundary(spa, "Next.js App") {
        Component(pages, "Pages", "app/page.tsx · app/process/page.tsx", "Rutas principales: catálogo de procesos y vista de ejecución.")

        Component(globalUI, "Global UI", "CommandPalette · ProcessTabs · ProcessTray · UserProfile · ThemeToggle · ErrorBoundary", "Shell de navegación y utilidades transversales.")

        Component(processUI, "Process UI", "TaskCard · ActivityCard · ProcessSidebar · EvidenceModal · VariablesForm · CompletionAlertDialog · BpmnViewer · ProcessTimer · FormRenderer", "Componentes de ejecución de proceso. TaskCard orquesta gate de completado con CompletionAlertDialog.")

        Component(stores, "Zustand Stores", "store · session-store · config-store · loading-store · user-profile-store", "Estado reactivo con selectores y acciones tipadas.")

        Component(parser, "YAML Parser", "lib/yaml-parser.ts", "Parsea YAML → ProcessState. Valida completionAlert, variables, dependencias, export plan.")

        Component(generators, "Generators", "excel-generator · word-generator · bpmn-generator", "Exportadores declarativos. Excel usa process.export plan; Word genera acta; BPMN emite XML 2.0.")

        Component(loaders, "Loaders", "subprocess-loader · config-loader", "Carga remota de subprocesos (GitHub/URL/local) y JSON de configuración DevOps.")

        Component(helpers, "Helpers & Security", "helpers · sanitize · errors · optimistic-updates · alert-feedback · rate-limit · api-schemas · i18n-context", "Utilidades puras: progreso, dependencias, sanitización, feedback severidad, rate limit y schemas Zod.")

        Component(apiRoutes, "API Routes", "/api/health · /api/processes · /api/upload/*", "Endpoints REST con validación Zod y rate limiting.")
    }

    ContainerDb_Ext(yaml, "Process Templates", "YAML + JSON Schema")
    System_Ext(s3, "AWS S3 / Azure Blob", "Evidencias")
    System_Ext(remote, "GitHub / URL / Azure DevOps", "Fuentes externas")

    Rel(pages, globalUI, "Compone shell")
    Rel(pages, processUI, "Compone ejecución")
    Rel(processUI, stores, "useStore / selectores")
    Rel(globalUI, stores, "useStore / selectores")
    Rel(stores, parser, "parseYAMLToProcess()")
    Rel(processUI, generators, "Exporta Excel/Word/BPMN")
    Rel(processUI, helpers, "progress · sanitize · feedback")
    Rel(pages, apiRoutes, "fetch()")
    Rel(apiRoutes, yaml, "Lee + valida")
    Rel(parser, yaml, "Lee YAML")
    Rel(apiRoutes, s3, "Presigned URL")
    Rel(processUI, s3, "PUT/GET evidencias")
    Rel(loaders, remote, "HTTPS")
    Rel(stores, loaders, "Carga subprocesos / config")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Notas de lectura

- **Context** responde *¿quién usa el sistema y con qué se integra?*
- **Container** responde *¿qué piezas desplegables lo componen?*
- **Component** responde *¿cómo se organiza internamente la SPA?*
- El **nivel 4 (Code)** se omite intencionalmente: los diagramas UML de clases suelen quedar obsoletos; en su lugar, consúltese el código en `nextjs_space/lib/` y `nextjs_space/app/`, cubierto por 529+ tests unitarios.

## Referencias cruzadas

- Arquitectura detallada: [`arquitectura-sistema.md`](./arquitectura-sistema.md)
- Flujo de proceso end-to-end: [`flujo-proceso.md`](./flujo-proceso.md)
- Secuencias de datos: [`flujo-datos.md`](./flujo-datos.md)
- Schema YAML: [`../../schemas/process.schema.json`](../../schemas/process.schema.json)
- Guía de procesos YAML: [`../../README.process.md`](../../README.process.md)
