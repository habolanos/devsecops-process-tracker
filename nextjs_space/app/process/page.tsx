'use client';

import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useProcessStore } from '@/lib/store';
import { useSessionStore } from '@/lib/session-store';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n-context';
import { exportProcessToJSON, downloadJSON } from '@/lib/json-utils';
import { generateWordDocument, downloadWordDocument } from '@/lib/word-generator';
import { ArrowLeft, Download, FileText, CheckCircle2, Globe, Settings, FileJson, List, Workflow } from 'lucide-react';

import { ThemeToggle } from '@/components/theme-toggle';
import ProcessSidebar from './_components/process-sidebar';
import TaskCard from './_components/task-card';
import ActivityCard from './_components/activity-card';
import ProgressBar from './_components/progress-bar';
import { ProcessTabs } from '@/components/process-tabs';
import { ModalSkeleton } from '@/components/skeletons/modal-skeleton';
import { useLoadingStore } from '@/lib/loading-store';
import { DynamicLinksList } from './_components/dynamic-link-button';
import ProcessTimer from './_components/process-timer';
import { useConfigStore } from '@/lib/config-store';

// Lazy load modals for better performance
const EvidenceModal = lazy(() => import('./_components/evidence-modal'));
const VariablesForm = lazy(() => import('./_components/variables-form'));
const ConfigUpload = lazy(() => import('./_components/config-upload').then(m => ({ default: m.ConfigUpload })));

// Lazy load BPMN viewer — bpmn-js requires browser APIs (canvas, window), ssr: false mandatory
const BpmnViewer = dynamic(() => import('./_components/bpmn-viewer'), { ssr: false });

export default function ProcessPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  // Optimized selectors with shallow compare to prevent unnecessary re-renders
  const { process, currentPhaseId, currentTaskId, hasHydrated } = useProcessStore(
    useShallow((state) => ({
      process: state?.process,
      currentPhaseId: state?.currentPhaseId,
      currentTaskId: state?.currentTaskId,
      hasHydrated: state?.hasHydrated ?? false,
    }))
  );
  
  const { setCurrentTask, setCurrentPhase, markProcessComplete, stopProcessTimer, pauseProcessTimer } = useProcessStore(
    useShallow((state) => ({
      setCurrentTask: state?.setCurrentTask,
      setCurrentPhase: state?.setCurrentPhase,
      markProcessComplete: state?.markProcessComplete,
      stopProcessTimer: state?.stopProcessTimer,
      pauseProcessTimer: state?.pauseProcessTimer,
    }))
  );
  
  const { startOperation, endOperation } = useLoadingStore();
  
  const [isExporting, setIsExporting] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showVariablesForm, setShowVariablesForm] = useState(false);
  const [showConfigUpload, setShowConfigUpload] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'bpmn'>('list');
  
  // Stable callback for viewing evidence to prevent memo breaking
  const handleViewEvidence = useCallback((taskId: string) => {
    setCurrentTask?.(taskId);
    setShowEvidenceModal(true);
  }, [setCurrentTask]);

  // BPMN task click: navigate to phase + switch to list view
  const handleBpmnTaskClick = useCallback((taskId: string, phaseId: string) => {
    setCurrentPhase?.(phaseId);
    setCurrentTask?.(taskId);
    setViewMode('list');
    toast.info('Tarea seleccionada — vista lista activada');
  }, [setCurrentPhase, setCurrentTask]);
  
  // Config store
  const configIsLoaded = useConfigStore((state) => state.isLoaded);
  const configFileName = useConfigStore((state) => state.fileName);

  // Session store for process tray
  const { 
    activeTrayId, 
    updateSnapshot, 
    completeProcess: completeProcessInTray,
  } = useSessionStore();

  // Sync process changes to session store
  useEffect(() => {
    if (process && activeTrayId) {
      updateSnapshot(activeTrayId, process);
    }
  }, [process, activeTrayId, updateSnapshot]);

  // Pause timer when leaving the process page (component unmount)
  useEffect(() => {
    return () => {
      const currentProcess = useProcessStore.getState().process;
      if (currentProcess?.timeTracking?.status === 'running') {
        useProcessStore.getState().pauseProcessTimer();
      }
    };
  }, []);

  useEffect(() => {
    // Wait for persist + YAML rehydrate to settle before concluding that
    // there is no active process; otherwise a direct reload to /process
    // would bounce to home before the asynchronous YAML re-fetch finishes.
    if (hasHydrated && !process) {
      router.push('/');
    }
  }, [process, router, hasHydrated]);

  if (!hasHydrated) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div
            className="h-8 w-8 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden="true"
          />
          <p className="text-sm">Restaurando proceso…</p>
        </div>
      </div>
    );
  }

  if (!process) return null;

  const currentPhase = process.phases?.find((p) => p?.id === currentPhaseId);
  const currentTask = currentPhase?.tasks?.find((t) => t?.id === currentTaskId);
  const isProcessCompleted = !!process.completedAt || process.timeTracking?.status === 'completed';

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
      // Pause timer before leaving
      const currentProcess = useProcessStore.getState().process;
      if (currentProcess?.timeTracking?.status === 'running') {
        pauseProcessTimer();
      }
      router.push('/');
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Header - Fixed at top */}
      <header className="flex-shrink-0 bg-background border-b border-border shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Back button + Timer */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t('process.back')}</span>
              </button>
              
              {/* Process Timer */}
              <ProcessTimer />
            </div>

            {/* Right side: Action buttons */}
            <div className="flex items-center gap-2">
              {/* Config Upload Button */}
              <button
                onClick={() => setShowConfigUpload(true)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors ${
                  configIsLoaded 
                    ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' 
                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                }`}
                title={configIsLoaded ? `Config: ${configFileName}` : 'Cargar configuración DevOps'}
              >
                <FileJson className="w-4 h-4" />
                <span className="font-medium text-sm">{configIsLoaded ? 'Config ✓' : 'Config'}</span>
              </button>

              {/* Variables Button - only show if process has variables */}
              {process?.variableDefinitions && process.variableDefinitions.length > 0 && (
                <button
                  onClick={() => setShowVariablesForm(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span className="font-medium text-sm">{t('variables.button') || 'Variables'}</span>
                </button>
              )}

              {/* View mode toggle: Lista / BPMN */}
              <div className="flex items-center border border-border rounded-lg overflow-hidden" data-testid="view-mode-toggle">
                <button
                  onClick={() => setViewMode('list')}
                  title="Vista Lista"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <List className="w-4 h-4" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewMode('bpmn')}
                  title="Vista BPMN"
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'bpmn'
                      ? 'bg-blue-600 text-white'
                      : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  <Workflow className="w-4 h-4" />
                  <span>BPMN</span>
                </button>
              </div>

              <ThemeToggle language={language} />
              <button
                onClick={() => setLanguage?.(language === 'es' ? 'en' : 'es')}
                className="flex items-center gap-2 px-3 py-2 bg-secondary border border-border rounded-lg hover:bg-accent transition-colors"
              >
                <Globe className="w-4 h-4 text-foreground" />
                <span className="font-medium text-sm text-foreground">{language === 'es' ? 'ES' : 'EN'}</span>
              </button>
              
              <button
                onClick={handleExportJSON}
                disabled={isExporting}
                data-testid="export-json-btn"
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium text-sm">{t('export.json')}</span>
              </button>
              
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                data-testid="export-word-btn"
                className="flex items-center gap-2 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium text-sm">{t('export.word')}</span>
              </button>
              
              <button
                onClick={handleCompleteProcess}
                disabled={isExporting || isProcessCompleted}
                data-testid="complete-process-btn"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isProcessCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">
                  {isProcessCompleted ? (t('process.completed') || 'Completado') : t('process.complete')}
                </span>
              </button>

          </div>
          </div>

          {/* Process Name and Tabs Row */}
          <div className="mt-3">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-foreground">{process.name}</h1>
                <p className="text-xs text-muted-foreground">
                  {t('process.version')}: {process.version}
                </p>
              </div>
              {/* Process Tabs - moved inline */}
              <div className="flex-1 overflow-x-auto">
                <ProcessTabs language={language} />
              </div>
            </div>
            <ProgressBar progress={process.progress ?? 0} label={t('process.progress')} />
          </div>
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">

        {/* ── BPMN Diagram View ── */}
        {viewMode === 'bpmn' && (
          <div className="max-w-7xl mx-auto px-6 py-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">Diagrama del Proceso</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Haz clic en cualquier tarea para ir directamente a ella
                </p>
              </div>
            </div>
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <span className="text-sm">Cargando diagrama…</span>
                </div>
              }
            >
              <BpmnViewer
                process={process}
                currentTaskId={currentTaskId}
                onTaskClick={handleBpmnTaskClick}
              />
            </Suspense>
          </div>
        )}

        {/* ── List View ── */}
        {viewMode === 'list' && (
          <div className="flex max-w-7xl mx-auto">
            {/* Sidebar */}
            <ProcessSidebar />

            {/* Task List */}
            <main className="flex-1 p-6">
              {currentPhase && (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-foreground mb-2">
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
                          onViewEvidence={(task) => handleViewEvidence(task?.id ?? '')}
                        />
                      ))
                    ) : (
                      /* Render direct tasks (legacy support) */
                      currentPhase.tasks?.map((task) => (
                        <TaskCard
                          key={task?.id}
                          task={task}
                          phaseId={currentPhaseId ?? ''}
                          onViewEvidence={() => handleViewEvidence(task?.id ?? '')}
                        />
                      )) ?? null
                    )}
                  </div>
                </div>
              )}
            </main>
          </div>
        )}

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
