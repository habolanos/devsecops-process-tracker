'use client';

import { useMemo } from 'react';
import { CheckCircle2, AlertCircle, Copy, Download } from 'lucide-react';
import { validateYamlString, YamlValidationResult } from '@/lib/bpmn-to-yaml';
import { toast } from 'sonner';

interface YamlPreviewProps {
  yaml: string;
  isUpdating?: boolean;
}

export default function YamlPreview({ yaml, isUpdating = false }: YamlPreviewProps) {
  const validation: YamlValidationResult = useMemo(
    () => (yaml ? validateYamlString(yaml) : { valid: false, errors: ['Sin contenido YAML'] }),
    [yaml]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(yaml);
      toast.success('YAML copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el YAML');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([yaml], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'process.yaml';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('YAML descargado');
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">YAML Preview</span>
          {isUpdating && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Actualizando…" />
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!yaml}
            title="Copiar YAML"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!yaml}
            title="Descargar process.yaml"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Validation status bar */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 text-xs flex-shrink-0 border-b ${
          validation.valid
            ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
            : 'bg-red-950/60 border-red-800 text-red-400'
        }`}
      >
        {validation.valid ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Schema válido — listo para usar</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{validation.errors[0]}</span>
            {validation.errors.length > 1 && (
              <span className="ml-auto whitespace-nowrap text-red-500">
                +{validation.errors.length - 1} más
              </span>
            )}
          </>
        )}
      </div>

      {/* YAML content */}
      <div className="flex-1 overflow-auto">
        {yaml ? (
          <pre className="text-xs font-mono text-slate-300 p-4 leading-relaxed whitespace-pre">
            {applySimpleSyntaxHighlight(yaml)}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Edita el diagrama para ver el YAML generado
          </div>
        )}
      </div>

      {/* Error list */}
      {!validation.valid && validation.errors.length > 1 && (
        <div className="flex-shrink-0 px-3 py-2 bg-red-950/40 border-t border-red-900/50 max-h-28 overflow-y-auto">
          <ul className="space-y-0.5">
            {validation.errors.map((err, i) => (
              <li key={i} className="text-xs text-red-400 flex items-start gap-1.5">
                <span className="flex-shrink-0 mt-0.5">•</span>
                <span>{err}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Minimal syntax highlighter (no dependency) ─────────────
function applySimpleSyntaxHighlight(yamlStr: string): React.ReactNode {
  const lines = yamlStr.split('\n');
  return lines.map((line, i) => {
    const isKey = /^(\s*)([\w-]+)(\s*):/.test(line);
    const isComment = /^\s*#/.test(line);
    const isString = /:\s+"/.test(line) || /^\s+-\s+"/.test(line);

    let color = 'text-slate-300';
    if (isComment) color = 'text-slate-500 italic';
    else if (isKey) color = 'text-blue-300';
    else if (isString) color = 'text-emerald-300';

    return (
      <span key={i} className={`block ${color}`}>
        {line || '\u00A0'}
      </span>
    );
  });
}
