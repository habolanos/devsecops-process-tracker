# Historial de Cambios

Historial completo de versiones y cambios del DevSecOps Process Tracker.

## 📊 Versiones Recientes

| Fecha | Versión | Descripción |
|-------|---------|-------------|
| 2026-04-19 | **2.1.0** | **Motor Declarativo de Exportación Excel**: Nueva sección `process.export` a nivel de proceso YAML que define declarativamente cómo llenar un template `.xlsx` sin necesidad de código TypeScript específico. Permite agregar procesos con templates propios solo editando YAML. Componentes nuevos en `lib/excel-generator.ts`: `executeExportPlan` (motor genérico), `resolveExportPlan` (fusiona `process.export` con overrides de `task.exportConfig`), `interpolateExportTokens` (tokens `{today:FMT}`, `{now:FMT}`, `{process.*}`, `{vars.*}`, `{fecha}` legacy), `buildExportFilename` (sanea y garantiza `.xlsx`). Nuevos tipos en `lib/types.ts`: `ProcessExportConfig`, `ProcessExportMappings`, `ExportTaskSource` (kinds: `list`/`detail`/`form`/`checklist`). `yaml-parser.ts` valida `process.export`, referencias de celda (`^[A-Z]+[0-9]+$`) y que toda tarea `export-excel` tenga `templatePath` (propio o heredado). **Bugfixes**: `outputFilename` del YAML ahora se respeta (antes se ignoraba); eliminado el fallback silencioso hardcoded a `/templates/TEMPLATE_Checklist_Liberacion.xlsx` en `task-card.tsx`; falta de templatePath produce toast de error explícito. `release-checklist.yaml` migrado al nuevo formato como referencia canónica. Flujo legacy (`generateReleaseExcel` + `processToReleaseReport` + `EXCEL_CELL_MAP`) mantenido por compatibilidad con tests. `ExportExcelConfig` retro-compatible: `templatePath` ahora opcional, admite `mappings` e `inherit`. |
| 2026-04-17 | 2.0.5 | **User Profile & Author Identity**: Perfil de usuario opcional con avatares Marvel (10 superhéroes SVG inline: Iron Man, Spider-Man, Capitán América, Thor, Hulk, Black Widow, Doctor Strange, Black Panther, Capitana Marvel, Wolverine). Nombre aleatorio por defecto, personalizable vía popover en header. Store `user-profile-store.ts` con persistencia comprimida. `ProcessAuthor` en `ProcessState` capturado al cargar proceso. Export JSON incluye autor, import preserva autor original. Sección "Información del Ejecutor" en documento Word. Componentes: `marvel-avatars.tsx`, `user-profile-popover.tsx`. Integrado en headers de home y process page. |
| 2026-04-15 | 2.0.4 | **Footer Open Source + Links**: Badge "Código Abierto/Open Source" verde en footer con links al repositorio GitHub (`habolanos/devsecops-process-tracker`) y LinkedIn (`/in/habolanos`). Íconos `Github` y `Linkedin` de lucide-react. Traducciones i18n para footer. Footer rediseñado con layout flex responsive. |
| 2026-04-14 | 2.0.3 | **Docker Build Fix**: Eliminado archivo `.docker.labels` (valores sin comillas causaban `Process: not found`). Labels OCI hardcodeados directamente en `LABEL` instruction del Dockerfile. Resueltos 6 warnings `UndefinedVar` y error de shell sourcing. ARGs dinámicos (`BUILD_DATE`, `VCS_REF`, `VERSION`) permanecen configurables. |
| 2026-04-14 | 2.0.2 | **npm Deprecation Warnings Resolution**: Overrides de dependencias transitivas deprecadas. `glob@^13.0.0` reemplaza `glob@7.2.3` (elimina también `inflight@1.0.6`). `rimraf@^5.0.0` reemplaza `rimraf@2.7.1`. Warnings restantes sin reemplazo API-compatible: `whatwg-encoding`, `lodash.isequal`, `mumath`, `fstream` — seguros como dependencias transitivas. |
| 2026-04-14 | 2.0.1 | **Vercel Deployment Fix**: Corrección de error "No Output Directory named dist" en Vercel. `output: 'standalone'` removido del next.config.js por defecto (solo necesario para Docker). Agregado `NEXT_OUTPUT_STANDALONE=1` como env var condicional en Dockerfile. Creado `vercel.json` con buildCommand, installCommand y outputDirectory correctos para despliegue en Vercel. Build ahora funciona en ambos entornos: Vercel (default) y Docker (standalone). |
| 2026-04-08 | **2.0.0** | **Visualización BPMN Interactiva**: Vista de diagrama BPMN 2.0 generada automáticamente desde `ProcessState`. Toggle Lista/BPMN en header del proceso. Generador `lib/bpmn-generator.ts` que convierte el proceso en XML BPMN 2.0 con pool, lanes por fase, tareas tipadas (userTask/manualTask/serviceTask), sequence flows y coordenadas DI calculadas. Componente `bpmn-viewer.tsx` con: carga lazy (`ssr: false`) de `bpmn-js`, colores de estado por tarea (verde=completada, azul=seleccionada, amarillo=pendiente, gris=bloqueada), toolbar de zoom (in/out/fit), leyenda de estados, click en tarea → navega a lista y activa la tarea. 39 nuevos tests unitarios para `bpmn-generator.ts`. Bump de versión mayor por nueva funcionalidad de visualización de procesos. |
| 2026-04-07 | 1.29.6 | **Targeted Coverage Boost for Low-Coverage Modules**: Nuevos tests unitarios para elevar cobertura en módulos críticos. `sanitize.test.ts` agrega cobertura de `escapeHtml`, `sanitizeText`, `sanitizeUrl`, `sanitizeFilename`, `sanitizeRichText` y `useSanitizedValue`. `dynamic-link-button.test.tsx` cubre estados deshabilitado por variables, comportamiento `click`, auto-open con delay, click manual en `auto` y renderizado de `DynamicLinksList`. `detail-list-input.test.tsx` cubre estado sin items fuente, placeholders dinámicos, actualización de `detailData`, validación `maxLength`, estado `disabled` y mensaje de completitud. |
| 2026-04-06 | 1.29.5 | **Testing Coverage for New Features**: Cobertura de testing unitario para nuevas funcionalidades. excel-template-helper.test.ts: tests para getOffsetCell (offset de columnas, casos edge, nombres multi-letra). json-utils.test.ts: tests actualizados para importar/exportar dynamic-list (listData), detail-list (detailData), form (formData). Corrección de tests existentes para incluir campos requeridos de TaskExport (type, checkItems, references, dependencies, dynamicLinks, evidenceConfig). Exportación de getOffsetCell para testing |
| 2026-04-06 | 1.29.4 | **JSON Export Complete Fidelity**: Exportación JSON con 100% de fidelidad para todos los tipos de tareas. TaskExport actualizado con: exportConfig, listConfig, listData, detailConfig, detailData, formConfig, formData, references, dependencies, dynamicLinks, evidenceConfig. exportTask() exporta todos los datos de nuevos tipos. importTask() restaura todos los datos al importar. Ahora JSON exportado contiene toda la información de dynamic-list, detail-list y form tasks |
| 2026-04-06 | 1.29.3 | **Word Token Replacement Fix**: Reemplazo de tokens en labels de formularios para reporte Word. word-generator ahora usa replaceFormConfigTokens() para reemplazar #OFFSET-1# y #CELDA# con valores reales del Excel template antes de mostrar evidencia en Word. Obtiene templatePath de tarea export-excel en misma fase. Loop de tareas cambiado a for statement para soportar await. Ahora Word muestra valores de celdas en lugar de tokens literales |
| 2026-04-06 | 1.29.2 | **Word Report Evidence Fix**: Agregado soporte de evidencia para nuevos tipos de tareas en reporte Word. dynamic-list: muestra listData con items numerados. detail-list: muestra sourceItem + capturedText. form: muestra formData con labels de formConfig. Incluye tareas de activities (antes solo phase.tasks). Mensajes "No hay datos" para evidencia vacía. Fix de propiedad italics (de Paragraph a TextRun). word-generator.ts actualizado para manejar todos los tipos de evidencia |
| 2026-04-06 | 1.29.1 | **Cell Reference Tokens for Form Labels**: Tokens para reemplazar labels de formularios con valores del Excel template. Token `#OFFSET-1#`: referencia relativa a valueCell (una columna a la izquierda). Ejemplo: valueCell="F85" + label="#OFFSET-1#" → toma valor de E85. Token `#CELDA#`: referencia absoluta a celda. Ejemplo: label="#D85#" → toma valor de celda D85. Reemplazo en tiempo de renderizado al leer el template Excel. Archivo `excel-template-helper.ts` con funciones `replaceCellTokens()`, `getOffsetCell()`, `replaceFormConfigTokens()`. FormRenderer acepta `templatePath` y reemplaza tokens. task-card.tsx extrae templatePath de tarea export-excel |
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

---

## 📈 Estadísticas de Versiones

- **Total de versiones**: 43+
- **Última versión**: 2.0.4
- **Primer lanzamiento**: 1.0.0 (2026-03-01)
- **Periodo de desarrollo**: ~38 días
- **Promedio de versiones por semana**: ~7-8

---

## 🎯 Categorías de Cambios

### Features (feat)
- Tipos de tareas: dynamic-list, detail-list, form
- Subprocesos externos
- Links dinámicos parametrizables
- Timer de proceso
- Modo dark/light
- Gestión multi-proceso

### Fixes (fix)
- Corrección de vulnerabilidades de seguridad
- Fix de timers y tiempos
- Corrección de UI y UX
- Fix de exportación Word

### Performance (perf)
- Optimización de Zustand con Immer
- Debounce en localStorage
- React.memo en componentes
- Virtualización de listas

### Documentation (docs)
- Diagramas de arquitectura y flujo
- Guías de procesos YAML
- Documentación Docker Hub
- Historial de cambios

### Testing (test)
- Tests unitarios (Vitest)
- Tests E2E (Playwright)
- Cobertura de código
- Tests de nuevos tipos de tareas

---

## 🔒 Seguridad

### Vulnerabilidades Resueltas
- CVE-2026-27903/27904 (minimatch)
- CVE-2026-33750 (brace-expansion)
- CVE-2026-33671/33672 (picomatch)
- CVE-2026-29786/31802 (tar)

### Medidas de Seguridad
- Trivy scanning en CI/CD
- CodeQL SAST analysis
- SBOM generation (SPDX/CycloneDX)
- SLSA Level 3 attestations
- Cosign signing de imágenes Docker

---

## 📊 Métricas de Calidad

### Cobertura de Tests
- **Tests Unitarios**: 127+ (Vitest)
- **Tests E2E**: 6+ (Playwright)
- **Cobertura**: ~67%

### Dependencias
- **Total de dependencias**: 50+
- **Dependencias directas**: 20+
- **Vulnerabilidades activas**: 0

### CI/CD
- **Workflows**: 3 (CI, Release, Docker)
- **Tiempo de build**: ~5-10 minutos
- **Success rate**: 95%+

---

## 📝 Notas de Lanzamiento

### Versiones Mayores (1.x.0)
- 1.0.0: Versión inicial
- 1.1.0: Procesos precargados
- 1.2.0: Variables dinámicas
- 1.3.0: Nuevo proceso PR validation
- 1.4.0: Configuración DevOps
- 1.5.0: Tests E2E
- 1.6.0: Timer de proceso
- 1.7.0: Mejoras Pro
- 1.8.0: Seguridad y Performance Pro
- 1.9.0: Gestión multi-proceso
- 1.10.0: Modo Dark/Light
- 1.11.0: Activities y Subprocesses
- 1.12.0: Task Types y Clipboard
- 1.13.0: CI/CD con GitHub Actions
- 1.20.0: Docker Hub Metadata
- 1.21.0: Security Vulnerabilities Fixed
- 1.22.0: Global Progress Indicator
- 1.23.0: Fixes & Performance
- 1.24.0: Estimated Time & Semaphore Colors
- 1.25.0: Process Page Layout Refactor
- 1.26.0: Dynamic List Task Type
- 1.27.0: Performance Optimization & Evidence Flow
- 1.28.0: Detail List Task Type
- 1.29.0: Form Task Type
- 1.29.1: Cell Reference Tokens
- 1.29.2: Word Report Evidence Fix
- 1.29.3: Word Token Replacement Fix
- 1.29.4: JSON Export Complete Fidelity
- 1.29.5: Testing Coverage for New Features
- 1.29.6: Targeted Coverage Boost for Low-Coverage Modules

---

## 🚀 Roadmap

### Planeado
- Integración con bases de datos (Prisma)
- Autenticación (NextAuth)
- Más tipos de tareas
- Mejoras en UI/UX
- Integración con herramientas externas

---

**Última actualización:** 2026-04-07
**Versión del documento:** 1.0.0
