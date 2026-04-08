'use client';

import { memo } from 'react';
import { TaskState } from '@/lib/types';
import { useProcessStore } from '@/lib/store';
import { useShallow } from 'zustand/react/shallow';
import { canCompleteTask } from '@/lib/helpers';
import { useI18n } from '@/lib/i18n-context';
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize';
import { CheckCircle2, Circle, Lock, ExternalLink, FileText, Image as ImageIcon, Square, CheckSquare, ListChecks, FileSpreadsheet, List } from 'lucide-react';
import { toast } from 'sonner';
import { DynamicLinksList } from './dynamic-link-button';
import { DynamicListInput } from './dynamic-list-input';
import { DetailListInput } from './detail-list-input';
import { FormRenderer } from './form-renderer';
import { generateReleaseExcel, processToReleaseReport, downloadExcel, generateReleaseFilename } from '@/lib/excel-generator';
import { ListItem, DetailItem, FormFieldValue } from '@/lib/types';

interface TaskCardProps {
  task: TaskState;
  phaseId: string;
  activityId?: string;
  onViewEvidence: () => void;
}

function TaskCard({ task, phaseId, activityId, onViewEvidence }: TaskCardProps) {
  const { t } = useI18n();
  // Use store actions with stable references - only extract functions once
  const storeActions = useProcessStore(useShallow((state) => ({
    completeTask: state?.completeTask,
    uncompleteTask: state?.uncompleteTask,
    toggleCheckItem: state?.toggleCheckItem,
    canCompleteCheckTask: state?.canCompleteCheckTask,
    updateListData: state?.updateListData,
    updateDetailData: state?.updateDetailData,
    updateFormData: state?.updateFormData,
  })));

  const taskType = task?.type || 'standard';
  const isCheckType = taskType === 'check' || taskType === 'multicheck';
  const isExportExcelType = taskType === 'export-excel';
  const isDynamicListType = taskType === 'dynamic-list';
  const isDetailListType = taskType === 'detail-list';
  const isFormType = taskType === 'form';

  // Handle list data changes for dynamic-list tasks
  const handleListDataChange = (items: ListItem[]) => {
    storeActions.updateListData?.(phaseId, task.id, items, activityId);
  };

  // Handle detail data changes for detail-list tasks
  const handleDetailDataChange = (detailData: DetailItem[]) => {
    storeActions.updateDetailData?.(phaseId, task.id, detailData, activityId);
  };

  // Handle form data changes for form tasks
  const handleFormDataChange = (formData: FormFieldValue[]) => {
    storeActions.updateFormData?.(phaseId, task.id, formData, activityId);
  };

  // Check if dynamic-list task meets minimum items requirement
  const listMinItems = task?.listConfig?.minItems ?? 1;
  const currentListItems = task?.listData?.length ?? 0;
  const isListMinMet = currentListItems >= listMinItems;

  // For detail-list tasks, find the source task to get items
  const process = useProcessStore.getState().process;
  let sourceItems: string[] = [];
  if (isDetailListType && task?.detailConfig?.sourceTaskId && process) {
    // Find source task by ID
    const findTaskById = (taskId: string): TaskState | null => {
      for (const phase of process.phases || []) {
        const found = phase.tasks?.find(t => t.id === taskId);
        if (found) return found;
        for (const activity of phase.activities || []) {
          const foundInActivity = activity.tasks?.find(t => t.id === taskId);
          if (foundInActivity) return foundInActivity;
        }
      }
      return null;
    };
    
    const sourceTask = findTaskById(task.detailConfig.sourceTaskId);
    if (sourceTask?.listData) {
      sourceItems = sourceTask.listData.map(item => item.value);
    }
  }

  const detailMinItems = sourceItems.length;
  const currentDetailItems = task?.detailData?.filter(d => d.capturedText.trim().length > 0).length ?? 0;
  const isDetailMinMet = currentDetailItems >= detailMinItems;

  // For form tasks, check if all required fields are filled
  const isFormValid = () => {
    if (!isFormType || !task?.formConfig) return true;
    const requiredFields = task.formConfig.fields.filter(f => f.required);
    const filledRequired = requiredFields.filter(f => {
      const value = task.formData?.find(d => d.fieldId === f.id)?.value;
      return value && (!Array.isArray(value) || value.length > 0);
    });
    return filledRequired.length === requiredFields.length;
  };

  // Get templatePath from export-excel task for token replacement in form labels
  const getTemplatePath = (): string | undefined => {
    if (!process) return undefined;
    const phases = process.phases || [];
    
    // Find the export-excel task in the same phase/activity
    const allTasks = activityId 
      ? phases.find(p => p.id === phaseId)?.activities?.find(a => a.id === activityId)?.tasks || []
      : phases.find(p => p.id === phaseId)?.tasks || [];
      
    const exportTask = allTasks.find(t => t.type === 'export-excel' && t.exportConfig);
    return exportTask?.exportConfig?.templatePath;
  };

  const templatePath = getTemplatePath();

  // Check if task requires evidence (text, image, or both) AND is required
  const requiresEvidence = task?.evidenceConfig?.required && (
    task?.evidenceConfig?.type === 'text' || 
    task?.evidenceConfig?.type === 'image' || 
    task?.evidenceConfig?.type === 'both'
  );
  // Check if task specifically requires image evidence AND is required
  const requiresImageEvidence = task?.evidenceConfig?.required && (
    task?.evidenceConfig?.type === 'image' || 
    task?.evidenceConfig?.type === 'both'
  );

  // Handle save progress - open dialog for image evidence, just toast otherwise
  const handleSaveProgress = () => {
    if (requiresImageEvidence) {
      onViewEvidence();
    } else {
      toast.success('Progreso guardado');
    }
  };

  // Handle Excel export for export-excel task type
  const handleExportExcel = async () => {
    try {
      const process = useProcessStore.getState().process;
      if (!process) return;
      
      const reportData = processToReleaseReport(process);
      const variables = process.capturedVariables || {};
      const templatePath = task.exportConfig?.templatePath || '/templates/TEMPLATE_Checklist_Liberacion.xlsx';
      
      const blob = await generateReleaseExcel(templatePath, reportData);
      const filename = generateReleaseFilename(
        process.name || 'process',
        variables.rfc,
        variables.notaInstalacion
      );
      downloadExcel(blob, filename);
      
      // Auto-complete task after successful Excel generation
      if (!task.completed) {
        storeActions.completeTask?.(phaseId, task.id, activityId);
      }
      toast.success('Reporte Excel generado y tarea completada');
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Error al generar el reporte Excel');
    }
  };

  const handleToggleComplete = async () => {
    if (task?.completed) {
      storeActions.uncompleteTask?.(phaseId, task.id, activityId);
      toast.info(t('task.uncompleted'));
    } else {
      // For check/multicheck tasks, verify all required items are checked
      if (isCheckType && !storeActions.canCompleteCheckTask?.(phaseId, task.id, activityId)) {
        toast.warning(t('task.checkItems.required'), {
          description: t('task.checkItems.required.description'),
        });
        return;
      }
      
      // For dynamic-list tasks, verify minimum items
      if (isDynamicListType && !isListMinMet) {
        toast.warning('Lista incompleta', {
          description: `Se requieren al menos ${listMinItems} item(s). Actualmente hay ${currentListItems}.`,
        });
        return;
      }
      
      // For detail-list tasks, verify minimum details
      if (isDetailListType && !isDetailMinMet) {
        toast.warning('Detalles incompletos', {
          description: `Complete todos los detalles (${currentDetailItems}/${detailMinItems}).`,
        });
        return;
      }
      
      // For form tasks, verify all required fields are filled
      if (isFormType && !isFormValid()) {
        toast.warning('Formulario incompleto', {
          description: 'Complete todos los campos requeridos del formulario',
        });
        return;
      }
      
      // For export-excel tasks, generate Excel on completion
      if (isExportExcelType) {
        await handleExportExcel();
        storeActions.completeTask?.(phaseId, task.id, activityId);
        toast.success(t('task.completed'));
        return;
      }
      
      // If task requires evidence (text, image, or both), open evidence modal
      if (requiresEvidence) {
        onViewEvidence();
        return;
      }
      
      if (canCompleteTask(task)) {
        storeActions.completeTask?.(phaseId, task.id, activityId);
        toast.success(t('task.completed'));
      } else {
        toast.warning(t('evidence.required'), {
          description: t('evidence.required.description'),
        });
      }
    }
  };

  const handleToggleCheckItem = (checkItemId: string) => {
    if (task?.completed || task?.isBlocked) return;
    storeActions.toggleCheckItem?.(phaseId, task.id, checkItemId, activityId);
  };

  const isBlocked = task?.isBlocked ?? false;
  const isCompleted = task?.completed ?? false;
  const hasTextEvidence = !!(task?.evidence?.text && task.evidence.text.trim());
  const hasImageEvidence = !!(task?.evidence?.images && task.evidence.images.length > 0);
  
  // For check/multicheck: count checked items
  const checkedCount = task?.checkItems?.filter((item) => item.checked).length ?? 0;
  const totalCheckItems = task?.checkItems?.length ?? 0;
  const requiredCheckedCount = task?.checkItems?.filter((item) => item.required && item.checked).length ?? 0;
  const totalRequiredItems = task?.checkItems?.filter((item) => item.required).length ?? 0;

  return (
    <div
      data-testid="task-card"
      data-task-id={task?.id}
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isCompleted
          ? 'border-green-500 bg-green-50/50'
          : isBlocked
          ? 'border-gray-300 bg-gray-50 opacity-75'
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2 flex-1">
            <button
              onClick={handleToggleComplete}
              disabled={isBlocked}
              data-testid="task-checkbox"
              aria-label={`${isCompleted ? t('task.unmark') : t('task.mark')}: ${task?.name}`}
              aria-pressed={isCompleted}
              aria-disabled={isBlocked}
              role="checkbox"
              aria-checked={isCompleted}
              className="flex-shrink-0 mt-0.5 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-full"
            >
              {isBlocked ? (
                <Lock data-testid="lock-icon" className="w-5 h-5 text-gray-400" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-gray-400 hover:text-blue-500 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className={`text-base font-semibold mb-0.5 ${
                isCompleted ? 'text-green-900' : 'text-gray-900'
              }`}>
                {sanitizeText(task?.name)}
              </h3>
              {task?.description && (
                <p className="text-sm text-gray-600 mb-1">{sanitizeText(task.description)}</p>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                    isCompleted
                      ? 'bg-green-100 text-green-700'
                      : isBlocked
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  {isCompleted ? t('task.completed') : isBlocked ? t('task.blocked') : t('task.pending')}
                </span>

                {/* Task type badge */}
                {isCheckType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs">
                    <ListChecks className="w-3 h-3" />
                    <span>{checkedCount}/{totalCheckItems}</span>
                  </span>
                )}
                
                {/* Export Excel task badge */}
                {isExportExcelType && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded text-xs">
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Excel</span>
                  </span>
                )}
                
                {/* Dynamic List task badge */}
                {isDynamicListType && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                    isListMinMet ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-600'
                  }`}>
                    <List className="w-3 h-3" />
                    <span>{currentListItems}{task?.listConfig?.maxItems ? `/${task.listConfig.maxItems}` : ''}</span>
                  </span>
                )}

                {/* Evidence indicators */}
                {hasTextEvidence && (
                  <span data-testid="evidence-text-badge" className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                    <FileText className="w-3 h-3" />
                  </span>
                )}
                {hasImageEvidence && (
                  <span data-testid="evidence-image-badge" className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                    <ImageIcon className="w-3 h-3" />
                    <span>{task.evidence.images.length}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {isExportExcelType ? (
            <button
              onClick={handleExportExcel}
              disabled={isBlocked}
              data-testid="export-excel-btn"
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${
                isBlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Generar Excel
            </button>
          ) : !isDynamicListType && !isCheckType && (
            <button
              onClick={onViewEvidence}
              disabled={isBlocked}
              data-testid="view-evidence-btn"
              className={`px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                isBlocked 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {t('task.view')}
            </button>
          )}
        </div>

        {/* Dynamic List Input for dynamic-list tasks */}
        {isDynamicListType && task?.listConfig && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <DynamicListInput
              config={task.listConfig}
              items={task.listData || []}
              onItemsChange={handleListDataChange}
              disabled={isCompleted || isBlocked}
            />
            
            {/* Action buttons for dynamic-list tasks */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={isBlocked || isCompleted}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isBlocked || isCompleted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Guardar
              </button>
              <button
                onClick={handleToggleComplete}
                disabled={isBlocked || !isListMinMet}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${
                  isBlocked || !isListMinMet
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isCompleted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? t('task.uncomplete') : t('task.complete')}
              </button>
            </div>
          </div>
        )}

        {/* DetailList for detail-list tasks */}
        {isDetailListType && task?.detailConfig && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <DetailListInput
              config={task.detailConfig}
              sourceItems={sourceItems}
              detailData={task.detailData || []}
              onDetailDataChange={handleDetailDataChange}
              disabled={isCompleted || isBlocked}
            />
            
            {/* Action buttons for detail-list tasks */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={isBlocked || isCompleted}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isBlocked || isCompleted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Guardar
              </button>
              <button
                onClick={handleToggleComplete}
                disabled={isBlocked || !isDetailMinMet}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${
                  isBlocked || !isDetailMinMet
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isCompleted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? t('task.uncomplete') : t('task.complete')}
              </button>
            </div>
          </div>
        )}

        {/* FormRenderer for form tasks */}
        {isFormType && task?.formConfig && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <FormRenderer
              config={task.formConfig}
              data={task.formData || []}
              onDataChange={handleFormDataChange}
              disabled={isCompleted || isBlocked}
              templatePath={templatePath}
            />
            
            {/* Action buttons for form tasks */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={isBlocked || isCompleted}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isBlocked || isCompleted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Guardar
              </button>
              <button
                onClick={handleToggleComplete}
                disabled={isBlocked || !isFormValid()}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${
                  isBlocked || !isFormValid()
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isCompleted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? t('task.uncomplete') : t('task.complete')}
              </button>
            </div>
          </div>
        )}

        {/* CheckItems for check/multicheck tasks */}
        {isCheckType && task?.checkItems && task.checkItems.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="space-y-2">
              {task.checkItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleToggleCheckItem(item.id)}
                  disabled={isCompleted || isBlocked}
                  className={`w-full flex items-start gap-3 p-2 rounded-lg text-left transition-colors ${
                    isCompleted || isBlocked
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {item.checked ? (
                      <CheckSquare className="w-5 h-5 text-green-500" />
                    ) : (
                      <Square className={`w-5 h-5 ${item.required ? 'text-orange-400' : 'text-gray-400'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${item.checked ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                      {sanitizeText(item.description)}
                    </p>
                    <span className={`text-xs ${item.required ? 'text-orange-600' : 'text-gray-400'}`}>
                      {item.required ? t('task.checkItem.required') : t('task.checkItem.optional')}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {totalRequiredItems > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {t('task.checkItems.progress')}: {requiredCheckedCount}/{totalRequiredItems} {t('task.checkItems.requiredCompleted')}
              </p>
            )}
            
            {/* Action buttons for check/multicheck tasks */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={handleSaveProgress}
                disabled={isBlocked || isCompleted}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                  isBlocked || isCompleted
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                Guardar
              </button>
              <button
                onClick={handleToggleComplete}
                disabled={isBlocked || !storeActions.canCompleteCheckTask?.(phaseId, task.id, activityId)}
                className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium flex items-center gap-1.5 ${
                  isBlocked || !storeActions.canCompleteCheckTask?.(phaseId, task.id, activityId)
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isCompleted
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isCompleted ? t('task.uncomplete') : t('task.complete')}
              </button>
            </div>
          </div>
        )}

        {/* References */}
        {task?.references && task.references.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('task.references')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.references.map((ref, idx) => {
                const safeUrl = sanitizeUrl(ref?.url);
                if (!safeUrl) return null;
                return (
                  <a
                    key={idx}
                    href={safeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{sanitizeText(ref?.label)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Dynamic Links */}
        {task?.dynamicLinks && task.dynamicLinks.length > 0 && (
          <DynamicLinksList links={task.dynamicLinks} taskId={task.id} phaseId={phaseId} />
        )}

        {/* Dependencies */}
        {task?.dependencies && task.dependencies.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('task.dependencies')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.dependencies.map((depId) => (
                <span
                  key={depId}
                  className="inline-block px-3 py-1 bg-orange-50 text-orange-700 rounded-lg text-xs font-medium"
                >
                  {depId}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evidence config info */}
        {task?.evidenceConfig?.required && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-red-600">{t('evidence.required')}</span>
              {' '}- Tipo: {task.evidenceConfig.type}
              {task.evidenceConfig.description && ` - ${sanitizeText(task.evidenceConfig.description)}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(TaskCard);
