'use client';

import {
  FilePlus2,
  Upload,
  Download,
  FileCode2,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowLeft,
  FileText,
  Play,
  Square,
} from 'lucide-react';

interface StudioToolbarProps {
  onNew: () => void;
  onImportXml: () => void;
  onLoadCatalog: () => void;
  onExportXml: () => void;
  onExportYaml: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onBack: () => void;
  onSimulate: () => void;
  simulating?: boolean;
  processName?: string;
  yamlValid?: boolean;
}

export default function StudioToolbar({
  onNew,
  onImportXml,
  onLoadCatalog,
  onExportXml,
  onExportYaml,
  onZoomIn,
  onZoomOut,
  onFit,
  onBack,
  onSimulate,
  simulating = false,
  processName,
  yamlValid,
}: StudioToolbarProps) {
  return (
    <header className="flex-shrink-0 bg-background border-b border-border shadow-sm z-30">
      <div className="px-4 py-2.5 flex items-center gap-2 flex-wrap">
        {/* Back */}
        <button
          onClick={onBack}
          title="Volver al inicio"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Inicio</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Brand */}
        <div className="flex items-center gap-2 mr-2">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden md:block">
            BPMN Studio
          </span>
          {processName && (
            <span className="text-xs text-muted-foreground truncate max-w-[160px] hidden lg:block">
              — {processName}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Process actions */}
        <div className="flex items-center gap-1">
          <ToolButton icon={<FilePlus2 className="w-4 h-4" />} label="Nuevo proceso" onClick={onNew} />
          <ToolButton icon={<Upload className="w-4 h-4" />} label="Importar BPMN XML" onClick={onImportXml} />
          <ToolButton icon={<Layers className="w-4 h-4" />} label="Cargar del catálogo" onClick={onLoadCatalog} />
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Export actions */}
        <div className="flex items-center gap-1">
          <ToolButton
            icon={<FileCode2 className="w-4 h-4" />}
            label="Exportar BPMN XML"
            onClick={onExportXml}
          />
          <button
            onClick={onExportYaml}
            disabled={!yamlValid}
            title={yamlValid ? 'Exportar YAML del proceso' : 'El YAML no es válido aún'}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              yamlValid
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-secondary text-muted-foreground opacity-50 cursor-not-allowed'
            }`}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar YAML</span>
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Simulate */}
        <button
          onClick={onSimulate}
          title={simulating ? 'Detener simulación' : 'Simular proceso (token simulation)'}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            simulating
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : 'bg-violet-600 text-white hover:bg-violet-700'
          }`}
        >
          {simulating ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span className="hidden sm:inline">{simulating ? 'Detener' : 'Simular'}</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5 border border-border rounded-lg overflow-hidden">
          <button
            onClick={onZoomIn}
            title="Zoom In"
            className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomOut}
            title="Zoom Out"
            className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground border-x border-border"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onFit}
            title="Ajustar a la pantalla"
            className="p-1.5 hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ── Shared small tool button ──────────────────────────────────
function ToolButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
    >
      {icon}
      <span className="hidden lg:inline text-xs font-medium">{label}</span>
    </button>
  );
}
