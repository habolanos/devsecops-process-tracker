'use client';

import { useMemo, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Copy, Download, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { validateYamlString, YamlValidationResult } from '@/lib/bpmn-to-yaml';
import { toast } from 'sonner';

interface YamlPreviewProps {
  yaml: string;
  isUpdating?: boolean;
  onSync?: () => void;
  autoSync?: boolean;
  onToggleAutoSync?: () => void;
  onYamlChange?: (yaml: string) => void;
}

export default function YamlPreview({
  yaml,
  isUpdating = false,
  onSync,
  autoSync = false,
  onToggleAutoSync,
  onYamlChange,
}: YamlPreviewProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const liveValidation: YamlValidationResult = useMemo(
    () => (yaml ? validateYamlString(yaml) : { valid: false, errors: ['Sin contenido YAML'] }),
    [yaml]
  );

  const draftValidation: YamlValidationResult = useMemo(
    () => (draft ? validateYamlString(draft) : { valid: false, errors: ['Sin contenido YAML'] }),
    [draft]
  );

  const validation = editing ? draftValidation : liveValidation;

  const handleApply = useCallback(() => {
    onYamlChange?.(draft);
    setEditing(false);
    toast.success('YAML actualizado');
  }, [draft, onYamlChange]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  const handleTabKey = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Tab') return;
    e.preventDefault();
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const next = draft.substring(0, start) + '  ' + draft.substring(end);
    setDraft(next);
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + 2;
    });
  }, [draft]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editing ? draft : yaml);
      toast.success('YAML copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el YAML');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([editing ? draft : yaml], { type: 'text/yaml;charset=utf-8' });
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
          {/* Edit / Apply / Cancel */}
          {!editing ? (
            <button
              onClick={() => { setDraft(yaml); setEditing(true); }}
              title="Editar YAML manualmente"
              className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-400 hover:text-blue-400 hover:bg-slate-700 transition-colors"
            >
              <Pencil className="w-3 h-3" />
              <span>Editar</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleApply}
                title="Aplicar cambios del YAML"
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-emerald-400 hover:bg-slate-700 transition-colors"
              >
                <Check className="w-3 h-3" />
                <span>Aplicar</span>
              </button>
              <button
                onClick={handleCancel}
                title="Cancelar edición"
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-red-400 hover:bg-slate-700 transition-colors"
              >
                <X className="w-3 h-3" />
                <span>Cancelar</span>
              </button>
            </>
          )}

          <div className="w-px h-4 bg-slate-700 mx-0.5" />

          {!editing && onToggleAutoSync && (
            <label
              title={autoSync ? 'Auto-sync activo — click para detener' : 'Activar auto-sync (cada 800 ms)'}
              className="flex items-center gap-1 cursor-pointer select-none px-1.5 py-1 rounded hover:bg-slate-700 transition-colors"
            >
              <input
                type="checkbox"
                checked={autoSync}
                onChange={onToggleAutoSync}
                className="w-3 h-3 accent-emerald-400 cursor-pointer"
              />
              <span className={`text-xs ${autoSync ? 'text-emerald-400' : 'text-slate-500'}`}>Auto</span>
            </label>
          )}
          {!editing && onSync && (
            <button
              onClick={onSync}
              title="Sincronizar YAML desde el diagrama"
              className="p-1.5 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleCopy}
            disabled={!yaml && !draft}
            title="Copiar YAML"
            className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-40"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownload}
            disabled={!yaml && !draft}
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

      {/* YAML content / editor */}
      <div className="flex-1 overflow-auto relative">
        {editing ? (
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleTabKey}
            spellCheck={false}
            className="w-full h-full min-h-full p-4 text-xs font-mono text-slate-200 bg-slate-950 resize-none outline-none leading-relaxed"
            placeholder="# Edita el YAML aquí…"
          />
        ) : yaml ? (
          <pre className="text-xs font-mono text-slate-300 p-4 leading-relaxed whitespace-pre">
            {applySimpleSyntaxHighlight(yaml)}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            Edita el diagrama o presiona 🔄 para generar el YAML
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
