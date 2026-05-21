'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileCode2, ClipboardPaste } from 'lucide-react';

interface ImportXmlModalProps {
  onImport: (xml: string) => void;
  onClose: () => void;
}

export default function ImportXmlModal({ onImport, onClose }: ImportXmlModalProps) {
  const [tab, setTab] = useState<'paste' | 'file'>('paste');
  const [xmlText, setXmlText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = (xml: string): boolean => {
    if (!xml.trim()) { setError('El contenido XML está vacío'); return false; }
    if (!xml.includes('<bpmn:') && !xml.includes('<definitions')) {
      setError('El archivo no parece ser un BPMN 2.0 válido (falta <bpmn:definitions>)');
      return false;
    }
    setError(null);
    return true;
  };

  const handleImport = () => {
    if (validate(xmlText)) onImport(xmlText);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setXmlText(content);
      setTab('paste');
    };
    reader.readAsText(file, 'utf-8');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-foreground">Importar BPMN XML</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border flex-shrink-0">
          <button
            onClick={() => setTab('paste')}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === 'paste'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <ClipboardPaste className="w-4 h-4" />
            Pegar XML
          </button>
          <button
            onClick={() => { setTab('file'); fileRef.current?.click(); }}
            className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === 'file'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Upload className="w-4 h-4" />
            Subir archivo .bpmn
          </button>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".bpmn,.xml"
          className="hidden"
          onChange={handleFile}
        />

        {/* Textarea */}
        <div className="flex-1 p-4 overflow-auto">
          <textarea
            value={xmlText}
            onChange={(e) => { setXmlText(e.target.value); setError(null); }}
            placeholder={'<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions ...>'}
            className="w-full h-64 font-mono text-xs bg-slate-950 text-slate-200 border border-slate-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-600"
            spellCheck={false}
          />
          {error && (
            <p className="mt-2 text-sm text-destructive flex items-center gap-1.5">
              <span className="font-medium">Error:</span> {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            disabled={!xmlText.trim()}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Importar diagrama
          </button>
        </div>
      </div>
    </div>
  );
}
