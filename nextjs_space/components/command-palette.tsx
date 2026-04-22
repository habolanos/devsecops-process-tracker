'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSessionStore, ProcessTrayStatus } from '@/lib/session-store';
import { useProcessStore } from '@/lib/store';
import { exportProcessToJSON, downloadJSON } from '@/lib/json-utils';
import { 
  Play, Pause, CheckCircle2, XCircle, Search, 
  Command, ArrowRight, Download, Trash2, Home
} from 'lucide-react';
import { toast } from 'sonner';

interface CommandPaletteProps {
  language?: 'es' | 'en';
}

const STATUS_CONFIG: Record<ProcessTrayStatus, { icon: React.ElementType; color: string; label: { es: string; en: string } }> = {
  active: { icon: Play, color: 'text-green-600', label: { es: 'Activo', en: 'Active' } },
  paused: { icon: Pause, color: 'text-amber-600', label: { es: 'En Pausa', en: 'Paused' } },
  completed: { icon: CheckCircle2, color: 'text-blue-600', label: { es: 'Completado', en: 'Completed' } },
  cancelled: { icon: XCircle, color: 'text-red-600', label: { es: 'Cancelado', en: 'Cancelled' } },
};

export function CommandPalette({ language = 'es' }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  
  const { processes, activeTrayId, switchToProcess, removeFromTray, updateSnapshot } = useSessionStore();
  const loadProcess = useProcessStore((state) => state.loadProcess);

  const t = {
    title: language === 'es' ? 'Buscar procesos...' : 'Search processes...',
    noResults: language === 'es' ? 'Sin resultados' : 'No results',
    hint: language === 'es' ? 'Usa ↑↓ para navegar, Enter para seleccionar, Esc para cerrar' : 'Use ↑↓ to navigate, Enter to select, Esc to close',
    goToProcess: language === 'es' ? 'Ir al proceso' : 'Go to process',
    export: language === 'es' ? 'Exportar' : 'Export',
    remove: language === 'es' ? 'Eliminar' : 'Remove',
    goHome: language === 'es' ? 'Ir al inicio' : 'Go to home',
  };

  const filteredProcesses = processes.filter(p => 
    p.processName.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    setSearch('');
    setSelectedIndex(0);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSearch('');
  }, []);

  const handleSwitchProcess = useCallback((trayId: string) => {
    const currentProcess = useProcessStore.getState().process;
    if (currentProcess && activeTrayId) {
      updateSnapshot(activeTrayId, currentProcess);
    }

    const snapshot = switchToProcess(trayId);
    if (snapshot) {
      loadProcess(snapshot);
      toast.success(language === 'es' ? 'Proceso reanudado' : 'Process resumed');
      if (pathname !== '/process') {
        router.push('/process');
      }
    }
    handleClose();
  }, [activeTrayId, updateSnapshot, switchToProcess, loadProcess, language, pathname, router, handleClose]);

  const handleExport = useCallback(async (trayId: string) => {
    const item = processes.find(p => p.trayId === trayId);
    if (!item) return;

    try {
      const exportData = await exportProcessToJSON(item.snapshot);
      const filename = `${item.processName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(exportData, filename);
      toast.success(language === 'es' ? 'Exportado exitosamente' : 'Exported successfully');
    } catch (error) {
      console.error('Export error:', error);
    }
    handleClose();
  }, [processes, language, handleClose]);

  const handleRemove = useCallback((trayId: string) => {
    const removed = removeFromTray(trayId);
    if (removed) {
      toast.success(language === 'es' ? 'Proceso removido' : 'Process removed');
      handleClose();
    } else {
      // Defensive: the Trash button is hidden on the active row, so this
      // path is not reachable from the UI. Keep it wired to the store's
      // rejection so keyboard shortcuts or future callers cannot bypass
      // the invariant.
      toast.warning(
        language === 'es'
          ? 'No puedes eliminar el proceso en el que estás trabajando.'
          : 'You cannot remove the process you are working on.'
      );
    }
  }, [removeFromTray, language, handleClose]);

  const handleGoHome = useCallback(() => {
    router.push('/');
    handleClose();
  }, [router, handleClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+P or Cmd+P to open
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handleOpen();
        return;
      }

      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          handleClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(i => Math.min(i + 1, filteredProcesses.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(i => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredProcesses[selectedIndex]) {
            handleSwitchProcess(filteredProcesses[selectedIndex].trayId);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredProcesses, selectedIndex, handleOpen, handleClose, handleSwitchProcess]);

  // Reset selection when search changes — tracked during render rather than
  // in an effect so React applies the reset in the same commit.
  const [trackedSearch, setTrackedSearch] = useState(search);
  if (search !== trackedSearch) {
    setTrackedSearch(search);
    setSelectedIndex(0);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full max-w-xl">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.title}
              className="flex-1 text-lg outline-none placeholder:text-gray-400"
              autoFocus
            />
            <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded">
              <Command className="w-3 h-3" />
              <span>P</span>
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[400px] overflow-y-auto">
            {filteredProcesses.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                {processes.length === 0 
                  ? (language === 'es' ? 'No hay procesos en la sesión' : 'No processes in session')
                  : t.noResults
                }
              </div>
            ) : (
              <div className="py-2">
                {filteredProcesses.map((process, index) => {
                  const config = STATUS_CONFIG[process.status];
                  const StatusIcon = config.icon;
                  const isSelected = index === selectedIndex;
                  const isActive = process.trayId === activeTrayId;

                  return (
                    <div
                      key={process.trayId}
                      className={`
                        group px-4 py-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                      `}
                      onClick={() => handleSwitchProcess(process.trayId)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${config.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center`}>
                          <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                              {process.processName}
                            </span>
                            {isActive && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                                {language === 'es' ? 'actual' : 'current'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{config.label[language]}</span>
                            <span>•</span>
                            <span>{Math.round(process.snapshot.progress * 100)}%</span>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleExport(process.trayId); }}
                            className="p-1.5 hover:bg-gray-200 rounded"
                            title={t.export}
                          >
                            <Download className="w-4 h-4 text-gray-500" />
                          </button>
                          {/* Hide the Remove action for the process the
                              user is currently working on. The store's
                              `removeFromTray` guard would reject it
                              anyway; hiding avoids a misleading control. */}
                          {!isActive && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemove(process.trayId); }}
                              className="p-1.5 hover:bg-red-100 rounded"
                              title={t.remove}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          )}
                        </div>

                        <ArrowRight className={`w-4 h-4 text-gray-400 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            process.status === 'completed' ? 'bg-blue-500' :
                            process.status === 'active' ? 'bg-green-500' :
                            process.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${process.snapshot.progress * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick actions */}
            <div className="border-t border-gray-100 px-4 py-2">
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>{t.goHome}</span>
              </button>
            </div>
          </div>

          {/* Footer hint */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 text-center">
            {t.hint}
          </div>
        </div>
      </div>
    </div>
  );
}
