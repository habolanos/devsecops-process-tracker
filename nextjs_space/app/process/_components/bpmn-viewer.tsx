'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Loader2, AlertCircle, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { ProcessState } from '@/lib/types';
import { generateBpmnXml, BpmnTaskMeta } from '@/lib/bpmn-generator';

// ============================================
// Task status color palette
// ============================================
const STATUS_COLORS = {
  completed: { fill: '#dcfce7', stroke: '#16a34a' },
  blocked:   { fill: '#f3f4f6', stroke: '#9ca3af' },
  selected:  { fill: '#dbeafe', stroke: '#2563eb' },
  pending:   { fill: '#fef9c3', stroke: '#d97706' },
} as const;

const BPMN_STATUS_CSS = `
  .bjs-container .task-completed .djs-visual > rect,
  .bjs-container .task-completed .djs-visual > polygon {
    fill: ${STATUS_COLORS.completed.fill} !important;
    stroke: ${STATUS_COLORS.completed.stroke} !important;
    stroke-width: 2px !important;
  }
  .bjs-container .task-blocked .djs-visual > rect,
  .bjs-container .task-blocked .djs-visual > polygon {
    fill: ${STATUS_COLORS.blocked.fill} !important;
    stroke: ${STATUS_COLORS.blocked.stroke} !important;
  }
  .bjs-container .task-selected .djs-visual > rect,
  .bjs-container .task-selected .djs-visual > polygon {
    fill: ${STATUS_COLORS.selected.fill} !important;
    stroke: ${STATUS_COLORS.selected.stroke} !important;
    stroke-width: 2.5px !important;
  }
  .bjs-container .task-pending .djs-visual > rect,
  .bjs-container .task-pending .djs-visual > polygon {
    fill: ${STATUS_COLORS.pending.fill} !important;
    stroke: ${STATUS_COLORS.pending.stroke} !important;
  }
  .bjs-container .djs-element:not(.djs-connection):not(.djs-label) {
    cursor: pointer;
  }
  .bjs-container .djs-element:not(.djs-connection):not(.djs-label):hover .djs-visual > rect,
  .bjs-container .djs-element:not(.djs-connection):not(.djs-label):hover .djs-visual > polygon {
    filter: brightness(0.95);
  }
  .bjs-powered-by { display: none !important; }
`;

// ============================================
// Types
// ============================================
export interface BpmnViewerProps {
  process: ProcessState;
  currentTaskId?: string | null;
  onTaskClick?: (taskId: string, phaseId: string, activityId?: string) => void;
}

// ============================================
// Component
// ============================================
export default function BpmnViewer({ process, currentTaskId, onTaskClick }: BpmnViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const viewerRef = useRef<any>(null);
  const taskMetaRef = useRef<BpmnTaskMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // -----------------------------------------------
  // Apply task status markers via canvas.addMarker
  // -----------------------------------------------
  const applyStatusColors = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (viewer: any, taskMeta: BpmnTaskMeta[]) => {
      try {
        const canvas = viewer.get('canvas');
        const elementRegistry = viewer.get('elementRegistry');
        const markers = ['task-completed', 'task-blocked', 'task-selected', 'task-pending'];

        for (const meta of taskMeta) {
          if (!elementRegistry.get(meta.bpmnElementId)) continue;

          // Remove all status markers first
          markers.forEach((m) => {
            try { canvas.removeMarker(meta.bpmnElementId, m); } catch { /* ignore */ }
          });

          // Find task state in process
          const phase = process.phases.find((p) => p.id === meta.phaseId);
          let task;
          if (meta.activityId) {
            const act = phase?.activities?.find((a) => a.id === meta.activityId);
            task = act?.tasks?.find((t) => t.id === meta.taskId);
          } else {
            task = phase?.tasks?.find((t) => t.id === meta.taskId);
          }

          if (!task) continue;

          if (meta.taskId === currentTaskId) {
            canvas.addMarker(meta.bpmnElementId, 'task-selected');
          } else if (task.completed) {
            canvas.addMarker(meta.bpmnElementId, 'task-completed');
          } else if (task.isBlocked) {
            canvas.addMarker(meta.bpmnElementId, 'task-blocked');
          } else {
            canvas.addMarker(meta.bpmnElementId, 'task-pending');
          }
        }
      } catch (e) {
        console.warn('[BpmnViewer] applyStatusColors error:', e);
      }
    },
    [process, currentTaskId]
  );

  // -----------------------------------------------
  // Initialize viewer (only when process.id changes)
  // -----------------------------------------------
  useEffect(() => {
    if (!containerRef.current) return;

    let isMounted = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let viewer: any = null;

    const init = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Inject CSS once
        if (!document.getElementById('bpmn-status-css')) {
          const style = document.createElement('style');
          style.id = 'bpmn-status-css';
          style.textContent = BPMN_STATUS_CSS;
          document.head.appendChild(style);
        }

        // Dynamic import — bpmn-js MUST run in browser only
        const { default: BpmnNavigatedViewer } = await import(
          /* webpackChunkName: "bpmn-js" */
          'bpmn-js/lib/NavigatedViewer'
        );

        if (!isMounted || !containerRef.current) return;

        // Generate BPMN XML from ProcessState
        const { xml, taskMeta } = generateBpmnXml(process);
        taskMetaRef.current = taskMeta;

        // Create viewer
        viewer = new BpmnNavigatedViewer({ container: containerRef.current });
        viewerRef.current = viewer;

        // Import diagram
        await viewer.importXML(xml);

        if (!isMounted) return;

        // Fit full diagram in viewport
        viewer.get('canvas').zoom('fit-viewport', 'auto');

        // Apply initial status colors
        applyStatusColors(viewer, taskMeta);

        // Click handler: task click → callback
        viewer.on('element.click', (event: { element: { id: string } }) => {
          const { element } = event;
          const meta = taskMetaRef.current.find((m) => m.bpmnElementId === element.id);
          if (meta && onTaskClick) {
            onTaskClick(meta.taskId, meta.phaseId, meta.activityId);
          }
        });

        setIsLoading(false);
      } catch (err) {
        if (isMounted) {
          console.error('[BpmnViewer] init error:', err);
          setError('No se pudo cargar el diagrama BPMN.');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted = false;
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch { /* ignore */ }
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [process.id]);

  // -----------------------------------------------
  // Reactive color updates (task state changes)
  // -----------------------------------------------
  useEffect(() => {
    if (viewerRef.current && !isLoading) {
      applyStatusColors(viewerRef.current, taskMetaRef.current);
    }
  }, [process, currentTaskId, applyStatusColors, isLoading]);

  // -----------------------------------------------
  // Zoom controls
  // -----------------------------------------------
  const handleZoom = (dir: 'in' | 'out' | 'fit') => {
    if (!viewerRef.current) return;
    const canvas = viewerRef.current.get('canvas');
    if (dir === 'fit') {
      canvas.zoom('fit-viewport', 'auto');
    } else {
      const current = canvas.zoom();
      canvas.zoom(dir === 'in' ? current * 1.25 : current / 1.25, 'auto');
    }
  };

  // -----------------------------------------------
  // Legend
  // -----------------------------------------------
  const legend = [
    { label: 'Completada',  color: STATUS_COLORS.completed.fill,  border: STATUS_COLORS.completed.stroke },
    { label: 'En curso',    color: STATUS_COLORS.selected.fill,   border: STATUS_COLORS.selected.stroke },
    { label: 'Pendiente',   color: STATUS_COLORS.pending.fill,    border: STATUS_COLORS.pending.stroke },
    { label: 'Bloqueada',   color: STATUS_COLORS.blocked.fill,    border: STATUS_COLORS.blocked.stroke },
  ];

  return (
    <div className="relative flex flex-col w-full h-full" style={{ minHeight: 520 }}>

      {/* ── Loading overlay ── */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-20 rounded-lg">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="text-sm font-medium">Generando diagrama BPMN…</span>
          </div>
        </div>
      )}

      {/* ── Error overlay ── */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/30 px-5 py-3 rounded-xl shadow">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* ── Toolbar ── */}
      {!isLoading && !error && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-background/90 border border-border rounded-lg shadow-sm px-1 py-1">
          <button
            onClick={() => handleZoom('in')}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom('out')}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-border mx-0.5" />
          <button
            onClick={() => handleZoom('fit')}
            title="Ajustar diagrama"
            className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Diagram container ── */}
      <div
        ref={containerRef}
        className="flex-1 w-full rounded-lg border border-border overflow-hidden bg-white dark:bg-neutral-50"
        style={{ minHeight: 460 }}
        data-testid="bpmn-diagram-container"
      />

      {/* ── Legend ── */}
      {!isLoading && !error && (
        <div className="flex items-center gap-4 pt-3 px-1 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Estado:</span>
          {legend.map((item) => (
            <div key={item.label} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3.5 h-3.5 rounded-sm border"
                style={{ background: item.color, borderColor: item.border }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
          <span className="text-xs text-muted-foreground ml-auto italic">
            Haz clic en una tarea para ejecutarla
          </span>
        </div>
      )}
    </div>
  );
}
