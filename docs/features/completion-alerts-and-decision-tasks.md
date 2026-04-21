# Análisis de diseño: Alertas de confirmación y Tareas de decisión

Fecha: 2026-04-20
Estado: **análisis / pre-implementación**
Autor: Cascade (a solicitud del mantenedor)

Este documento analiza dos propuestas de mejora sobre el modelo de tareas:

1. **Alerta de confirmación** al finalizar una tarea (diálogo info/warning/critical).
2. **Tareas de decisión Sí/No** que ramifican el flujo, saltando tareas según la respuesta.

El análisis prioriza **una especificación YAML limpia**: sin listas redundantes, con invariantes verificables por schema y parser, y con defaults que reducen verbosidad sin perder claridad.

---

## Parte I — Feature 1: Alerta de confirmación al finalizar

### I.1 Caso de uso

**La alerta es opcional**: solo aplica a tareas que declaren explícitamente el bloque `completionAlert` en su YAML. Las tareas sin ese bloque mantienen el comportamiento actual (un click finaliza). Esto es importante porque la mayoría de tareas no necesitan confirmación; el feature está pensado únicamente para acciones irreversibles o de alto impacto.

Cuando una tarea con `completionAlert` se marca como completada, antes de persistir aparece un diálogo modal con:

- **Icono** según severidad (informativo, advertencia, crítico).
- **Refuerzo visual** (flash del borde/fondo del diálogo) en el color de la severidad — ver I.10.
- **Título** y **descripción** configurables.
- Dos acciones: **Confirmar** y **Cancelar**.

Al cancelar, la tarea queda pendiente (estado previo intacto).

### I.2 Punto de integración en el código

Ya localizado: `@c:\Users\hadrian\repos-e11\devsecops-process-tracker\nextjs_space\app\process\_components\task-card.tsx:212-272` — función `handleToggleComplete`. La bifurcación actual es:

```text
click
 ├─ si completada → uncompleteTask
 └─ si no completada → validar checks/forms → completeTask
```

La alerta se inyecta antes de `completeTask` (nunca antes de `uncompleteTask`, ver I.4).

Existe `@c:\Users\hadrian\repos-e11\devsecops-process-tracker\nextjs_space\components\ui\alert-dialog.tsx` (Radix + shadcn), 100% reutilizable.

### I.3 Especificación YAML propuesta

Una única forma canónica, con defaults explícitos:

```yaml
- id: "task-deploy-prod"
  name: "Despliegue a producción"
  type: "check"
  checkItem:
    description: "He desplegado la versión objetivo"
    required: true

  completionAlert:
    severity: "warning"          # enum: info | warning | critical (default: "info")
    title: "Confirmar despliegue"  # opcional (default: "Confirmar: {task.name}")
    description: |                 # REQUERIDO: texto completo de la alerta
      Esta acción marcará la tarea como completada y desbloqueará las fases
      siguientes. Verifica health checks, métricas y rollback plan.
    confirmLabel: "Sí, finalizar"  # opcional (default: "Finalizar")
    cancelLabel: "Cancelar"        # opcional (default: "Cancelar")
```

**Decisiones deliberadas:**

- **Bloque opcional**: si una tarea no declara `completionAlert`, no hay diálogo. El feature es opt-in por tarea.
- **Un solo campo raíz**: `completionAlert`. No hay variantes compactas tipo `confirmOnComplete: "texto"` que producirían dos formas de hacer lo mismo.
- **`description` es el único campo requerido** dentro del bloque. Todo lo demás tiene default. Mínimo válido:

  ```yaml
  completionAlert:
    description: "¿Seguro que deseas finalizar?"
  ```

- **`severity` como enum cerrado**: 3 valores (info/warning/critical). Nada de tipos libres.

### I.4 Reglas de comportamiento

| Evento | ¿Muestra alerta? |
|---|---|
| Pendiente → completada (manual) | **Sí** si `completionAlert` existe |
| Completada → pendiente (desmarcar) | **No** (siempre permitido) |
| Completar vía tarea `export-excel` (genera reporte) | **Sí**, antes de generar el Excel |
| Completar vía `decisionTask` (ver Feature 2) | **No** (el diálogo de decisión es el propio acto de decidir) |
| `task.isBlocked === true` | **No aplica** (el botón ya está disabled) |
| Tarea de tipo `check`/`multicheck` sin checks satisfechos | **No** (la validación previa impide el intento) |

### I.5 Cambios estructurales (sin pseudocódigo)

- `types.ts`: nuevo `interface CompletionAlertConfig { severity: 'info'|'warning'|'critical'; title?: string; description: string; confirmLabel?: string; cancelLabel?: string }` + campo `completionAlert?: CompletionAlertConfig` en `TaskYAML` y `TaskState`.
- `yaml-parser.ts`: copia shallow; validación: si `severity` inválido → error; `description` obligatorio.
- `process.schema.json`: `$defs.CompletionAlert` con enum + required `description`; añadido a todos los branches de `Task.oneOf`.
- `.vscode/yaml-process.code-snippets`: nuevo snippet `completion-alert`.
- `task-card.tsx`: envoltura condicional. Estado local `pendingCompletion: boolean`. Si `completionAlert` existe, en lugar de llamar a `completeTask` directamente, abre el diálogo; `onConfirm` ejecuta el flujo original; `onCancel` no hace nada.
- Nuevo componente: `completion-alert-dialog.tsx` (50-80 líneas).

### I.6 Casos edge

1. **Tarea `export-excel` + `completionAlert`**: el diálogo se muestra ANTES de `handleExportExcel`. Si cancela, no se genera ni descarga el Excel. *Deseable*.
2. **Proceso restaurado desde JSON**: `completionAlert` es puramente de runtime (no se guarda; viene del YAML base). Restauración idempotente.
3. **Usuario cierra la app con el diálogo abierto**: no persiste estado; al volver, la tarea sigue pendiente.
4. **Accesibilidad**: `AlertDialog` de Radix ya provee `aria-modal`, trap focus, esc-to-cancel. No requiere trabajo extra.

### I.7 Riesgos y mitigación

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Abuso (autor pone alerta en cada tarea) | Media | Documentar patrón: solo para acciones irreversibles o de impacto |
| Mensajes muy largos rompen layout | Baja | Max-height con scroll en la descripción del diálogo |
| Usuario quiere saltarse la confirmación | Baja | No implementar "no volver a mostrar" (defeats the purpose) |

### I.8 Tests propuestos (sin escribirlos aún)

- Unit: parser carga `completionAlert`, valida severity inválido.
- Unit: parser exige `description`.
- Component: al click en complete, si `completionAlert` existe, render del dialog.
- Component: click en cancelar → tarea sigue pendiente; click en confirmar → tarea completa.
- Component: severity `critical` aplica clase destructiva al botón.
- E2E (opcional): flujo completo en un proceso real.

### I.9 Estimación

**XS-S** — ~4 horas de trabajo enfocado para el diálogo + flash visual (I.10). Un solo PR.

### I.10 Refuerzo visual sin sonido (Opción B — incluida en el plan)

En lugar de feedback auditivo, la alerta usa **únicamente refuerzo visual** asociado al `severity`. Esta es la opción adoptada por defecto por las siguientes razones:

- **Apta para entornos profesionales** (oficinas open-space, videollamadas, ambientes auditados).
- **Cero licensing**: no hay assets de audio que mantener.
- **Cero fricción de accesibilidad**: no requiere preferencia de mute, no choca con lectores de pantalla, no necesita gating por `prefers-reduced-motion` (las animaciones sutiles son seguras y de hecho ya hay precedente en la app con `animate-pulse` de Tailwind).
- **Consistente con la UX moderna** de herramientas empresariales (Linear, Notion, GitHub): modales con énfasis visual, sin sonido.

#### I.10.1 Comportamiento visual por severidad

| Severity | Color base | Refuerzo visual al abrir | Botón de confirmación |
|---|---|---|---|
| `info` | Azul (`blue-500`) | Borde azul fino, sin pulso | Estilo neutro/primary |
| `warning` | Ámbar (`amber-500`) | Borde ámbar grueso + pulso suave 2× (~600 ms) | Estilo amber |
| `critical` | Rojo (`red-600`) | Borde rojo grueso + pulso 3× (~900 ms) + leve shake del modal en la apertura | Estilo destructive (rojo lleno) |

La intensidad del refuerzo visual escala con la severidad, igual que se proponía para el sonido. Implementable con clases Tailwind + Framer Motion (ya en `package.json`) o `animate-pulse` nativo.

#### I.10.2 Mapeo a iconos `lucide-react` (ya en deps)

- `info` → `Info` (azul)
- `warning` → `AlertTriangle` (ámbar)
- `critical` → `AlertOctagon` (rojo)

El icono se renderiza grande (24-32 px) en la cabecera del diálogo, en el color correspondiente.

#### I.10.3 Accesibilidad

- **Color no es el único canal**: cada severidad tiene icono distinto + texto del título distinto. Cumple WCAG 1.4.1 (Use of Color).
- **Animación moderada**: el pulso/shake respeta `prefers-reduced-motion: reduce` — si el usuario lo tiene activo, se desactiva la animación pero se mantiene el color y el icono.
- **`aria-live="assertive"`** opcional en el contenido del diálogo para que lectores de pantalla anuncien el cambio inmediatamente al abrir.

#### I.10.4 Sonido: explícitamente fuera del alcance

La Opción A (sonido por severity) **no se implementa en este PR**. Queda documentada como posible mejora futura opt-in (toggle en preferencias del usuario, default mute), pero no está en el plan actual. Razón: el costo UX (entornos compartidos, fatiga auditiva, decisión de licensing) supera el beneficio para una herramienta empresarial donde el silencio es la norma.

Si en el futuro se reconsidera, el hook abstracto `useAlertFeedback(severity)` que se introduce en este PR se puede extender sin cambios en el resto del código (cero refactor downstream).

#### I.10.5 Cambios estructurales adicionales sobre I.5

- `nextjs_space/lib/alert-feedback.ts` (nuevo): exporta `getSeverityStyles(severity)` que devuelve `{ icon, colorClasses, animationClasses, ariaLabel }`. Una sola fuente de verdad.
- `completion-alert-dialog.tsx`: consume el helper, no decide estilos por sí mismo.
- Tests: snapshot por severidad + verificación de que `prefers-reduced-motion` desactiva la animación (con `vi.spyOn(window, 'matchMedia')`).

---

## Parte II — Feature 2: Tareas de decisión Sí/No con ramificación

### II.1 Caso de uso

Una tarea de tipo `decision` presenta una pregunta binaria al usuario. Según la respuesta:

- Un subconjunto de tareas dependientes se **activa** (flujo normal).
- Otro subconjunto se marca **omitida** (skipped): no aparece como pendiente, no cuenta para progreso, queda registrada para trazabilidad.

### II.2 Modelo conceptual: dos enfoques

Se consideraron tres modelos. Detallo solo el viable.

#### II.2.A Modelo rechazado: listas duales `onYes`/`onNo` con `activatesTasks`/`skipsTasks`

```yaml
# ❌ REDUNDANTE
decisionConfig:
  onYes:
    activatesTasks: [a, b]
    skipsTasks: [c, d]    # ← duplica información con onNo.activatesTasks
  onNo:
    activatesTasks: [c, d]
    skipsTasks: [a, b]
```

Rechazado: los cuatro arrays están correlacionados. Un cambio en uno exige cambios sincronizados en los otros tres. Alto riesgo de inconsistencia.

#### II.2.B Modelo rechazado: condiciones en `dependencies` de cada tarea

```yaml
# ❌ DESCENTRALIZADO
- id: "task-rollback"
  dependencies:
    - { taskId: "did-deploy-fail", whenAnswer: "yes" }
```

Rechazado: para entender qué ramas tiene una decisión, hay que grep-ear todas las tareas buscando `whenAnswer`. No es posible generar un diagrama BPMN sin reconstruir el grafo. La lectura del YAML se vuelve no-local.

#### II.2.C Modelo elegido: `branches` centralizado en la decisión

```yaml
- id: "task-did-deploy-fail"
  type: "decision"
  name: "¿El despliegue falló?"
  decisionConfig:
    question: "¿El despliegue presentó fallos críticos?"
    branches:
      yes: ["task-rollback-1", "task-rollback-2", "task-notify-team"]
      no:  ["task-smoke-tests-post", "task-close-ticket"]
    yesLabel: "Sí, hubo fallos"       # opcional (default: "Sí")
    noLabel: "No, todo correcto"      # opcional (default: "No")
```

**Invariantes verificables:**

1. `branches.yes` y `branches.no` son disjuntos (un id no puede estar en ambos) → *validado por parser*.
2. Todos los ids apuntan a tareas existentes en el proceso → *validado por parser*.
3. Las tareas referenciadas deben declarar dependencia inversa hacia esta decisión (opcional pero recomendado; ver II.5) → *validado por parser con warning si falta*.

**Información NO duplicada:** las tareas que no están en ninguna rama **no son afectadas** por esta decisión (podrían ser dependencias de otras cosas). El runtime nunca infiere "lo que no está listado se omite": solo omite lo explícitamente listado en la rama no-elegida.

### II.3 Dependencia inversa: cómo encaja en `dependencies[]`

Una tarea que pertenece a una rama de decisión **debe** tener la decisión como dependencia. Esto es doble-entry bookkeeping, pero es lo mínimo para que:

- El bloqueo visual funcione: hasta que se responda la decisión, las tareas dependientes están bloqueadas (ya lo hace `checkTaskDependencies`).
- El schema sea validable sin mirar el código.

Ejemplo:

```yaml
- id: "task-rollback-1"
  name: "Ejecutar rollback"
  dependencies: ["task-did-deploy-fail"]   # ← la decisión es pre-requisito
  # ... resto
```

El parser verificará la **consistencia** entre ambos lados:

- Cada id listado en `branches.yes/no` debe tener `dependencies` que incluya al id de la decisión.
- Esto NO es espagueti porque `dependencies` ya existe y tiene su propio propósito (bloqueo). Solo validamos coherencia.

### II.4 Máquina de estados de una tarea (ampliada)

Estados actuales: `{ pending | blocked | completed }` (con `isBlocked` como flag).

Estados propuestos tras Feature 2:

```text
                     ┌───── uncompleteTask ─────┐
                     │                          │
                     ▼                          │
   ┌─────────┐   answer "yes"   ┌──────────┐
   │ BLOCKED │ ──────────────>  │ PENDING  │ ───── complete ───> COMPLETED
   └─────────┘                  └──────────┘                          │
        ▲                            │                                │
        │                            └── decision.answer == "no" ────>│
        │                                │                            │
        │                                ▼                            │
        │                            ┌──────────┐                     │
        └─ dep no resuelta ───────── │ SKIPPED  │ <─────── cascade ───┘
                                     └──────────┘
```

Reglas:

- `SKIPPED` es un **estado persistido** (no derivado) — se guarda el `decisionAnswer` de la decisión que lo causó, para poder revertir si el usuario cambia su respuesta.
- Cambiar la respuesta requiere confirmación (sinergia con Feature 1).
- `SKIPPED` cuenta como "dependencia satisfecha" para tareas downstream: si una tarea depende de varias, al menos una skipped no bloquea.

### II.5 Reglas de cascada al responder

Al responder `yes`:

1. Para cada id en `branches.yes`: si estaba `skipped`, pasa a `pending` (o `blocked` si aún tiene otras deps).
2. Para cada id en `branches.no`: se marca `skipped`. Si estaba `completed` (el usuario ya había avanzado), ver II.6.
3. La decisión se marca `completed` con `decisionAnswer: 'yes'`.
4. **Cascada transitiva**: cualquier tarea cuya única dependencia era una tarea ahora `skipped`, se mantiene `pending` (no se skippea automáticamente — solo se skippea lo listado explícitamente).

**Principio anti-espagueti**: la cascada NO se extiende más allá de lo listado. El skip es explícito y local a la decisión. Si quieres que una cadena completa se omita, la declaras completa en la rama.

### II.6 Cambio de opinión (edge case crítico)

El usuario respondió `yes`, completó 2 tareas de la rama yes, luego quiere cambiar a `no`.

**Opciones evaluadas:**

| Estrategia | Pros | Contras | Elegida |
|---|---|---|---|
| A. Prohibir cambio si hay tareas completadas en la rama actual | Simplicidad absoluta | Usuario queda atrapado ante error honesto | No |
| B. Permitir, revertir completadas a pending, skippear | Flexible | Pérdida de trabajo (evidencia, formularios) | No |
| C. Permitir con AlertDialog que muestra explícitamente qué se perderá | Seguridad + flexibilidad | Más código UI | **Sí** |

El diálogo mostraría: *"Cambiar de Sí a No omitirá estas 2 tareas completadas: task-X, task-Y. Su evidencia se conservará pero las tareas pasarán a estado omitido. ¿Continuar?"*. Esto reutiliza exactamente la Feature 1 (alerta configurable) — sinergia explícita y deliberada.

La evidencia capturada se **preserva** en el estado de la tarea skipped (nunca se borra). Si el usuario vuelve a cambiar a `yes`, las tareas recuperan su estado completed con la evidencia intacta.

### II.7 Impacto en componentes existentes

| Componente | Cambio | Complejidad |
|---|---|---|
| `types.ts` | `type: 'decision'`, `DecisionConfig`, `decisionAnswer?`, `skipped: boolean` | S |
| `yaml-parser.ts` | Nueva rama del discriminador + validaciones cruzadas (disjuntos, refs, deps) | S |
| `store.ts` | `answerDecision(phaseId, taskId, answer)`, ajustar `uncompleteTask` para manejar cascada con skipped, recomputar `isBlocked` considerando skipped como satisfecho | M |
| `helpers.ts` | `checkTaskDependencies`: una dep `skipped` cuenta como satisfecha. `calculateProgress`: denominador = total - skipped | S |
| `task-card.tsx` | Render condicional: para `type: decision`, mostrar UI especial | S |
| `decision-task-card.tsx` | **Nuevo**: dos botones grandes con labels configurables, muestra respuesta actual, botón "Cambiar respuesta" con confirmación | M |
| `excel-generator.ts` | Para `ExportTaskSource kind: checklist`, nueva columna opcional `applies` (mapea a "N/A" si skipped). No se altera semántica existente | S |
| `word-generator.ts` | Las tareas skipped se renderizan con estilo tachado/gris y nota "Omitida por decisión: {nombre de la decisión}" | S |
| `bpmn-generator.ts` | Un nodo `bpmn:exclusiveGateway` representa la decisión. Dos flows salientes con `conditionExpression`. **Ya es estándar BPMN 2.0** — soporte nativo | M |
| `json-utils.ts` | Serializar/deserializar `skipped`, `decisionAnswer` | XS |
| `process.schema.json` | `$defs.DecisionConfig`, nueva rama en `Task.oneOf` con `type: const: decision` | S |
| `.vscode/...code-snippets` | Snippet `task-decision` | XS |
| `README.process.md` | Nueva sección | S |

### II.8 Casos edge adicionales

1. **Decisión anidada**: una tarea de rama es a su vez otra decisión. *Funciona sin cambios*: al skippear la decisión anidada, sus propias ramas quedan inactivas (pero no se propaga skip automático; requiere respuesta explícita si se vuelve a activar).
2. **Decisión dentro de una `activity`**: *funciona*. El store ya maneja scoping por `activityId`.
3. **Decisión con `evidence`**: permitida. La evidencia se captura antes/durante de responder. La respuesta marca la tarea completa.
4. **Proceso sin decisiones restaurado desde JSON viejo**: retro-compatible (`skipped` default `false`, `decisionAnswer` ausente).
5. **Decisión referenciada en `exportPlan.taskSources[]`**: el motor declarativo debe reconocer la respuesta y exportarla (nueva `kind: decision`). *Añadir en una iteración posterior*; no bloquea el diseño.

### II.9 Riesgos

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Cascada infinita si hay ciclos de dependencias | Media | Reutilizar `visited: Set<string>` de `getAllDependentTasks` |
| Tarea en ambas ramas (yes y no) | Alta | Validación del parser: disjuntos estrictos |
| Usuario olvida declarar `dependencies: [decision-id]` en tareas de rama | Media | Warning del parser (no error, el runtime funciona pero el bloqueo previo no) |
| BPMN mal generado | Baja | Tests visuales + fallback a nodo simple si falla generación |
| Pérdida de evidencia al cambiar respuesta | Alta | Decisión de diseño: evidencia SIEMPRE se preserva en estado skipped |

### II.10 Estimación

**M** — ~2-3 días. PR independiente, idealmente posterior a Feature 1.

---

## Parte III — Secuencia de implementación recomendada

1. **PR 1 — Feature 1 completa**. Bloque atómico: tipos, parser, schema, snippet, dialog component, integración en task-card, tests, docs. Entregar y validar en un proceso real.
2. **PR 2 — Feature 2 fase A**: tipos, parser, schema, store, helpers, UI básica. Sin exports.
3. **PR 3 — Feature 2 fase B**: adaptación de exports (Excel/Word/BPMN/JSON). Puede salir en el mismo PR que 2 si se mantiene pequeño.

Feature 1 es pre-requisito UX de Feature 2 (para el cambio de respuesta), pero no técnicamente. Sugerido: entregar en ese orden.

---

## Parte IV — Checklist de invariantes para el schema

Cosas que el schema JSON puede y debe validar (sin parser custom):

- [x] `completionAlert.severity` ∈ {info, warning, critical}
- [x] `completionAlert.description` requerido, min 1 char
- [x] `decisionConfig.branches.yes` y `.no` son arrays de strings no vacíos (al menos uno de los dos debe tener contenido)
- [x] Los ids de las ramas cumplen el patrón de `Identifier`
- [x] `decisionConfig.question` requerido, min 1 char

Cosas que requieren validación del parser (referencias cruzadas):

- [ ] Ids en `branches.yes`/`branches.no` existen en el proceso
- [ ] Ids en `branches.yes` y `branches.no` son disjuntos
- [ ] Cada id en ramas tiene al id de la decisión en su `dependencies` (warning, no error)
- [ ] No hay ciclos entre decisiones (futuro)

---

## Parte V — Preguntas abiertas para el autor

Antes de implementar, cerrar estas decisiones:

1. **Severidad default**: ¿`info` o `warning`? (propongo `info`).
2. **Cambio de respuesta**: ¿se permite siempre con confirmación, o solo si no hay tareas completadas en la rama actual? (propongo: siempre con confirmación).
3. **Labels default**: ¿"Sí"/"No" o "Yes"/"No" internacionalizados con `useI18n`? (propongo i18n).
4. **Progreso visible**: ¿mostrar "3/5 (2 omitidas)" o "3/5"? (propongo la primera para trazabilidad).
5. **Exportación de tareas skipped en Word/Excel**: ¿siempre se incluyen con marca "N/A" o solo si el autor lo configura? (propongo: siempre, con estilo diferenciado — la trazabilidad es un requisito auditivo en procesos DevSecOps).

---

## Conclusión

Ambas features son viables y de valor claro. Feature 1 es quirúrgica (1 PR, bajo riesgo). Feature 2 es profunda pero se puede mantener **no-espagueti** si:

- Usamos el modelo **C** (branches centralizado, invariantes validadas).
- Requerimos double-entry en `dependencies` (coherencia validada por parser, no duplicación conceptual).
- La cascada es explícita y local — nunca inferimos skip más allá de lo declarado.
- Los labels, severidad y textos de UI tienen defaults i18n para no inflar el YAML en casos simples.

El análisis concluye aquí. No se ha tocado código fuente. La decisión de seguir adelante con implementación queda abierta.
