# DevSecOps Process Tracker

[![GitHub stars](https://img.shields.io/github/stars/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/network/members)
[![Open Source](https://badgen.net/badge/Open%20Source/Yes/green?icon=github)](https://github.com/habolanos/devsecops-process-tracker)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> **Plataforma profesional para ejecutar, auditar y exportar procesos DevSecOps.** Define procesos en YAML, captura evidencias con trazabilidad completa y genera reportes Word, Excel (declarativo), JSON y diagramas BPMN 2.0 — todo sin escribir código TypeScript. Incluye **BPMN Studio Editor** para diseñar procesos visualmente y exportar a YAML.

Pensado para equipos de **DevOps, Seguridad, Auditoría y Compliance** que necesitan estandarizar procedimientos, controlar dependencias entre tareas y mantener un registro auditable de cada ejecución.

**Documentación:**
[🗺️ Diagramas](README.diagrams.md) · [📋 Features](README.features.md) · [📖 Guía YAML](README.process.md) · [🔷 Visor BPMN](README.bpmn.md) · [🐳 Docker](README.dockerhub.md) · [📜 Historial](README.history.md)

---

## Tabla de contenidos

1. [¿Qué es y para quién es?](#qué-es-y-para-quién-es)
2. [Inicio rápido](#inicio-rápido)
3. [Características principales](#características-principales)
4. [Stack tecnológico](#stack-tecnológico)
5. [Arquitectura](#arquitectura)
6. [Catálogo de procesos](#catálogo-de-procesos)
7. [Tipos de tareas](#tipos-de-tareas)
8. [Exportación declarativa a Excel](#exportación-declarativa-a-excel)
9. [Evidencias y almacenamiento](#evidencias-y-almacenamiento)
10. [Desarrollo](#desarrollo)
11. [Testing](#testing)
12. [Docker](#docker)
13. [CI/CD](#cicd)
14. [Seguridad](#seguridad)
15. [Documentación completa](#documentación-completa)
16. [Licencia](#licencia)

---

## ¿Qué es y para quién es?

### El problema que resuelve

Los equipos de **DevSecOps, Auditoría y Compliance** ejecutan procesos repetitivos (releases, PRs, auditorías, gestión de ambientes) que requieren:

- ✅ **Trazabilidad** — saber quién hizo qué, cuándo y con qué evidencia.
- ✅ **Estandarización** — el mismo proceso, igual en cada ejecución, sin pasos saltados.
- ✅ **Reportes automáticos** — Word, Excel y JSON sin copiar-pegar.
- ✅ **Dependencias entre pasos** — la tarea B no se puede iniciar hasta que A esté lista.

Hoy ese flujo suele vivir en Confluence, Jira, hojas de cálculo o en la memoria de las personas — sin garantía de completitud ni historial.

### La solución

**DevSecOps Process Tracker** convierte cada proceso en un archivo YAML declarativo que define fases, tareas, evidencias, variables y exportaciones. Un motor Next.js lo ejecuta como una aplicación web interactiva que:

1. **Guía** al ejecutor tarea a tarea, con validaciones y dependencias.
2. **Captura** evidencias (texto, imágenes, formularios, listas, tablas).
3. **Exporta** automáticamente a Word (reporte auditable) y Excel (template .xlsx) sin código.
4. **Registra** al autor, tiempos reales y variables capturadas en cada ejecución.

### ¿Para quién?

| Perfil | Qué hace en la plataforma |
|---|---|
| **DevSecOps Engineer** | Ejecuta procesos del catálogo, captura evidencias, descarga reportes |
| **Arquitecto / Tech Lead** | Diseña procesos en el BPMN Studio, exporta a YAML y publica al catálogo |
| **Auditor / Compliance** | Revisa reportes Word/Excel con trazabilidad completa (autor, timestamps, evidencias) |
| **SRE / FinOps** | Gestiona ambientes, releases y PRs con flujo estandarizado |

### Conceptos clave

```
 Proceso YAML
 ──────────────
 process
  └── phases[]          ← Fases del proceso (ej: c1-Validación, c2-Ejecución)
       └── activities[]  ← Agrupaciones opcionales dentro de una fase
            └── tasks[]  ← Unidad mínima de trabajo con evidencia y tipo
                          (standard · check · multicheck · form · dynamic-list
                           detail-list · detail-table · export-excel)
```

Cada proceso corre en el **Process Executor** (`/process`) donde el usuario navega fase a fase, completa tareas y descarga reportes al final. El **BPMN Studio** (`/studio`) permite diseñar procesos visualmente y exportar el YAML resultante.

> 💡 **Nuevo en el proyecto?** Comienza por la [Guía YAML](README.process.md) para entender el schema, y luego carga una plantilla del catálogo.

---

## Inicio rápido

### Docker (30 segundos)

```bash
docker run -d -p 3000:3000 habolanos/devsecops-process-tracker:latest
```

Abra [http://localhost:3000](http://localhost:3000). Consulte [README.dockerhub.md](README.dockerhub.md) para volúmenes, variables de entorno y verificación Cosign.

### Desarrollo local

```bash
git clone https://github.com/habolanos/devsecops-process-tracker.git
cd devsecops-process-tracker/nextjs_space
npm install
npm run dev
```

### Deploy en Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/habolanos/devsecops-process-tracker&root-directory=nextjs_space)

---

## Características principales

- **Procesos declarativos en YAML** validados contra `schemas/process.schema.json` (JSON Schema Draft 2020-12).
- **8 tipos de tareas**: `standard`, `check`, `multicheck`, `dynamic-list`, `detail-list`, `detail-table`, `form`, `export-excel`.
- **Confirmación previa al cierre** (`completionAlert`): diálogo opcional con severidad (`info` / `warning` / `critical`) antes de finalizar tareas críticas.
- **Dependencias entre tareas** con bloqueo/desbloqueo automático y visualización de estado.
- **Variables de proceso** parametrizables (texto, select, número) con autofill desde configuración DevOps JSON.
- **Links dinámicos** con plantillas `{variable}` y dos modos (`auto` / `click`).
- **Timer de proceso** multi-sesión con semáforo visual (verde/ámbar/rojo) contra `estimatedTime`.
- **Bandeja multi-proceso** (`Ctrl+P`) con tabs, estados (activo/pausa/completado/cancelado) y persistencia comprimida.
- **Visor BPMN 2.0 interactivo** (`bpmn-js`) generado automáticamente desde el estado del proceso. Ver [README.bpmn.md](README.bpmn.md).
- **Exportación declarativa a Excel**: motor genérico `process.export` que llena templates `.xlsx` sin escribir código. Ver [sección](#exportación-declarativa-a-excel).
- **Exportación a Word, JSON y XML BPMN** con fidelidad completa (evidencias, tiempos, autor, variables).
- **Perfil de usuario opcional** con 12 avatares Marvel inline (o nombre personalizado) incluido en exportaciones.
- **Evidencias**: texto, imágenes (archivo, URL o `Ctrl+V` desde portapapeles), sanitización XSS y soporte S3/Azure Blob o modo local Base64.
- **Subprocesos externos** desde GitHub, URL o archivos locales, con propagación de variables.
- **i18n** (ES/EN) y **tema claro/oscuro** con detección del sistema.

---

## Stack tecnológico

| Tecnología | Versión | Rol |
|------------|---------|-----|
| **Next.js** | 16.2 (App Router, Turbopack) | Framework React SSR/SPA |
| **React** | 18.3 | UI library |
| **TypeScript** | 5.2 | Tipado estático |
| **Tailwind CSS** | 3.3 + shadcn/ui (Radix) | Estilos y componentes |
| **Zustand** | 5.0 | 5 stores con persistencia selectiva |
| **Immer** | 11 | Mutaciones inmutables eficientes |
| **Framer Motion** | — | Animaciones accesibles |
| **Lucide React** | 0.446 | Iconografía |
| **js-yaml** | 4.1 | Parseo YAML |
| **Ajv** | 8.17 | Validación JSON Schema |
| **ExcelJS** | 4.4 | Exportación Excel declarativa |
| **docx** | 9.6 | Generación Word |
| **bpmn-js** | 18.14 | Visor BPMN 2.0 (lazy) |
| **Vitest** | 4.1 | Tests unitarios (550+ pasando) |
| **Playwright** | 1.59 | Tests E2E |
| **NextAuth** | 4.24 (opcional) | Autenticación |
| **AWS SDK v3** | — (opcional) | Integración S3 |
| **lz-string** | — | Compresión de estado persistido |

Consulte el [`package.json`](nextjs_space/package.json) para la lista completa de dependencias y overrides de seguridad.

---

## Arquitectura

El sistema sigue una arquitectura en capas con lógica de negocio pura (`lib/`), estado cliente reactivo (Zustand), UI server-first con islas cliente (Next.js App Router) y validación estricta en el borde (Ajv + Zod).

**Cinco stores Zustand** con responsabilidades separadas:

- **`store.ts`** — proceso activo (fases, actividades, tareas, timer, variables, evidencias).
- **`session-store.ts`** — bandeja multi-proceso con snapshots comprimidos.
- **`config-store.ts`** — configuración DevOps JSON para autofill de variables.
- **`loading-store.ts`** — operaciones async globales con progress bar tipo GitHub.
- **`user-profile-store.ts`** — identidad del operador (12 avatares Marvel + nombre).

**28 módulos de lógica** en `lib/` (parser YAML, generadores Excel/Word/BPMN, helpers de progreso y dependencias, sanitización, subprocess-loader, i18n, rate-limit, alert-feedback, etc.), todos puros y testables.

### Diagramas

[**README.diagrams.md**](README.diagrams.md) contiene 16 diagramas Mermaid con la arquitectura completa:

| Diagrama | Tipo |
|---|---|
| Contexto del sistema (C4 L1) · Contenedores (C4 L2) | `graph TB` |
| Capas Next.js · Schema YAML · Tipos de tarea | `graph TD/LR` |
| Modelo de datos runtime (ProcessState) | `classDiagram` |
| Stores Zustand · Pipeline Excel · Pipeline Word | `graph TB` |
| Máquinas de estado: Tarea · Proceso (Tray) | `stateDiagram-v2` |
| Carga/ejecución · Evidencia · BPMN Studio | `sequenceDiagram` |
| Autenticación OAuth · Colaboración multi-usuario (planificados) | `graph TB` |

Diagramas adicionales (legacy): [C4 model](docs/diagrams/c4-model.md) · [Arquitectura](docs/diagrams/arquitectura-sistema.md) · [Flujo proceso](docs/diagrams/flujo-proceso.md) · [Flujo datos](docs/diagrams/flujo-datos.md)

---

## Catálogo de procesos

Diez plantillas productivas en `nextjs_space/data/processes/`, todas validadas por `npm run validate:processes`:

| Proceso | Archivo | Tiempo estimado | Características |
|---------|---------|-----------------|-----------------|
| Auditoría de Seguridad IT | `it-security-audit.yaml` | 4h | Checklists de seguridad |
| Release DevOps | `devops-release.yaml` | 2h | Validaciones calidad + seguridad |
| Respuesta a Incidentes | `incident-response.yaml` | 3h | Flujo estructurado |
| Pipeline DevOps | `devops-pipeline.yaml` | 1h 30m | Variables + links dinámicos |
| Validación de Pull Request | `pull-request-validation.yaml` | 45m | 6 fases, 21 tareas, 8 variables |
| Checklist de Liberación | `release-checklist.yaml` | 45m | Export Excel declarativo completo |
| **PR destino develop & QA** | `pr-develop-qa.yaml` | 45m | Servicio SCM — DOD, integración, despliegue |
| **PR destino Release-{version}** | `pr-release-version.yaml` | 1h | Servicio SCM — creación release desde master |
| **PR destino master + SCM** | `pr-master-scm.yaml` | 1h 30m | Servicio SCM — rollback + nota de instalación |
| **Gestión de Ambientes** | `gestion-ambientes.yaml` | 43.5–64.5 días | 11 fases, FinOps, Arq Nube, Implementaciones Nube |

Para crear procesos propios consulte la [Guía YAML](README.process.md).

---

## Tipos de tareas

| Tipo | Propósito | Configuración clave |
|------|-----------|---------------------|
| `standard` | Tarea abierta con evidencia libre | `evidence` |
| `check` | Una única verificación binaria | `checkItem` |
| `multicheck` | Lista de verificaciones | `checkItems[]` |
| `dynamic-list` | Captura de N items (repos, URLs…) | `listConfig` |
| `detail-list` | Detalle por item de una `dynamic-list` | `detailConfig.sourceTaskId` |
| `detail-table` | Tabla estructurada por item (boolean/date/list/text/computed-text) | `detailTableConfig.sourceTaskId` + `columns[]` |
| `form` | Formulario con layout grid 1-4 cols | `formConfig.layout` + `fields[]` |
| `export-excel` | Descarga de reporte `.xlsx` | `exportConfig` / hereda de `process.export` |

Cualquier tarea admite opcionalmente `completionAlert` para mostrar un modal de confirmación antes del cierre, con severidad configurable (`info`, `warning`, `critical`).

---

## Exportación declarativa a Excel

El motor genérico `executeExportPlan` (en `lib/excel-generator.ts`) lee el bloque `process.export` del YAML y llena un template `.xlsx` sin necesidad de escribir código TypeScript por proceso. Permite:

- **Arquitectura `sheets[]`**: cada sección declara `sheet` (hoja) y `sources[]` (fuentes de datos).
- **Source kinds**: `variables | static | time | process | comments | range | list | detail | form | checklist | detail-table | cell`.
- **`kind: range`**: lee rango de celdas del template → variable de proceso (`outputVar`).
- **Variables de salida de tareas** (`outputVars`): al completar, la tarea escribe en `capturedVariables`.
- **`optionsFrom`**: variable `select` obtiene opciones dinámicamente desde una variable de salida.
- **`sourceVar`**: `detail-table` puede leer items desde una variable en vez de `sourceTaskId`.
- **`CapturedVariables`** soporta `string | string[]` (listas).
- **Overrides por tarea** (`task.exportConfig` con `inherit: true`).

Ejemplo canónico: `data/processes/release-checklist.yaml`. Detalles completos en [README.process.md](README.process.md#export-excel).

---

## Evidencias y almacenamiento

| Tipo | Modo S3 / Azure Blob | Modo local |
|------|----------------------|------------|
| **Texto** | JSON + localStorage | localStorage |
| **Imagen (archivo)** | Upload con presigned URL | Base64 en localStorage |
| **Imagen (URL)** | Descarga → upload | Descarga → Base64 |
| **Clipboard (`Ctrl+V`)** | Upload con presigned URL | Base64 en localStorage |

El modo local funciona offline, sin costos de nube y es totalmente portable. Todas las entradas de texto pasan por `lib/sanitize.ts` (`escapeHtml`, `sanitizeUrl`, `sanitizeFilename`).

---

## Desarrollo

```bash
cd nextjs_space

npm install                    # Instalar dependencias
npm run dev                    # Servidor desarrollo (http://localhost:3000)
npm run build                  # Build producción
npm run start                  # Servir build
npm run lint                   # ESLint
npm run validate:processes     # Validar YAMLs vs JSON Schema (Ajv)
```

### Variables de entorno

```env
# Almacenamiento en la nube (opcional; por defecto modo local Base64)
AWS_BUCKET_NAME=tu-bucket
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Autenticación (opcional)
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
```

Sin credenciales, la aplicación opera íntegramente con localStorage comprimido (lz-string).

---

## Testing

El proyecto cuenta con **602+ tests unitarios** (Vitest) en 30 archivos y **tests E2E** con Playwright sobre los flujos críticos.

```bash
npm run test                # Modo watch
npm run test:run            # Una sola corrida
npm run test:coverage       # Con reporte de cobertura
npm run test:e2e            # E2E Playwright (levanta servidor)
npm run test:e2e:ui         # UI interactiva de Playwright
npm run test:all            # Unitarios + E2E
```

**Cobertura principal:**

- Parser YAML (`yaml-parser.test.ts`) — validación de los 7 tipos de tarea, `completionAlert`, `process.export` y referencias de celda.
- Generadores (`excel-generator.test.ts`, `word-generator.test.ts`, `bpmn-generator.test.ts` — 39 tests).
- Stores Zustand (`store`, `session-store`, `config-store`, `user-profile-store`).
- Componentes clave (`task-card`, `evidence-modal`, `completion-alert-dialog`, `bpmn-viewer`, `variables-form`, `form-renderer`).
- Utilidades críticas (`sanitize`, `helpers`, `alert-feedback`, `rate-limit`, `persist-storage`).

**E2E** cubren: carga de plantillas/YAML/JSON, cadenas de dependencias y exportación de resultados.

---

## Docker

```bash
# Imagen pre-construida (multi-arch amd64/arm64, firmada con Cosign)
docker pull habolanos/devsecops-process-tracker:latest
docker run -d -p 3000:3000 --name tracker habolanos/devsecops-process-tracker:latest

# Build local
git clone https://github.com/habolanos/devsecops-process-tracker.git
cd devsecops-process-tracker
docker compose up --build -d
```

**Verificación de firma Cosign:**

```bash
cosign verify habolanos/devsecops-process-tracker:latest \
  --certificate-identity-regexp="https://github.com/habolanos/devsecops-process-tracker/*" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com"
```

Guía completa con opciones de volúmenes, variables de entorno y troubleshooting en [README.dockerhub.md](README.dockerhub.md).

---

## CI/CD

Tres plataformas soportadas:

- **GitHub Actions** (`.github/workflows/`): `ci.yml` (lint, tests, SAST CodeQL, Trivy, build), `release.yml` (semantic-release + changelog), `docker-publish.yml` (multi-arch, Cosign signing, SBOM SPDX+CycloneDX, SLSA Level 3 attestations).
- **Azure DevOps** (`azure-pipelines.yml`): test, security-scan, build, deploy con aprobación manual.
- **GitLab CI** (`.gitlab-ci.yml`): install, test, security (Ultimate SAST + Dependency Scanning), build, deploy a staging/producción.

Los commits siguen **[Conventional Commits](https://www.conventionalcommits.org/)** validados por `commitlint`. El versionado es automático con `semantic-release`.

---

## Seguridad

- **SAST** con CodeQL v4 en cada PR.
- **Dependency scanning** con `npm audit` y Trivy (0 vulnerabilidades activas).
- **Container scanning** con Trivy sobre la imagen Alpine 3.21.
- **SBOM** generado en formato SPDX y CycloneDX.
- **Firma de imágenes** con Cosign (Sigstore).
- **SLSA Level 3** attestations vía GitHub Attestations.
- **Sanitización XSS** en todo texto libre (`lib/sanitize.ts`).
- **Rate limiting** en API Routes (`lib/rate-limit.ts`).
- **Validación Zod** en payloads de API (`lib/api-schemas.ts`).
- **Compresión lz-string** del estado persistido en localStorage.

Overrides explícitos de dependencias transitivas vulnerables en `package.json` (minimatch, brace-expansion, picomatch, tar).

---

## Documentación completa

Todos los documentos del proyecto en un solo lugar:

| Documento | Descripción | Audiencia |
|---|---|---|
| [🗺️ README.diagrams.md](README.diagrams.md) | 16 diagramas Mermaid: C4, flujos, estados, secuencias, stores, pipelines | Arquitectos · Desarrolladores |
| [📋 README.features.md](README.features.md) | Inventario de features con estado, prioridad y esfuerzo estimado (⌨️ · 🧪) | Product · Tech Leads |
| [📖 README.process.md](README.process.md) | Guía completa del schema YAML: todos los campos, tipos, exports, snippets | Cualquiera que cree procesos |
| [🔷 README.bpmn.md](README.bpmn.md) | Visor BPMN 2.0: generación automática, token simulation, uso del Studio | Diseñadores de procesos |
| [🐳 README.dockerhub.md](README.dockerhub.md) | Deploy Docker: volúmenes, variables de entorno, verificación Cosign | SRE · DevOps |
| [📜 README.history.md](README.history.md) | Historial completo de versiones con descripción detallada de cada cambio | Todos |
| [📁 docs/features/](docs/features/) | Documentos de diseño por feature (análisis, arquitectura, decisiones) | Contribuidores |
| [📁 docs/diagrams/](docs/diagrams/) | Diagramas adicionales legacy (C4, flujos, arquitectura) | Arquitectos |

---

## Licencia

**GNU General Public License v3.0** — Software libre para uso educativo y comercial. Consulte [LICENSE](LICENSE).

---
## Visits

[![Visit tracker](https://clustrmaps.com/map_v2.png?cl=ffffff&w=300&t=tt&d=2IMzz90NUzGxjVLJ385PGzeVLOoAvDNxc7El0ESQzbw&co=2d78ad&ct=ffffff)](https://clustrmaps.com/site/1c9qy)

---
## Autor

**Harold Adrian** — [LinkedIn](https://www.linkedin.com/in/habolanos) · [GitHub](https://github.com/habolanos)

Historial detallado de cambios en [README.history.md](README.history.md).

---

[![GitHub stars](https://img.shields.io/github/stars/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/network/members)
[![GitHub watchers](https://img.shields.io/github/watchers/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/watchers)
