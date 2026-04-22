'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseYAMLToProcess } from '@/lib/yaml-parser';
import { importProcessFromJSON, exportProcessToJSON, downloadJSON } from '@/lib/json-utils';
import { ProcessState, ProcessExportJSON } from '@/lib/types';
import { useProcessStore } from '@/lib/store';
import { useSessionStore } from '@/lib/session-store';
import { useI18n } from '@/lib/i18n-context';
import { Upload, FileText, Globe, Shield, Rocket, AlertTriangle, FolderOpen, GitPullRequest, Play, Pause, CheckCircle2, XCircle, Layers, Trash2, Download, Github, Linkedin } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLoadingStore } from '@/lib/loading-store';
import { ProcessTabs } from '@/components/process-tabs';
import { UserProfilePopover } from '@/components/user-profile-popover';
import { toast } from 'sonner';

interface ProcessTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  file: string;
  version: string;
  estimatedTime?: string;   // e.g. "45m", "2h", "1h30m"
  hasVariables?: boolean;   // true if the process declares `variables[]`
}

export default function HomePage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const loadProcess = useProcessStore((state) => state?.loadProcess);
  const { addProcess, initSession, pauseCurrentProcess, activeTrayId, processes } = useSessionStore();
  const { startOperation, endOperation } = useLoadingStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ProcessTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    initSession();
  }, [initSession]);

  // Helper to load process and add to tray
  const loadAndTrackProcess = (process: ProcessState) => {
    // Pause current process if there's one active
    const currentProcess = useProcessStore.getState().process;
    if (currentProcess && activeTrayId) {
      pauseCurrentProcess(currentProcess);
    }
    
    // Load new process
    loadProcess?.(process);
    
    // Add to session tray
    addProcess(process);
  };

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/processes');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data.processes || []);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      } finally {
        setLoadingTemplates(false);
      }
    };
    fetchTemplates();
  }, []);

  const handleSelectTemplate = async (templateId: string) => {
    const operationId = `load-template-${templateId}`;
    setIsLoading(true);
    setError(null);
    startOperation(operationId);

    try {
      const response = await fetch(`/api/processes/${templateId}`);
      if (!response.ok) {
        throw new Error('Error al cargar el proceso');
      }
      const data = await response.json();
      const process = parseYAMLToProcess(data.content);
      loadAndTrackProcess(process);
      router.push('/process');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      endOperation(operationId);
    }
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      'shield': <Shield className="w-8 h-8 text-emerald-600" />,
      'rocket': <Rocket className="w-8 h-8 text-blue-600" />,
      'alert-triangle': <AlertTriangle className="w-8 h-8 text-amber-600" />,
      'git-pull-request': <GitPullRequest className="w-8 h-8 text-purple-600" />,
    };
    return icons[iconName] || <FileText className="w-8 h-8 text-gray-600" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'security': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'devops': 'bg-blue-100 text-blue-700 border-blue-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const handleFileUpload = async (file: File, type: 'yaml' | 'json') => {
    const operationId = `upload-${type}`;
    setIsLoading(true);
    setError(null);
    startOperation(operationId);

    try {
      const text = await file.text();
      let process: ProcessState;

      if (type === 'yaml') {
        process = parseYAMLToProcess(text);
      } else {
        const jsonData = JSON.parse(text) as ProcessExportJSON;
        process = importProcessFromJSON(jsonData);
      }

      loadProcess?.(process);
      addProcess(process);
      toast.success(language === 'es' ? 'Archivo cargado' : 'File loaded');
      router.push('/process');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
      endOperation(operationId);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'yaml' | 'json') => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleDrop = (e: React.DragEvent, type: 'yaml' | 'json') => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file, type);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3" data-testid="app-header">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('app.title')}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <UserProfilePopover language={language} />
            <ThemeToggle language={language} />
            <button
              onClick={() => setLanguage?.(language === 'es' ? 'en' : 'es')}
              className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <Globe className="w-4 h-4 text-foreground" />
              <span className="font-medium text-foreground">{language === 'es' ? 'ES' : 'EN'}</span>
            </button>
          </div>
        </div>

        {/* Process Tabs */}
        <ProcessTabs language={language} />
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-foreground mb-4">
            {t('app.title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('app.subtitle')}
          </p>
        </div>

        {/* Process Templates Section */}
        {templates.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {language === 'es' ? 'Procesos Disponibles' : 'Available Processes'}
              </h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  disabled={isLoading}
                  data-testid="process-template"
                  className="bg-card rounded-xl shadow-md p-6 hover:shadow-lg transition-all text-left group hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed border border-border dark:shadow-slate-900/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center group-hover:bg-accent transition-colors">
                      {getIconComponent(template.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground mb-1 truncate">
                        {template.name}
                      </h4>
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full border ${getCategoryColor(template.category)}`}>
                        {template.category}
                      </span>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
                    {template.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">v{template.version}</span>
                    <span className="text-xs text-blue-600 font-medium group-hover:text-blue-700">
                      {language === 'es' ? 'Seleccionar →' : 'Select →'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {loadingTemplates && (
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card rounded-lg shadow-md dark:shadow-slate-900/50">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground">
                {language === 'es' ? 'Cargando procesos...' : 'Loading processes...'}
              </span>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-4 mb-12 max-w-4xl mx-auto">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground font-medium">
            {language === 'es' ? 'O carga tu propio proceso' : 'Or upload your own process'}
          </span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Upload Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* YAML Upload */}
          <div className="bg-card rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow dark:shadow-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {t('upload.yaml')}
              </h3>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-border hover:border-blue-400'
              }`}
              onDrop={(e) => handleDrop(e, 'yaml')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".yaml,.yml"
                onChange={(e) => handleFileSelect(e, 'yaml')}
                className="hidden"
                id="yaml-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="yaml-upload"
                className="cursor-pointer block"
              >
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {t('upload.drag')}
                </p>
                <p className="text-sm text-muted-foreground">.yaml, .yml</p>
              </label>
            </div>
          </div>

          {/* JSON Import */}
          <div className="bg-card rounded-2xl shadow-lg p-8 hover:shadow-xl transition-shadow dark:shadow-slate-900/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">
                {t('upload.json')}
              </h3>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'border-border hover:border-indigo-400'
              }`}
              onDrop={(e) => handleDrop(e, 'json')}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".json"
                onChange={(e) => handleFileSelect(e, 'json')}
                className="hidden"
                id="json-upload"
                disabled={isLoading}
              />
              <label
                htmlFor="json-upload"
                className="cursor-pointer block"
              >
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">
                  {t('upload.drag')}
                </p>
                <p className="text-sm text-muted-foreground">.json</p>
              </label>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {isLoading && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card rounded-lg shadow-md dark:shadow-slate-900/50">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-foreground">{t('upload.loading')}</span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4" data-testid="error-message">
              <p className="text-red-800 dark:text-red-300 font-medium">{t('upload.error')}</p>
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Procesos Estructurados
            </h4>
            <p className="text-muted-foreground text-sm">
              Define procesos con fases y tareas organizadas
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📸</span>
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Evidencia Completa
            </h4>
            <p className="text-muted-foreground text-sm">
              Adjunta texto e imágenes para cada tarea
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Exportación Profesional
            </h4>
            <p className="text-muted-foreground text-sm">
              Genera reportes en JSON y documentos Word
            </p>
          </div>
        </div>

        {/* Session Processes Section */}
        {processes.length > 0 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-foreground">
                  {language === 'es' ? 'Procesos en Curso' : 'Processes in Progress'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {language === 'es' ? 'Presiona Ctrl+P para búsqueda rápida' : 'Press Ctrl+P for quick search'}
                </p>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {processes.map((item) => {
                const statusConfig = {
                  active: { icon: Play, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: language === 'es' ? 'Activo' : 'Active' },
                  paused: { icon: Pause, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: language === 'es' ? 'En Pausa' : 'Paused' },
                  completed: { icon: CheckCircle2, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: language === 'es' ? 'Completado' : 'Completed' },
                  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: language === 'es' ? 'Cancelado' : 'Cancelled' },
                }[item.status];
                const StatusIcon = statusConfig.icon;
                const isActive = item.trayId === activeTrayId;

                return (
                  <div
                    key={item.trayId}
                    className={`bg-card rounded-xl shadow-md p-6 transition-all border-2 dark:shadow-slate-900/50 ${
                      isActive ? 'border-blue-400 ring-2 ring-blue-100 dark:ring-blue-900/50' : 'border-border hover:shadow-lg hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 ${statusConfig.bg} rounded-xl flex items-center justify-center`}>
                        <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground mb-1 truncate">
                          {item.processName}
                        </h4>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border} border`}>
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>{language === 'es' ? 'Progreso' : 'Progress'}</span>
                        <span>{Math.round(item.snapshot.progress * 100)}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all ${
                            item.status === 'completed' ? 'bg-blue-500' :
                            item.status === 'active' ? 'bg-green-500' :
                            item.status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${item.snapshot.progress * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => {
                          const currentProcess = useProcessStore.getState().process;
                          if (currentProcess && activeTrayId) {
                            useSessionStore.getState().updateSnapshot(activeTrayId, currentProcess);
                          }
                          const snapshot = useSessionStore.getState().switchToProcess(item.trayId);
                          if (snapshot) {
                            loadProcess?.(snapshot);
                            toast.success(language === 'es' ? 'Proceso cargado' : 'Process loaded');
                            router.push('/process');
                          }
                        }}
                        className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
                      >
                        {isActive 
                          ? (language === 'es' ? 'Continuar →' : 'Continue →')
                          : (language === 'es' ? 'Reanudar →' : 'Resume →')
                        }
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => {
                            const exportData = await exportProcessToJSON(item.snapshot);
                            const filename = `${item.processName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
                            downloadJSON(exportData, filename);
                            toast.success(language === 'es' ? 'Exportado' : 'Exported');
                          }}
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                          title={language === 'es' ? 'Exportar' : 'Export'}
                        >
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                        {/* Hide the Remove button on the card for the
                            currently active process. Removing the
                            process you are working on would discard
                            in-progress state; the store guard in
                            `removeFromTray` enforces the same invariant. */}
                        {!isActive && (
                          <button
                            onClick={() => {
                              const removed = useSessionStore
                                .getState()
                                .removeFromTray(item.trayId);
                              if (removed) {
                                toast.success(language === 'es' ? 'Proceso removido' : 'Process removed');
                              } else {
                                toast.warning(
                                  language === 'es'
                                    ? 'No puedes eliminar el proceso en el que estás trabajando.'
                                    : 'You cannot remove the process you are working on.'
                                );
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title={language === 'es' ? 'Eliminar' : 'Remove'}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-8 border-t border-border bg-background">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {/* External badge from badgen.net — next/image requires remotePatterns config and
                provides no optimization benefit for a 6px-tall SVG badge. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://badgen.net/badge/Open%20Source%20%3F/Yes%21/green?icon=github" alt={t('footer.opensource')} className="h-6" />
            <a href="https://github.com/habolanos/devsecops-process-tracker" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-accent hover:border-foreground/20 transition-all shadow-sm">
              <Github className="w-4 h-4" />
              <span className="text-sm font-medium">{t('footer.repo')}</span>
            </a>
            <a href="https://www.linkedin.com/in/habolanos" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:border-blue-700 dark:hover:text-blue-400 transition-all shadow-sm">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm font-medium">{t('footer.linkedin')}</span>
            </a>
          </div>
          <p className="text-muted-foreground text-xs">Process Tracker DevSecOps by Harold Adrian &copy; 2026</p>
        </div>
      </footer>
    </div>
  );
}
