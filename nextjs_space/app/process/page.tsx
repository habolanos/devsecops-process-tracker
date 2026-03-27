'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProcessStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n-context';
import { exportProcessToJSON, downloadJSON } from '@/lib/json-utils';
import { generateWordDocument, downloadWordDocument } from '@/lib/word-generator';
import { ArrowLeft, Download, FileText, CheckCircle2, Globe, Settings } from 'lucide-react';
import ProcessSidebar from './_components/process-sidebar';
import TaskCard from './_components/task-card';
import EvidenceModal from './_components/evidence-modal';
import ProgressBar from './_components/progress-bar';
import VariablesForm from './_components/variables-form';
import { DynamicLinksList } from './_components/dynamic-link-button';

export default function ProcessPage() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const process = useProcessStore((state) => state?.process);
  const currentPhaseId = useProcessStore((state) => state?.currentPhaseId);
  const currentTaskId = useProcessStore((state) => state?.currentTaskId);
  const setCurrentTask = useProcessStore((state) => state?.setCurrentTask);
  const markProcessComplete = useProcessStore((state) => state?.markProcessComplete);
  const clearProcess = useProcessStore((state) => state?.clearProcess);
  
  const [isExporting, setIsExporting] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showVariablesForm, setShowVariablesForm] = useState(false);

  useEffect(() => {
    if (!process) {
      router.push('/');
    }
  }, [process, router]);

  if (!process) return null;

  const currentPhase = process.phases?.find((p) => p?.id === currentPhaseId);
  const currentTask = currentPhase?.tasks?.find((t) => t?.id === currentTaskId);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const exportData = await exportProcessToJSON(process);
      const filename = `${process.name?.replace(/\s+/g, '-') || 'process'}-${new Date().toISOString().split('T')[0]}.json`;
      downloadJSON(exportData, filename);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    try {
      const blob = await generateWordDocument(process);
      const filename = `${process.name?.replace(/\s+/g, '-') || 'process'}-${new Date().toISOString().split('T')[0]}.docx`;
      downloadWordDocument(blob, filename);
    } catch (error) {
      console.error('Word export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCompleteProcess = () => {
    if (confirm('¿Seguro que deseas finalizar el proceso?')) {
      markProcessComplete?.();
      handleExportJSON();
      handleExportWord();
    }
  };

  const handleBackToHome = () => {
    if (confirm('¿Seguro que deseas salir? Se guardará tu progreso.')) {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">{t('process.back')}</span>
              </button>
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{process.name}</h1>
                <p className="text-sm text-gray-600">
                  {t('process.version')}: {process.version}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
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

              <button
                onClick={() => setLanguage?.(language === 'es' ? 'en' : 'es')}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="font-medium">{language === 'es' ? 'ES' : 'EN'}</span>
              </button>
              
              <button
                onClick={handleExportJSON}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">{t('export.json')}</span>
              </button>
              
              <button
                onClick={handleExportWord}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                <span className="font-medium">{t('export.word')}</span>
              </button>
              
              <button
                onClick={handleCompleteProcess}
                disabled={isExporting}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-medium">{t('process.complete')}</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <ProgressBar progress={process.progress ?? 0} label={t('process.progress')} />
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
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentPhase.name}
                </h2>
                {currentPhase.description && (
                  <p className="text-gray-600 mb-4">{currentPhase.description}</p>
                )}
                <ProgressBar
                  progress={currentPhase.progress ?? 0}
                  label={t('phase.progress')}
                  variant="secondary"
                />
                
                {/* Phase-level Dynamic Links */}
                {currentPhase.dynamicLinks && currentPhase.dynamicLinks.length > 0 && (
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <DynamicLinksList links={currentPhase.dynamicLinks} phaseId={currentPhase.id} />
                  </div>
                )}
              </div>

              <div className="grid gap-4">
                {currentPhase.tasks?.map((task) => (
                  <TaskCard
                    key={task?.id}
                    task={task}
                    phaseId={currentPhaseId ?? ''}
                    onViewEvidence={() => {
                      setCurrentTask?.(task?.id ?? null);
                      setShowEvidenceModal(true);
                    }}
                  />
                )) ?? null}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Evidence Modal */}
      {showEvidenceModal && currentTask && currentPhaseId && (
        <EvidenceModal
          task={currentTask}
          phaseId={currentPhaseId}
          onClose={() => {
            setShowEvidenceModal(false);
            setCurrentTask?.(null);
          }}
        />
      )}

      {/* Variables Form Modal */}
      <VariablesForm
        isOpen={showVariablesForm}
        onClose={() => setShowVariablesForm(false)}
      />
    </div>
  );
}
