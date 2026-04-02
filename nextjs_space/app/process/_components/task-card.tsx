'use client';

import { TaskState, CheckItemState } from '@/lib/types';
import { useProcessStore } from '@/lib/store';
import { canCompleteTask } from '@/lib/helpers';
import { useI18n } from '@/lib/i18n-context';
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize';
import { CheckCircle2, Circle, Lock, ExternalLink, FileText, Image as ImageIcon, Square, CheckSquare, ListChecks } from 'lucide-react';
import { toast } from 'sonner';
import { DynamicLinksList } from './dynamic-link-button';

interface TaskCardProps {
  task: TaskState;
  phaseId: string;
  activityId?: string;
  onViewEvidence: () => void;
}

export default function TaskCard({ task, phaseId, activityId, onViewEvidence }: TaskCardProps) {
  const { t } = useI18n();
  const completeTask = useProcessStore((state) => state?.completeTask);
  const uncompleteTask = useProcessStore((state) => state?.uncompleteTask);
  const toggleCheckItem = useProcessStore((state) => state?.toggleCheckItem);
  const canCompleteCheckTask = useProcessStore((state) => state?.canCompleteCheckTask);

  const taskType = task?.type || 'standard';
  const isCheckType = taskType === 'check' || taskType === 'multicheck';

  const handleToggleComplete = () => {
    if (task?.completed) {
      uncompleteTask?.(phaseId, task.id, activityId);
      toast.info(t('task.uncompleted'));
    } else {
      // For check/multicheck tasks, verify all required items are checked
      if (isCheckType && !canCompleteCheckTask?.(phaseId, task.id, activityId)) {
        toast.warning(t('task.checkItems.required'), {
          description: t('task.checkItems.required.description'),
        });
        return;
      }
      if (canCompleteTask(task)) {
        completeTask?.(phaseId, task.id, activityId);
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
    toggleCheckItem?.(phaseId, task.id, checkItemId, activityId);
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
      data-testid={`task-card-${task?.id}`}
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

          <button
            onClick={onViewEvidence}
            data-testid="view-evidence-btn"
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
          >
            {t('task.view')}
          </button>
        </div>

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
