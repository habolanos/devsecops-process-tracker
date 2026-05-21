'use client';

import { useState, useEffect } from 'react';
import { X, Search, Layers, Loader2 } from 'lucide-react';

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  file: string;
  version: string;
}

interface CatalogModalProps {
  onSelect: (yamlText: string, processName: string) => void;
  onClose: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  devops: 'bg-blue-100 text-blue-700 border-blue-200',
  security: 'bg-red-100 text-red-700 border-red-200',
  incident: 'bg-orange-100 text-orange-700 border-orange-200',
  release: 'bg-green-100 text-green-700 border-green-200',
  default: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function CatalogModal({ onSelect, onClose }: CatalogModalProps) {
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/processes')
      .then((r) => r.json())
      .then((data) => { setTemplates(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los procesos'); setLoading(false); });
  }, []);

  const filtered = templates.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = async (template: ProcessTemplate) => {
    try {
      setLoadingId(template.id);
      const res = await fetch(`/api/processes/${template.file}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const yamlText = await res.text();
      onSelect(yamlText, template.name);
    } catch (e) {
      setError(`No se pudo cargar "${template.name}": ${(e as Error).message}`);
      setLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-foreground">Cargar desde catálogo</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar proceso…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Cargando catálogo…</span>
            </div>
          )}

          {!loading && error && (
            <p className="text-sm text-destructive text-center py-8">{error}</p>
          )}

          {!loading && !error && filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">No se encontraron procesos</p>
          )}

          {!loading && !error && filtered.map((t) => {
            const catColor = CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.default;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t)}
                disabled={loadingId !== null}
                className="w-full text-left px-4 py-3 rounded-xl border border-border hover:bg-accent transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground truncate">{t.name}</span>
                      <span className={`hidden sm:inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${catColor}`}>
                        {t.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  </div>
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">v{t.version}</span>
                    {loadingId === t.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    ) : (
                      <span className="text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Cargar →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
