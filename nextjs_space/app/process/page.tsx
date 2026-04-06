'use client';

import { useEffect, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessStore } from '@/lib/store';
import { useSessionStore } from '@/lib/session-store';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';
import { exportProcessToJSON, downloadJSON } from '@/lib/json-utils';
import { generateWordDocument, downloadWordDocument } from '@/lib/word-generator';
import { ArrowLeft, Download, FileText, CheckCircle2, Globe, Settings, FileJson } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import ProcessSidebar from './_components/process-sidebar';
import TaskCard from './_components/task-card';
import ActivityCard from './_components/activity-card';
import ProgressBar from './_components/progress-bar';
import { ProcessTabs } from '@/components/process-tabs';
import { ModalSkeleton } from '@/components/skeletons/modal-skeleton';
import { useLoadingStore } from '@/lib/loading-store';

// Lazy load modals for better performance
const EvidenceModal = lazy(() => import('./_components/evidence-modal'));
const VariablesForm = lazy(() => import('./_components/variables-form'));
const ConfigUpload = lazy(() => import('./_components/config-upload').then(m => ({ default: m.ConfigUpload })));
import { DynamicLinksList } from './_components/dynamic-link-button';
import ProcessTimer from './_components/process-timer';
import { useConfigStore } from '@/lib/config-store';

export default function ProcessPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  // Optimized selectors with shallow compare to prevent unnecessary re-renders
  const { process, currentPhaseId, currentTaskId } = useProcessStore(
    useShallow((state) => ({
      process: state?.process,
      currentPhaseId: state?.currentPhaseId,
      currentTaskId: state?.currentTaskId,
    }))
  );
  
  const { setCurrentTask, markProcessComplete, stopProcessTimer } = useProcessStore(
    useShallow((state) => ({
      setCurrentTask: state?.setCurrentTask,
      markProcessComplete: state?.markProcessComplete,
      stopProcessTimer: state?.stopProcessTimer,
    }))
  );
  
  const { startOperation, endOperation } = useLoadingStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showVariablesForm, setShowVariablesForm] = useState(false);
  const [showConfigUpload, setShowConfigUpload] = useState(false);
  
  // Config store
  const configIsLoaded = useConfigStore((state) => state.isLoaded);
  const configFileName = useConfigStore((state) => state.fileName);

  // Session store for process tray
  const { 
    activeTrayId, 
    updateSnapshot, 
    completeProcess: completeProcessInTray,
    switchToProcess: switchProcessInTray,
  } = useSessionStore();

  // Sync process changes to session store
  useEffect(() => {
    if (process && activeTrayId) {
      updateSnapshot(activeTrayId, process);
    }
  }, [process, activeTrayId, updateSnapshot]);

  useEffect(() => {
    if (!process) {
      router.push('/');
    }
  }, [process, router]);

  if (!process) return null;

  const currentPhase = process.phases?.find((p) => p?.id === currentPhaseId);
  const currentTask = currentPhase?.tasks?.find((t) => t?.id === currentTaskId);

  const handleExportJSON = async () => {
    const operationId = 'export-json';
    setIsExporting(true);
    startOperation(operationId);
    
    try {
      const dataToExport = useProcessStore.getState().process;
      if (!dataToExport) return;
      const exportData = await exportProcessToJSON(dataToExport);
      const filename = `${dataToExport.name?.replace(/\s+/g, '-') || 'process'}-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(exportData, filename);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
      endOperation(operationId);
    }
  };

  const handleExportWord = async () => {
    const operationId = 'export-word';
    setIsExporting(true);
    startOperation(operationId);
    
    try {
      const dataToExport = useProcessStore.getState().process;
      if (!dataToExport) return;
      const doc = await generateWordDocument(dataToExport);
      const filename = `${dataToExport.name?.replace(/\s+/g, '-') || 'process'}-${new Date().toISOString().split('T')[0]}.docx`;
      downloadWordDocument(doc, filename);
    } catch (error) {
      console.error('Word export error:', error);
    } finally {
      setIsExporting(false);
      endOperation(operationId);
    }
  };

  const handleCompleteProcess = () => {
    if (confirm('¿Seguro que deseas finalizar el proceso?')) {
      stopProcessTimer?.(); // Stop timer before completing
      markProcessComplete?.();
      toast.success(t('process.completed.success') || 'Proceso completado');
      // Use setTimeout to ensure state is updated before export
      setTimeout(() => {
        const updatedProcess = useProcessStore.getState().process;
        if (updatedProcess) {
          // Update session tray with completed status
          if (activeTrayId) {
            completeProcessInTray(activeTrayId, updatedProcess);
          }
          handleExportJSON();
          handleExportWord();
        }
      }, 100);
    }
  };

  const handleBackToHome = () => {
    if (confirm('¿Seguro que deseas salir? Se guardará tu progreso.')) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">{t('process.back')}</span>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-foreground">{process.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {t('process.version')}: {process.version}
                </p>
              </div>
              
              {/* Process Timer */}
              <ProcessTimer />
            </div>

            <div className="flex items-center gap-3">
              {/* Config Upload Button */}
              <button
                onClick={() => setShowConfigUpload(true)}
                className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                  configIsLoaded 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
                title={configIsLoaded ? `Config: ${configFileName}` : 'Cargar configuración DevOps'}
              >
                <FileJson className="w-4 h-4" />
                <span className="font-medium">{configIsLoaded ? 'Config ✓' : 'Config'}</span>
              </button>

              {/* Variables Button - only show if process has variables */}
              {process?.variableDefinitions && process.variableDefinitions.length > 0 && (
                <button
                  onClick={() => setShowVariablesForm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium">{t('variables.button') || 'Variables'}</span>
                </button>
              )}

              <ThemeToggle language={language} />
              <button
                onClick={() => setLanguage?.(language === 'es' ? 'en' : 'es')}
                className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <Globe className="w-4 h-4 text-foreground" />
                <span className="font-medium text-foreground">{language === 'es' ? 'ES' : 'EN'}</span>
              </button>
              
              <button
                onClick={handleExportJSON}
                disabled={isExporting}
                data-testid="export-json-btn"
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">{t('export.json')}</span>
              </button>
              
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                data-testid="export-word-btn"
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">{t('export.word')}</span>
              </button>
              
              <button
                onClick={handleCompleteProcess}
                disabled={isExporting}
                data-testid="complete-process-btn"
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{t('process.complete')}</span>
              </button>

            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar progress={process.progress ?? 0} label={t('process.progress')} />

          {/* Process Tabs */}
          <ProcessTabs language={language} />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <ProcessSidebar />

        {/* Task List */}
        <main className="flex-1 p-6">
          {currentPhase && (
            <div>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {currentPhase.name}
                </h2>
                {currentPhase.description && (
                  <p className="text-muted-foreground mb-4">{currentPhase.description}</p>
                )}
                <ProgressBar
                  progress={currentPhase.progress ?? 0}
                  label={t('phase.progress')}
                  variant="secondary"
                />
                
                {/* Phase-level Dynamic Links */}
                {currentPhase.dynamicLinks && currentPhase.dynamicLinks.length > 0 && (
                  <div className="mt-4 p-4 bg-card rounded-lg border border-border">
                    <DynamicLinksList links={currentPhase.dynamicLinks} phaseId={currentPhase.id} />
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {/* Render Activities if present */}
                {currentPhase.activities && currentPhase.activities.length > 0 ? (
                  currentPhase.activities.map((activity) => (
                    <ActivityCard
                      key={activity.id}
                      activity={activity}
                      phaseId={currentPhaseId ?? ''}
                      onViewEvidence={(task) => {
                        setCurrentTask?.(task?.id ?? null);
                        setShowEvidenceModal(true);
                      }}
                    />
                  ))
                ) : (
                  /* Render direct tasks (legacy support) */
                  currentPhase.tasks?.map((task) => (
                    <TaskCard
                      key={task?.id}
                      task={task}
                      phaseId={currentPhaseId ?? ''}
                      onViewEvidence={() => {
                        setCurrentTask?.(task?.id ?? null);
                        setShowEvidenceModal(true);
                      }}
                    />
                  )) ?? null
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Evidence Modal - Lazy loaded */}
      {showEvidenceModal && currentTask && currentPhaseId && (
        <Suspense fallback={<ModalSkeleton />}>
          <EvidenceModal
            task={currentTask}
            phaseId={currentPhaseId}
            onClose={() => {
              setShowEvidenceModal(false);
              setCurrentTask?.(null);
            }}
          />
        </Suspense>
      )}

      {/* Variables Form Modal - Lazy loaded */}
      <Suspense fallback={null}>
        <VariablesForm
          isOpen={showVariablesForm}
          onClose={() => setShowVariablesForm(false)}
        />
      </Suspense>

      {/* Config Upload Modal - Lazy loaded */}
      {showConfigUpload && (
        <Suspense fallback={<ModalSkeleton />}>
          <ConfigUpload onClose={() => setShowConfigUpload(false)} />
        </Suspense>
      )}
    </div>
  );
}
