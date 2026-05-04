# DevSecOps Process Tracker

[![GitHub stars](https://img.shields.io/github/stars/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/habolanos/devsecops-process-tracker?style=social)](https://github.com/habolanos/devsecops-process-tracker/network/members)
[![Open Source](https://badgen.net/badge/Open%20Source/Yes/green?icon=github)](https://github.com/habolanos/devsecops-process-tracker)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

> **Plataforma profesional para ejecutar, auditar y exportar procesos DevSecOps.** Define procesos en YAML, captura evidencias con trazabilidad completa y genera reportes Word, Excel (declarativo), JSON y diagramas BPMN 2.0 — todo sin escribir código TypeScript.

Pensado para equipos de **DevOps, Seguridad, Auditoría y Compliance** que necesitan estandarizar procedimientos, controlar dependencias entre tareas y mantener un registro auditable de cada ejecución.

**Documentación relacionada:**
[Guía YAML](README.process.md) · [Visor BPMN 2.0](README.bpmn.md) · [Docker Hub](README.dockerhub.md) · [Historial](README.history.md) · [Diagramas](docs/diagrams/) · [Modelo C4](docs/diagrams/c4-model.md)

---

## Tabla de contenidos

1. [Inicio rápido](#inicio-rápido)
2. [Características principales](#características-principales)
3. [Stack tecnológico](#stack-tecnológico)
4. [Arquitectura](#arquitectura)
5. [Catálogo de procesos](#catálogo-de-procesos)
6. [Tipos de tareas](#tipos-de-tareas)
7. [Exportación declarativa a Excel](#exportación-declarativa-a-excel)
8. [Evidencias y almacenamiento](#evidencias-y-almacenamiento)
9. [Desarrollo](#desarrollo)
10. [Testing](#testing)
11. [Docker](#docker)
12. [CI/CD](#cicd)
13. [Seguridad](#seguridad)
14. [Licencia](#licencia)

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

- [Contexto · Contenedores · Componentes (modelo C4)](docs/diagrams/c4-model.md)
- [Arquitectura del sistema](docs/diagrams/arquitectura-sistema.md)
- [Flujo del proceso](docs/diagrams/flujo-proceso.md)
- [Secuencias de datos](docs/diagrams/flujo-datos.md)

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
