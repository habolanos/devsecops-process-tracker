# YAML Schema: análisis y soporte en IDE

Fecha: 2026-04-20
Estado: **implementado**

## 1. Problema

Los archivos YAML de proceso (`nextjs_space/data/processes/*.yaml`) son la entrada central de la aplicación: describen fases, actividades, tareas, variables, links dinámicos y la configuración declarativa de exportación Excel (`process.export`, introducida en v2.1.0). Sin una especificación formal, escribir un YAML nuevo requiere leer `lib/types.ts` + `lib/yaml-parser.ts` y los errores se descubren solo en runtime.

## 2. Inventario de archivos analizados

**Productivos** (`nextjs_space/data/processes/`):

- `it-security-audit.yaml` — 3 fases, tareas directas, básico.
- `devops-release.yaml` — 3 fases, tareas directas, básico.
- `incident-response.yaml` — 4 fases, tareas directas, básico.
- `devops-pipeline.yaml` — phases → tasks con `variables` y `dynamicLinks`.
- `pull-request-validation.yaml` — phases → **activities** → tasks con `variables`, `dynamicLinks` en 3 niveles (phase/activity/task).
- `release-checklist.yaml` — **referencia canónica**: `variables` (14), `activities`, todos los `task.type` (`check`, `multicheck`, `dynamic-list`, `detail-list`, `form`, `export-excel`) y el bloque `process.export` completo.

**Fixtures** (`nextjs_space/__tests__/fixtures/`): `simple-process.yaml`, `complex-dependencies.yaml`, `process-with-activities.yaml`, `process-with-task-types.yaml`, `invalid-yaml.yaml` (excluido intencionalmente).

## 3. Hallazgos

1. **Gap de tipos**: `estimatedTime` aparece en los 6 YAML productivos pero **no estaba tipado** en `ProcessYAML.process` — el parser lo leía con `as any`. Corregido en este trabajo.
2. **`subprocesses`**: tipado en `lib/types.ts` y soportado por el parser, **no se usa en ningún YAML productivo**. Se mantiene el soporte; el schema lo valida.
3. **Asimetría de checks**: `type: check` → `checkItem` (singular). `type: multicheck` → `checkItems` (plural). Confuso; el schema aplica `oneOf` discriminado por `type` y previene el error.
4. **Cell references**: el parser exige `^[A-Z]+[0-9]+$` en runtime. El schema lo exige en tiempo de edición.
5. **Valores por defecto del parser**: `evidence`, `order`, `references`, `dependencies`, `dynamicLinks` se default-ean cuando faltan. El schema los marca como opcionales para reflejar fielmente el comportamiento.

## 4. Solución implementada

### Arquitectura

```text
schemas/process.schema.json               ← JSON Schema 2020-12 (fuente de verdad)
.vscode/settings.json                     ← glob -> schema para Red Hat YAML LS
.vscode/yaml-process.code-snippets        ← esqueletos (task-check, task-form, process-export, ...)
nextjs_space/scripts/validate-processes.mjs  ← Ajv + js-yaml
nextjs_space/package.json                 ← npm run validate:processes
nextjs_space/data/processes/*.yaml        ← header `# yaml-language-server: $schema=...`
```

### Reglas que el schema captura

- **`process`** requerido con `id`, `name`, `description`, `version`, `phases`; `estimatedTime` opcional con patrón `^(\d+[dhm])+$`.
- **`process.version`** debe coincidir con semver `^\d+\.\d+\.\d+`.
- **`variables[]`** con `type: select` requiere `options` (vía `if/then/else`).
- **`subprocesses[].source`** con `type: github|url` requiere `url`; `type: local` requiere `path`.
- **`phases[]`** con `anyOf`: al menos `activities` o `tasks` no vacío.
- **`tasks[].type`** controla qué sub-bloque es obligatorio (discriminador `oneOf`):
  - `check` ⇒ `checkItem`
  - `multicheck` ⇒ `checkItems[≥1]`
  - `dynamic-list` ⇒ `listConfig`
  - `detail-list` ⇒ `detailConfig`
  - `form` ⇒ `formConfig`
  - `export-excel` ⇒ `exportConfig` (opcional si hereda de `process.export`)
- **`process.export.mappings.*`** con `"pattern": "^[A-Z]+[0-9]+$"` para cell refs y `"pattern": "^[A-Z]+$"` para column letters.
- **`ExportTaskSource`** con discriminator `kind` (`list|detail|form|checklist`).
- **`evidence.type`** enum `text|image|both|form|none`.
- **`dynamicLinks[].behavior`** enum `auto|click`.

### Integración IDE

`.vscode/settings.json` mapea globs YAML al schema vía la [YAML Language Server](https://github.com/redhat-developer/yaml-language-server) (Red Hat, incluida por defecto en VSCode/Windsurf/Cursor). Además, cada YAML productivo declara al comienzo:

```yaml
# yaml-language-server: $schema=../../../schemas/process.schema.json
```

Esto es un fallback universal: funciona en cualquier editor que respete el language server, aun sin `.vscode/settings.json`.

### Snippets

`.vscode/yaml-process.code-snippets` incluye 14 esqueletos: `process-skeleton`, `phase`, `activity`, `task-standard`, `task-check`, `task-multicheck`, `task-dynamic-list`, `task-detail-list`, `task-form`, `task-export-excel`, `process-export`, `var-text`, `var-select`, `dynamic-link`, `reference`.

### Validación en CI / local

```bash
npm run validate:processes
```

Recorre `nextjs_space/data/processes/` y `nextjs_space/__tests__/fixtures/` (excluyendo `invalid-yaml.yaml`) y compara contra `schemas/process.schema.json` con Ajv 2020-12. Exit code 0/1.

Dependencias añadidas a `devDependencies`: `ajv@^8.17.1`, `ajv-formats@^3.0.1` (`js-yaml` ya era dependencia).

## 5. Verificación

- `npm run validate:processes` → **10 de 10 archivos pasan** (6 productivos + 4 fixtures legítimos; `invalid-yaml.yaml` se excluye porque su propósito es fallar).

## 6. Limitaciones conocidas

- **Referencias cruzadas no se validan estáticamente**: `task.dependencies[]`, `detailConfig.sourceTaskId`, `taskSources[].sourceTaskId` apuntan a `task.id` pero JSON Schema no puede validar integridad referencial entre nodos hermanos. El parser sí los valida en runtime; es candidato a una regla custom en el script de validación si se justifica.
- **`estimatedTime`**: patrón `^(\d+[dhm])+$` cubre los usos actuales (`45m`, `1h30m`, `4h`). Ampliar si `parseTimeString` acepta más formatos.
- **Unidades del `duration` de `process.export.outputFilename`**: los tokens `{today:FMT}`, `{vars.*}`, `{process.*}` no se validan por el schema — es `string` libre. Se documenta en `README.process.md`.

## 7. Próximos pasos opcionales

- Ejecutar `validate:processes` en un pre-commit hook (`lint-staged` + `husky`) o en el workflow de CI.
- Generar el schema automáticamente desde `lib/types.ts` con `ts-json-schema-generator` (riesgo: pierde control fino sobre `oneOf` discriminados).
- Añadir validación cruzada de IDs (regla custom en el script).
