'use client';

import { useState } from 'react';
import { ActivityState, TaskState } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';
import { sanitizeText, sanitizeUrl } from '@/lib/sanitize';
import { 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Image as ImageIcon,
  FolderOpen
} from 'lucide-react';
import TaskCard from './task-card';
import { DynamicLinksList } from './dynamic-link-button';

interface ActivityCardProps {
  activity: ActivityState;
  phaseId: string;
  onViewEvidence: (task: TaskState) => void;
}

export default function ActivityCard({ activity, phaseId, onViewEvidence }: ActivityCardProps) {
  const { t } = useI18n();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  const completedTasks = activity.tasks?.filter((t) => t.completed).length ?? 0;
  const totalTasks = activity.tasks?.length ?? 0;
  const isCompleted = totalTasks > 0 && completedTasks === totalTasks;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  return (
    <div
      data-testid={`activity-card-${activity.id}`}
      className={`bg-white rounded-xl shadow-sm border-2 transition-all ${
        isCompleted
          ? 'border-green-400 bg-green-50/30'
          : 'border-indigo-200 hover:shadow-md'
      }`}
    >
      {/* Activity Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-start justify-between text-left"
      >
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 mt-1">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <FolderOpen className="w-5 h-5 text-indigo-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`text-lg font-semibold ${
                isCompleted ? 'text-green-900' : 'text-gray-900'
              }`}>
                {sanitizeText(activity.name)}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                isCompleted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-indigo-100 text-indigo-700'
              }`}>
                {completedTasks}/{totalTasks} {t('activity.tasks')}
              </span>
            </div>
            
            {activity.description && (
              <p className="text-sm text-gray-600 mb-2">{sanitizeText(activity.description)}</p>
            )}
            
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-indigo-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        
        <div className="flex-shrink-0 ml-3">
          {isExpanded ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4">
          {/* Activity Images */}
          {activity.images && activity.images.length > 0 && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4" />
                {t('activity.images')}
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {activity.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowImageModal(img.url);
                    }}
                    className="aspect-video bg-gray-200 rounded-lg overflow-hidden hover:ring-2 hover:ring-indigo-400 transition-all"
                  >
                    <img
                      src={sanitizeUrl(img.url) || ''}
                      alt={sanitizeText(img.name) || `Image ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Activity Dynamic Links */}
          {activity.dynamicLinks && activity.dynamicLinks.length > 0 && (
            <div className="p-3 bg-indigo-50 rounded-lg">
              <DynamicLinksList 
                links={activity.dynamicLinks} 
                phaseId={phaseId}
              />
            </div>
          )}

          {/* Tasks */}
          <div className="space-y-3 pt-2">
            {activity.tasks?.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                phaseId={phaseId}
                activityId={activity.id}
                onViewEvidence={() => onViewEvidence(task)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setShowImageModal(null)}
        >
          <div className="max-w-4xl max-h-[90vh] overflow-auto">
            <img
              src={sanitizeUrl(showImageModal) || ''}
              alt="Activity illustration"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
