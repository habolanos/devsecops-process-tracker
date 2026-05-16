'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

// ============================================================
// Blank BPMN template for new processes
// ============================================================
export const BLANK_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Nuevo Proceso" processRef="Process_1"/>
  </bpmn:collaboration>
  <bpmn:process id="Process_1" name="Nuevo Proceso" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Fase1" name="Fase 1">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio"/>
    <bpmn:userTask id="Task_1" name="Tarea 1"/>
    <bpmn:endEvent id="EndEvent_1" name="Fin"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1"/>
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="620" height="160"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Fase1_di" bpmnElement="Lane_Fase1" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="590" height="160"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="232" y="142" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="330" y="120" width="120" height="80"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="512" y="142" width="36" height="36"/>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="268" y="160"/>
        <di:waypoint x="330" y="160"/>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="450" y="160"/>
        <di:waypoint x="512" y="160"/>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

// ============================================================
// Imperative handle exposed to parent
// ============================================================
export interface BpmnModelerHandle {
  getXml: () => Promise<string>;
  getSvg: () => Promise<string>;
  loadXml: (xml: string) => Promise<void>;
  fitViewport: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

// ============================================================
// Props
// ============================================================
export interface BpmnModelerProps {
  initialXml?: string;
  onChange?: (xml: string) => void;
  readOnly?: boolean;
}

// ============================================================
// Component
// ============================================================
const BpmnModeler = forwardRef<BpmnModelerHandle, BpmnModelerProps>(
  ({ initialXml = BLANK_BPMN, onChange, readOnly = false }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelerRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    // ── Expose imperative API ──────────────────────────────
    useImperativeHandle(ref, () => ({
      getXml: async () => {
        if (!modelerRef.current) return '';
        const { xml } = await modelerRef.current.saveXML({ format: true });
        return xml ?? '';
      },
      getSvg: async () => {
        if (!modelerRef.current) return '';
        const { svg } = await modelerRef.current.saveSVG();
        return svg ?? '';
      },
      loadXml: async (xml: string) => {
        if (!modelerRef.current) return;
        await modelerRef.current.importXML(xml);
        modelerRef.current.get('canvas').zoom('fit-viewport', 'auto');
      },
      fitViewport: () => {
        modelerRef.current?.get('canvas')?.zoom('fit-viewport', 'auto');
      },
      zoomIn: () => {
        const canvas = modelerRef.current?.get('canvas');
        if (canvas) canvas.zoom(canvas.zoom() * 1.25, 'auto');
      },
      zoomOut: () => {
        const canvas = modelerRef.current?.get('canvas');
        if (canvas) canvas.zoom(canvas.zoom() / 1.25, 'auto');
      },
    }));

    // ── Initialize modeler ─────────────────────────────────
    useEffect(() => {
      if (!containerRef.current) return;
      let isMounted = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let modeler: any = null;

      const init = async () => {
        try {
          setIsLoading(true);
          setError(null);

          // Inject bpmn-js CSS once
          if (!document.getElementById('bpmn-modeler-css')) {
            const link = document.createElement('link');
            link.id = 'bpmn-modeler-css';
            link.rel = 'stylesheet';
            link.href = '/bpmn-js.css';
            document.head.appendChild(link);

            // Inline fallback styles for the modeler UI
            const style = document.createElement('style');
            style.id = 'bpmn-modeler-inline';
            style.textContent = `
              .bjs-powered-by { display: none !important; }
              .djs-palette { border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
              .djs-context-pad { border-radius: 6px; }
              .bpmn-icon-start-event-none:before { content: "\\e800"; }
            `;
            document.head.appendChild(style);
          }

          // Dynamic import — no SSR
          const BpmnJsModelerModule = await import(
            /* webpackChunkName: "bpmn-modeler" */
            'bpmn-js/lib/Modeler'
          );
          const BpmnJsModeler = BpmnJsModelerModule.default;

          // Also import CSS from bpmn-js dist
          await import(
            /* webpackChunkName: "bpmn-js-css" */
            'bpmn-js/dist/assets/bpmn-js.css' as string
          ).catch(() => {
            // CSS import may fail in some bundler setups — not critical
          });

          if (!isMounted || !containerRef.current) return;

          modeler = new BpmnJsModeler({
            container: containerRef.current,
            keyboard: { bindTo: document },
          });
          modelerRef.current = modeler;

          // Load initial XML
          await modeler.importXML(initialXml);
          if (!isMounted) return;

          modeler.get('canvas').zoom('fit-viewport', 'auto');

          // Subscribe to changes → notify parent
          modeler.on('commandStack.changed', async () => {
            if (!isMounted || !onChangeRef.current) return;
            try {
              const { xml } = await modeler.saveXML({ format: true });
              if (xml) onChangeRef.current(xml);
            } catch {
              // ignore transient save errors
            }
          });

          setIsLoading(false);
        } catch (err) {
          if (isMounted) {
            console.error('[BpmnModeler] init error:', err);
            setError('No se pudo inicializar el editor BPMN.');
            setIsLoading(false);
          }
        }
      };

      init();

      return () => {
        isMounted = false;
        if (modelerRef.current) {
          try { modelerRef.current.destroy(); } catch { /* ignore */ }
          modelerRef.current = null;
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div className="relative w-full h-full flex flex-col">
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 z-20 rounded-lg">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <span className="text-sm font-medium">Iniciando editor BPMN…</span>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="flex items-center gap-2 text-destructive bg-destructive/10 border border-destructive/30 px-5 py-3 rounded-xl shadow">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Modeler container */}
        <div
          ref={containerRef}
          className="flex-1 w-full rounded-lg border border-border bg-white"
          data-testid="bpmn-modeler-container"
          data-readonly={readOnly}
        />
      </div>
    );
  }
);

BpmnModeler.displayName = 'BpmnModeler';
export default BpmnModeler;
