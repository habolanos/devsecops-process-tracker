# BPMN 2.0 Interactive Diagram Visualization

**DevSecOps Process Tracker · Feature introducida en v2.0.0 y mantenida en líneas posteriores (v2.1.0+).**

> Documentación complementaria: [`README.md`](README.md) · [`README.process.md`](README.process.md) · [`docs/diagrams/c4-model.md`](docs/diagrams/c4-model.md) · [`docs/diagrams/arquitectura-sistema.md`](docs/diagrams/arquitectura-sistema.md).

---

## 📋 Índice

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Arquitectura de la Solución](#arquitectura-de-la-solución)
- [Generador BPMN](#generador-bpmn)
  - [Estructura de Datos](#estructura-de-datos)
  - [Algoritmo de Layout](#algoritmo-de-layout)
  - [Mapeo de Tipos de Tareas](#mapeo-de-tipos-de-tareas)
  - [API de Exportación](#api-de-exportación)
- [Visor BPMN Interactivo](#visor-bpmn-interactivo)
  - [Características](#características)
  - [Estados Visuales](#estados-visuales)
  - [Eventos de Interacción](#eventos-de-interacción)
- [Integración en la UI](#integración-en-la-ui)
- [Consideraciones Técnicas](#consideraciones-técnicas)
  - [SSR (Server-Side Rendering)](#ssr-server-side-rendering)
  - [Bundle Size Optimization](#bundle-size-optimization)
  - [Memory Management](#memory-management)
- [Testing](#testing)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)
- [Changelog BPMN](#changelog-bpmn)

---

## Resumen Ejecutivo

Desde la versión 2.0.0, **DevSecOps Process Tracker** ofrece una **visualización interactiva de diagramas BPMN 2.0** que permite a los usuarios:

1. **Visualizar el flujo completo del proceso** en un diagrama BPMN estándar
2. **Identificar el estado de cada tarea** mediante código de colores
3. **Navegar directamente a tareas** haciendo clic en el diagrama
4. **Alternar entre vistas** de lista tradicional y diagrama BPMN

Esta funcionalidad transforma la experiencia de usuario al proporcionar una **representación visual profesional** de los procesos DevSecOps, facilitando la comprensión del flujo de trabajo y el seguimiento del progreso.

---

## Arquitectura de la Solución

```
┌─────────────────────────────────────────────────────────────┐
│                    ProcessState (Zustand)                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Phase 1   │  │   Phase 2   │  │       Phase N       │  │
│  │ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────────────┐ │  │
│  │ │ Task A  │ │  │ │ Task C  │ │  │ │   Activity X    │ │  │
│  │ │ Task B  │ │  │ │ Task D  │ │  │ │  ┌───────────┐  │ │  │
│  │ └─────────┘ │  │ └─────────┘ │  │ │  │ Task Y    │  │ │  │
│  └─────────────┘  └─────────────┘  │ │  │ Task Z    │  │ │  │
│                                    │ │  └───────────┘  │ │  │
│                                    │ └─────────────────┘ │  │
└────────────────────────────────────┴──────────────────────┴──┘
                           │
                           ▼
              ┌─────────────────────┐
              │  bpmn-generator.ts  │
              │  (Pure Function)    │
              └─────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │   BPMN 2.0 XML      │
              │  (Collaboration +     │
              │   Pool + Lanes +     │
              │   Flow Elements)     │
              └─────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │   bpmn-viewer.tsx   │
              │  (React Component)   │
              │  • Lazy load        │
              │  • Status colors    │
              │  • Click handlers   │
              └─────────────────────┘
                           │
                           ▼
              ┌─────────────────────┐
              │    bpmn-js lib      │
              │  (Browser only)      │
              │  • SVG rendering     │
              │  • Zoom/pan          │
              └─────────────────────┘
```

---

## Generador BPMN

### Ubicación
```
nextjs_space/lib/bpmn-generator.ts
```

### Estructura de Datos

El generador convierte el `ProcessState` existente en un diagrama BPMN 2.0 completo con la siguiente estructura:

| Elemento BPMN | Mapeo desde ProcessState |
|---------------|-------------------------|
| **Collaboration** | Proceso completo |
| **Participant (Pool)** | Proceso con lanes por fase |
| **Lane** | Cada `PhaseState` |
| **Start Event** | Inicio de cada fase |
| **End Event** | Fin de cada fase |
| **User Task** | Tareas `standard`, `dynamic-list`, `detail-list`, `form` |
| **Manual Task** | Tareas `check`, `multicheck` |
| **Service Task** | Tareas `export-excel` |
| **Sequence Flow** | Flujo secuencial de tareas |

### Algoritmo de Layout

El generador implementa un **algoritmo de layout manual optimizado** que calcula coordenadas exactas para todos los elementos:

```typescript
// Constantes de layout (pixeles)
const L = {
  POOL_X: 160,           // Posición X inicial del pool
  POOL_Y: 80,            // Posición Y inicial del pool
  PARTICIPANT_BAND: 30,  // Ancho de la banda del participante
  LANE_BAND: 30,         // Ancho de la banda de cada lane
  H_PAD: 20,             // Padding horizontal interno
  V_PAD: 25,             // Padding vertical interno
  EVENT_W: 36,           // Ancho de eventos (círculos)
  EVENT_H: 36,           // Alto de eventos
  TASK_W: 120,           // Ancho de tareas (rectángulos)
  TASK_H: 80,            // Alto de tareas
  H_GAP: 50,             // Espacio horizontal entre elementos
  R_PAD: 40,             // Padding derecho
};

// Fórmula de ancho del pool
poolWidth = PARTICIPANT_BAND + LANE_BAND + H_PAD + EVENT_W + H_GAP + 
            (tasks × (TASK_W + H_GAP)) + EVENT_W + R_PAD;

// Altura del lane
laneHeight = TASK_H + 2 × V_PAD;
```

**Ventajas del layout manual:**
- ✅ No requiere librería de layout externa (evita ~500KB adicionales)
- ✅ Layout predecible y consistente
- ✅ Generación síncrona y rápida (< 5ms)
- ✅ Sin dependencias de browser (puede ejecutarse en SSR si fuera necesario)

### Mapeo de Tipos de Tareas

| Tipo de Tarea | Elemento BPMN | Semántica |
|--------------|---------------|-----------|
| `standard` | `userTask` | Tarea ejecutada por usuario |
| `dynamic-list` | `userTask` | Captura de lista de items |
| `detail-list` | `userTask` | Captura de detalles por item |
| `form` | `userTask` | Formulario con múltiples campos |
| `check` | `manualTask` | Verificación manual |
| `multicheck` | `manualTask` | Múltiples items de verificación |
| `export-excel` | `serviceTask` | Operación automática de exportación |

### API de Exportación

```typescript
// Generar XML BPMN desde ProcessState
import { generateBpmnXml, BpmnGeneratorResult } from '@/lib/bpmn-generator';

const result: BpmnGeneratorResult = generateBpmnXml(processState);
// result.xml: string - XML BPMN 2.0 válido
// result.taskMeta: BpmnTaskMeta[] - Metadatos para mapeo de IDs

interface BpmnTaskMeta {
  taskId: string;        // ID original de la tarea
  phaseId: string;       // ID de la fase padre
  activityId?: string;   // ID de la actividad (si aplica)
  bpmnElementId: string; // ID en el diagrama BPMN (ej: "Task_task_a")
}
```

---

## Visor BPMN Interactivo

### Ubicación
```
nextjs_space/app/process/_components/bpmn-viewer.tsx
```

### Características

#### 1. Carga Lazy Optimizada
```typescript
// En page.tsx
const BpmnViewer = dynamic(() => import('./_components/bpmn-viewer'), { 
  ssr: false  // ⚠️ Obligatorio: bpmn-js requiere APIs del browser
});
```

#### 2. Colores de Estado

| Estado | Color Fill | Color Stroke | CSS Class |
|--------|-----------|--------------|-----------|
| **Completada** | 🟢 `#dcfce7` (verde claro) | `#16a34a` (verde) | `task-completed` |
| **En curso/Seleccionada** | 🔵 `#dbeafe` (azul claro) | `#2563eb` (azul) | `task-selected` |
| **Pendiente** | 🟡 `#fef9c3` (amarillo claro) | `#d97706` (ámbar) | `task-pending` |
| **Bloqueada** | ⬜ `#f3f4f6` (gris claro) | `#9ca3af` (gris) | `task-blocked` |

Los colores se aplican dinámicamente mediante **CSS markers** de bpmn-js:
```typescript
canvas.addMarker(elementId, 'task-completed');
```

#### 3. Toolbar de Zoom

| Botón | Acción | Atajo |
|-------|--------|-------|
| 🔍+ | Zoom in | - |
| 🔍- | Zoom out | - |
| ⛶ | Fit viewport | - |

#### 4. Leyenda de Estados

Visualización permanente en la parte inferior del visor con indicadores de color y texto descriptivo.

### Eventos de Interacción

#### Click en Tarea
```typescript
// Flujo de interacción
1. Usuario hace clic en elemento BPMN
2. Se busca el metadato correspondiente (taskMeta)
3. Se invoca onTaskClick(taskId, phaseId, activityId?)
4. El handler en page.tsx:
   - Actualiza currentPhase
   - Actualiza currentTask
   - Cambia viewMode a 'list'
   - Muestra toast de confirmación
```

---

## Integración en la UI

### Toggle Lista/BPMN

```
┌──────────────────────────────────────────────────────────────┐
│ [Lista] [BPMN]  ← Toggle en header del proceso               │
└──────────────────────────────────────────────────────────────┘
```

Implementación en `page.tsx`:
```typescript
const [viewMode, setViewMode] = useState<'list' | 'bpmn'>('list');

// Toggle UI
<div className="flex items-center border border-border rounded-lg overflow-hidden">
  <button onClick={() => setViewMode('list')} className={...}>
    <List className="w-4 h-4" />
    <span>Lista</span>
  </button>
  <button onClick={() => setViewMode('bpmn')} className={...}>
    <Workflow className="w-4 h-4" />
    <span>BPMN</span>
  </button>
</div>
```

### Vista BPMN

```
┌──────────────────────────────────────────────────────────────┐
│ Diagrama del Proceso                                    [+] [-] ⛶│
│ Haz clic en cualquier tarea para ir directamente a ella       │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Pool: Release Checklist                             │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Lane: Preparation                               │ │   │
│  │ │  ○ → [Task A] → [Task B] → ◉                   │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  │ ┌─────────────────────────────────────────────────┐ │   │
│  │ │ Lane: Validation                                │ │   │
│  │ │  ○ → [Task C] → [Task D] → [Task E] → ◉        │ │   │
│  │ └─────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                               │
├──────────────────────────────────────────────────────────────┤
│ Estado:  ● Completada  ● En curso  ● Pendiente  ● Bloqueada │
│                Haz clic en una tarea para ejecutarla         │
└──────────────────────────────────────────────────────────────┘
```

---

## Consideraciones Técnicas

### SSR (Server-Side Rendering)

**⚠️ CRITICAL:** `bpmn-js` **NO funciona en servidor** porque requiere:
- `Canvas` API
- `window` / `document` objects
- SVG rendering en DOM real

**Solución implementada:**
```typescript
// next/dynamic con ssr: false
const BpmnViewer = dynamic(() => import('./_components/bpmn-viewer'), { 
  ssr: false 
});
```

**Impacto:**
- El componente solo se carga en el browser
- No hay errores de hidratación
- El bundle de bpmn-js se descarga lazy (código-splitted)

### Bundle Size Optimization

| Librería | Tamaño (gzipped) | Estrategia |
|----------|------------------|------------|
| `bpmn-js` | ~400KB | Dynamic import + webpack chunk |
| `bpmn-moddle` | ~50KB | Incluido en bpmn-js |
| **Total** | ~450KB | Carga solo cuando se abre vista BPMN |

**Optimizaciones aplicadas:**
1. **Code splitting**: El chunk `bpmn-js` se carga bajo demanda
2. **Suspense**: UI de loading mientras se descarga el bundle
3. **CSS inline**: Estilos de estado embebidos en el componente

### Memory Management

```typescript
// Cleanup en useEffect
effect(() => {
  // ... init viewer
  return () => {
    if (viewerRef.current) {
      viewerRef.current.destroy();  // ⚠️ Liberar recursos
      viewerRef.current = null;
    }
  };
}, [process.id]);
```

**Prevención de memory leaks:**
- Destrucción explícita del viewer al desmontar
- Unmount solo cuando cambia `process.id` (no en cada render)

---

## Testing

### Tests Unitarios

**Archivo:** `__tests__/unit/lib/bpmn-generator.test.ts`

| Suite | Tests | Cobertura |
|-------|-------|-----------|
| `sanitizeId` | 2 | Reemplazo de caracteres inválidos |
| `escapeXml` | 5 | Escape de entidades XML |
| `getBpmnTaskType` | 7 | Mapeo de tipos de tareas |
| `generateBpmnXml` | 25 | Generación completa de XML |

**Casos de prueba clave:**
- ✅ Estructura XML válida con namespaces BPMN
- ✅ Pool con lanes por fase
- ✅ Conexiones entre fases (End_P1 → Start_P2)
- ✅ Tasks dentro de activities (flattening)
- ✅ Escapado de caracteres especiales en nombres
- ✅ Ordenamiento de tareas por propiedad `order`

```bash
# Ejecutar tests BPMN
npm run test:run -- __tests__/unit/lib/bpmn-generator.test.ts

# Resultado esperado
Test Files  1 passed (1)
     Tests  39 passed (39)
```

---

## API Reference

### Funciones Exportadas

#### `generateBpmnXml(process: ProcessState): BpmnGeneratorResult`

Genera XML BPMN 2.0 desde el estado del proceso.

**Parámetros:**
- `process`: `ProcessState` completo con phases, activities, tasks

**Retorno:**
```typescript
{
  xml: string;           // XML BPMN 2.0 válido
  taskMeta: Array<{
    taskId: string;
    phaseId: string;
    activityId?: string;
    bpmnElementId: string;
  }>;
}
```

#### `sanitizeId(id: string): string`

Convierte cualquier string en un ID BPMN válido (reemplaza caracteres no alfanuméricos por `_`).

#### `escapeXml(str: string): string`

Escapa caracteres especiales XML: `& < > " '`

#### `getBpmnTaskType(type: TaskState['type']): string`

Retorna el tipo de elemento BPMN correspondiente:
- `standard` | `dynamic-list` | `detail-list` | `form` → `userTask`
- `check` | `multicheck` → `manualTask`
- `export-excel` → `serviceTask`

### Props de BpmnViewer

```typescript
interface BpmnViewerProps {
  process: ProcessState;              // Estado del proceso a visualizar
  currentTaskId?: string | null;     // ID de tarea actualmente seleccionada
  onTaskClick?: (taskId: string, phaseId: string, activityId?: string) => void;
}
```

---

## Troubleshooting

### El diagrama no se carga (pantalla en blanco)

**Causa probable:** Error en la importación dinámica de bpmn-js

**Solución:**
1. Verificar que `bpmn-js` está instalado:
   ```bash
   npm list bpmn-js
   ```
2. Limpiar caché de Next.js:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Error "window is not defined" en build

**Causa:** Intentando renderizar bpmn-js en SSR

**Solución:** Asegurar `ssr: false` en el dynamic import:
```typescript
const BpmnViewer = dynamic(() => import('./_components/bpmn-viewer'), { 
  ssr: false  // ← Obligatorio
});
```

### Las tareas no muestran colores de estado

**Verificar:**
1. El proceso tiene tareas con propiedades `completed` e `isBlocked`
2. Los CSS markers están aplicados (verificar en DevTools → Elements)
3. No hay errores de consola relacionados a `canvas.addMarker`

### Click en tarea no navega a la lista

**Verificar:**
1. El handler `onTaskClick` está pasado al componente:
   ```tsx
   <BpmnViewer process={process} onTaskClick={handleBpmnTaskClick} />
   ```
2. `taskMeta` contiene el mapeo correcto de IDs

---

## Changelog BPMN

| Versión | Fecha | Cambios |
|---------|-------|---------|
| Unreleased | 2026-04-21 | Actualización documental: referencias cruzadas al modelo C4, sincronización con arquitectura actual (5 stores Zustand, 28 módulos `lib/`) y estado global de 529+ tests unitarios. El generador BPMN y el visor no cambian. |
| 2.1.0 | 2026-04-19 | Integración transversal con el motor declarativo de export Excel (`process.export`): las tareas `export-excel` se siguen mapeando como `serviceTask` en el diagrama. |
| 2.0.0 | 2026-04-08 | **Implementación inicial completa**: generador XML BPMN, visor interactivo con `bpmn-js` 18, toggle Lista/BPMN, 39 tests unitarios (`__tests__/unit/lib/bpmn-generator.test.ts`). |

---

## Referencias

- [BPMN 2.0 Specification](https://www.omg.org/spec/BPMN/2.0/)
- [bpmn-js Documentation](https://bpmn.io/toolkit/bpmn-js/)
- [bpmn-js GitHub](https://github.com/bpmn-io/bpmn-js)

---

**Documentación alineada con DevSecOps Process Tracker v2.1.0+ (rama `develop`).**

Última actualización: 2026-04-21
