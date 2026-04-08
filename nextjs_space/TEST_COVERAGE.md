# Test Coverage Report

## Objetivo
Aumentar la cobertura de pruebas de los archivos `task-card.tsx`, `store.ts` y `excel-generator.ts`.

## Estado Actual (Última Ejecución)

### Cobertura Global
- **Statements**: 86.56%
- **Branches**: 78.93%
- **Functions**: 86.72%
- **Lines**: 89.62%

### Cobertura por Archivo

#### excel-generator.ts
- **Statements**: 95.02%
- **Branches**: 88.4%
- **Functions**: 92.85%
- **Lines**: 95%
- **Líneas sin cubrir**: 607-614

#### task-card.tsx
- **Statements**: 74.45%
- **Branches**: 76.44%
- **Functions**: 60%
- **Lines**: 82.2%
- **Líneas sin cubrir**: 177-180, 185-188, 193-196, 201-204, 225

#### store.ts
- **Statements**: 84.18%
- **Branches**: 68.02%
- **Functions**: 96.29%
- **Lines**: 93.4%
- **Líneas sin cubrir**: 240, 244-250, 263-269, 279, 293, 608, 652

## Historial de Cambios

| Versión | Fecha | Cambios | excel-generator.ts | task-card.tsx | store.ts | Global |
|---------|-------|---------|-------------------|---------------|----------|--------|
| 1.0 | 2024-01-07 | Cobertura inicial | 16.02% | 69.34% | 68.77% | 72.06% |
| 1.1 | 2024-01-07 | Agregados tests para Data Updates | 16.02% | 69.34% | 81.81% | 74.59% |
| 1.2 | 2024-01-07 | Agregados tests para updateDetailData y updateFormData con activityId | 16.02% | 69.34% | 84.18% | 75.05% |
| 1.3 | 2024-01-07 | Agregados tests para task-card (export-excel, description, required evidence) | 16.02% | 69.34% | 84.18% | 75.05% |
| 1.4 | 2024-01-07 | Agregados 10 tests para task-card (handlers, blocked, completed, evidence types) | 16.02% | 72.26% | 84.18% | 75.36% |
| 1.5 | 2024-01-07 | Agregados 12 tests para task-card (data handlers, validations, references) | 16.02% | 74.45% | 84.18% | 75.59% |
| 1.6 | 2026-04-07 | Agregados 16 tests para excel-generator.ts (generateReleaseExcel + activities) | 95.02% | 74.45% | 84.18% | 86.56% |

## Tests Agregados en Última Sesión

### excel-generator.test.ts (16 nuevos tests)
- `should collect tasks from activities (lines 290-291)`
- `should extract formData from form tasks (lines 309-312)`
- `should extract listaItems from dynamic-list tasks`
- `should generate Excel blob from template URL (line 411)`
- `should fill INFO_GENERAL fields in worksheet (lines 423-437)`
- `should fill listaItems when provided (lines 440-448)`
- `should fill detalleItems across 3 sections (lines 451-477)`
- `should fill formData fields (lines 480-488)`
- `should fill validaciones (lines 491-503)`
- `should fill prDeudaTecnica (lines 506-518)`
- `should fill pipelinesCD (lines 521-536)`
- `should fill rollback data (lines 539-551)`
- `should fill procesoRealizado with componentes (lines 554-578)`
- `should fill comentarios (lines 581-583)`
- `should fill evidencias sheet when worksheet exists (lines 586-596)`
- `should skip evidencias when worksheet not found`

## Notas
- La meta global de 70% ha sido superada ampliamente (86.56%)
- excel-generator.ts subió de 16.02% a 95.02% (+79%)
- task-card.tsx está en 74.45% (necesita +5.55% para alcanzar 80%)
- store.ts está en 84.18% (necesita +5.82% para alcanzar 90%)
- Los tests se ejecutan con `npm run test:coverage`
- Los resultados de cobertura se generan en la carpeta `coverage/`
- Total de tests: 476 tests ejecutados exitosamente (todos pasando)
