'use client';

import { useRef, useState, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import * as jsYaml from 'js-yaml';
import { toast } from 'sonner';
import { parseYAMLToProcess } from '@/lib/yaml-parser';
import { generateBpmnXml } from '@/lib/bpmn-generator';
import { bpmnToYaml, validateYamlString } from '@/lib/bpmn-to-yaml';
import StudioToolbar from './_components/studio-toolbar';

// Lazy load heavy components
const BpmnModeler = dynamic(() => import('./_components/bpmn-modeler'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-muted-foreground bg-white rounded-lg border border-border">
      <span className="text-sm">Cargando editor…</span>
    </div>
  ),
});

const YamlPreview = dynamic(() => import('./_components/yaml-preview'), {
  ssr: false,
});

const ImportXmlModal = dynamic(() => import('./_components/import-xml-modal'), { ssr: false });
const CatalogModal = dynamic(() => import('./_components/catalog-modal'), { ssr: false });

import type { BpmnModelerHandle, } from './_components/bpmn-modeler';
import { BLANK_BPMN } from './_components/bpmn-modeler';

// ============================================================
export default function StudioPage() {
  const router = useRouter();
  const modelerRef = useRef<BpmnModelerHandle>(null);

  const [yaml, setYaml] = useState<string>(() => {
    try { return bpmnToYaml(BLANK_BPMN); } catch { return ''; }
  });
  const [yamlUpdating, setYamlUpdating] = useState(false);
  const [processName, setProcessName] = useState<string | undefined>('Nuevo Proceso');
  const [showImport, setShowImport] = useState(false);
  const [showCatalog, setShowCatalog] = useState(false);

  // ── Derive validation from yaml ───────────────────────────
  const yamlValid = yaml ? validateYamlString(yaml).valid : false;

  // ── Convert current XML to YAML (debounced) ───────────────
  const updateYamlFromXml = useCallback((xml: string) => {
    setYamlUpdating(true);
    try {
      const generatedYaml = bpmnToYaml(xml);
      setYaml(generatedYaml);

      // Extract process name for toolbar
      try {
        const parsed = jsYaml.load(generatedYaml) as Record<string, unknown>;
        const name = (parsed?.['process'] as Record<string, unknown>)?.['name'] as string | undefined;
        if (name) setProcessName(name);
      } catch { /* ignore */ }
    } catch (e) {
      console.warn('[Studio] bpmnToYaml error:', e);
    } finally {
      setYamlUpdating(false);
    }
  }, []);

  // ── Handlers ──────────────────────────────────────────────
  const handleNew = useCallback(async () => {
    await modelerRef.current?.loadXml(BLANK_BPMN);
    updateYamlFromXml(BLANK_BPMN);
    setProcessName(undefined);
    toast.success('Nuevo proceso creado');
  }, [updateYamlFromXml]);

  const handleImportXml = useCallback(async (xml: string) => {
    try {
      await modelerRef.current?.loadXml(xml);
      updateYamlFromXml(xml);
      setShowImport(false);
      toast.success('Diagrama BPMN importado');
    } catch (e) {
      toast.error('Error al importar el BPMN: ' + (e as Error).message);
    }
  }, [updateYamlFromXml]);

  const handleLoadFromCatalog = useCallback(
    async (yamlText: string, name: string) => {
      try {
        const processState = parseYAMLToProcess(yamlText);
        const { xml } = generateBpmnXml(processState);
        await modelerRef.current?.loadXml(xml);
        setYaml(yamlText);
        setProcessName(name);
        setShowCatalog(false);
        toast.success(`"${name}" cargado en el editor`);
      } catch (e) {
        toast.error('Error al cargar el proceso: ' + (e as Error).message);
      }
    },
    []
  );

  const handleExportXml = useCallback(async () => {
    try {
      const xml = await modelerRef.current?.getXml();
      if (!xml) return;
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(processName ?? 'process').replace(/\s+/g, '-').toLowerCase()}.bpmn`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('BPMN XML descargado');
    } catch (e) {
      toast.error('Error al exportar XML: ' + (e as Error).message);
    }
  }, [processName]);

  const handleExportYaml = useCallback(() => {
    if (!yaml) return;
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(processName ?? 'process').replace(/\s+/g, '-').toLowerCase()}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('YAML descargado');
  }, [yaml, processName]);

  const handleModelerChange = useCallback(
    (xml: string) => {
      updateYamlFromXml(xml);
    },
    [updateYamlFromXml]
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Toolbar */}
      <StudioToolbar
        onNew={handleNew}
        onImportXml={() => setShowImport(true)}
        onLoadCatalog={() => setShowCatalog(true)}
        onExportXml={handleExportXml}
        onExportYaml={handleExportYaml}
        onZoomIn={() => modelerRef.current?.zoomIn()}
        onZoomOut={() => modelerRef.current?.zoomOut()}
        onFit={() => modelerRef.current?.fitViewport()}
        onBack={() => router.push('/')}
        processName={processName}
        yamlValid={yamlValid}
      />

      {/* Main split panel */}
      <div className="flex-1 overflow-hidden p-3">
        <PanelGroup direction="horizontal" className="h-full gap-2">
          {/* Left: BPMN Modeler */}
          <Panel defaultSize={68} minSize={35} className="flex flex-col">
            <Suspense fallback={
              <div className="flex-1 flex items-center justify-center bg-white rounded-lg border border-border text-muted-foreground text-sm">
                Cargando editor…
              </div>
            }>
              <BpmnModeler
                ref={modelerRef}
                initialXml={BLANK_BPMN}
                onChange={handleModelerChange}
              />
            </Suspense>
          </Panel>

          {/* Resize handle */}
          <PanelResizeHandle className="w-1.5 hover:w-2 bg-border hover:bg-blue-400 rounded-full transition-all cursor-col-resize flex-shrink-0" />

          {/* Right: YAML Preview */}
          <Panel defaultSize={32} minSize={20} className="flex flex-col">
            <Suspense fallback={<div className="flex-1 bg-slate-950 rounded-lg" />}>
              <YamlPreview yaml={yaml} isUpdating={yamlUpdating} />
            </Suspense>
          </Panel>
        </PanelGroup>
      </div>

      {/* Modals */}
      {showImport && (
        <Suspense fallback={null}>
          <ImportXmlModal onImport={handleImportXml} onClose={() => setShowImport(false)} />
        </Suspense>
      )}

      {showCatalog && (
        <Suspense fallback={null}>
          <CatalogModal onSelect={handleLoadFromCatalog} onClose={() => setShowCatalog(false)} />
        </Suspense>
      )}
    </div>
  );
}
