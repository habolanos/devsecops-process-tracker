'use client';

import { TaskState } from '@/lib/types';
import { useProcessStore } from '@/lib/store';
import { canCompleteTask } from '@/lib/helpers';
import { useI18n } from '@/lib/i18n-context';
import { CheckCircle2, Circle, Lock, ExternalLink, FileText, Image as ImageIcon } from 'lucide-react';

interface TaskCardProps {
  task: TaskState;
  phaseId: string;
  onViewEvidence: () => void;
}

export default function TaskCard({ task, phaseId, onViewEvidence }: TaskCardProps) {
  const { t } = useI18n();
  const completeTask = useProcessStore((state) => state?.completeTask);
  const uncompleteTask = useProcessStore((state) => state?.uncompleteTask);

  const handleToggleComplete = () => {
    if (task?.completed) {
      uncompleteTask?.(phaseId, task.id);
    } else {
      if (canCompleteTask(task)) {
        completeTask?.(phaseId, task.id);
      } else {
        alert(t('evidence.required'));
      }
    }
  };

  const isBlocked = task?.isBlocked ?? false;
  const isCompleted = task?.completed ?? false;
  const hasTextEvidence = !!(task?.evidence?.text && task.evidence.text.trim());
  const hasImageEvidence = !!(task?.evidence?.images && task.evidence.images.length > 0);

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border-2 transition-all ${
        isCompleted
          ? 'border-green-500 bg-green-50/50'
          : isBlocked
          ? 'border-gray-300 bg-gray-50 opacity-75'
          : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <button
              onClick={handleToggleComplete}
              disabled={isBlocked}
              className="flex-shrink-0 mt-1 disabled:cursor-not-allowed"
            >
              {isBlocked ? (
                <Lock className="w-6 h-6 text-gray-400" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 hover:text-blue-500 transition-colors" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-semibold mb-1 ${
                isCompleted ? 'text-green-900' : 'text-gray-900'
              }`}>
                {task?.name}
              </h3>
              {task?.description && (
                <p className="text-sm text-gray-600 mb-2">{task.description}</p>
              )}

              {/* Status Badge */}
              <div className="flex items-center gap-2 mt-2">
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

                {/* Evidence indicators */}
                {hasTextEvidence && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">
                    <FileText className="w-3 h-3" />
                  </span>
                )}
                {hasImageEvidence && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded text-xs">
                    <ImageIcon className="w-3 h-3" />
                    <span>{task.evidence.images.length}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onViewEvidence}
            className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors text-sm font-medium"
          >
            {t('task.view')}
          </button>
        </div>

        {/* References */}
        {task?.references && task.references.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              {t('task.references')}
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{ref?.label}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {task?.dependencies && task.dependencies.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              <span className="font-semibold text-red-600">{t('evidence.required')}</span>
              {' '}- Tipo: {task.evidenceConfig.type}
              {task.evidenceConfig.description && ` - ${task.evidenceConfig.description}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
