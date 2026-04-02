'use client';

import { useProcessStore } from '@/lib/store';
import { CheckCircle2, Circle, Link2, ChevronDown, ChevronRight, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { getAllTasksFromPhase } from '@/lib/helpers';

export default function ProcessSidebar() {
  const process = useProcessStore((state) => state?.process);
  const currentPhaseId = useProcessStore((state) => state?.currentPhaseId);
  const currentActivityId = useProcessStore((state) => state?.currentActivityId);
  const setCurrentPhase = useProcessStore((state) => state?.setCurrentPhase);
  const setCurrentActivity = useProcessStore((state) => state?.setCurrentActivity);
  
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  if (!process) return null;

  const togglePhaseExpand = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  // Combine phases and subprocesses, sorted by order
  const allItems = [
    ...process.phases.map((p) => ({ ...p, type: 'phase' as const })),
    ...(process.subprocesses ?? []).map((s) => ({ ...s, type: 'subprocess' as const })),
  ].sort((a, b) => a.order - b.order);

  return (
    <aside data-testid="process-sidebar" className="w-72 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 min-h-[calc(100vh-130px)] p-4">
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-3">Fases</h3>
      
      <div className="space-y-1.5">
        {allItems.map((item, index) => {
          if (item.type === 'subprocess') {
            // Render subprocess item
            const subprocess = item;
            return (
              <div
                key={subprocess.id}
                className="w-full text-left p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800"
              >
                <div className="flex items-start gap-2">
                  <Link2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                        🔗
                      </span>
                      <h4 className="text-sm font-semibold truncate text-purple-900 dark:text-purple-100">
                        {subprocess.name}
                      </h4>
                    </div>
                    <p className="text-xs text-purple-600 dark:text-purple-400">
                      {subprocess.optional ? 'Opcional' : 'Requerido'} • {subprocess.status}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Render phase item
          const phase = item;
          const isActive = phase.id === currentPhaseId;
          const isCompleted = (phase.progress ?? 0) === 1;
          const allTasks = getAllTasksFromPhase(phase);
          const completedTasks = allTasks.filter((t) => t?.completed).length;
          const totalTasks = allTasks.length;
          const hasActivities = (phase.activities?.length ?? 0) > 0;
          const isExpanded = expandedPhases.has(phase.id);

          return (
            <div key={phase.id} className="space-y-1">
              <button
                onClick={() => {
                  setCurrentPhase?.(phase.id);
                  if (hasActivities) togglePhaseExpand(phase.id);
                }}
                data-testid={`phase-${phase.id}`}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                    : 'bg-gray-50 dark:bg-slate-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className={`w-4 h-4 ${
                        isActive ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'
                      }`} />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {hasActivities && (
                        <span className="text-gray-400">
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </span>
                      <h4 className={`text-sm font-semibold truncate ${
                        isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {phase.name}
                      </h4>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {completedTasks}/{totalTasks} tareas
                      {hasActivities && ` • ${phase.activities?.length} actividades`}
                    </p>
                    
                    {/* Mini progress bar */}
                    <div data-testid="sidebar-progress" className="mt-1.5 h-1 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isCompleted ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(phase.progress ?? 0) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </button>

              {/* Activities list (expandable) */}
              {hasActivities && isExpanded && (
                <div className="ml-4 pl-2 border-l-2 border-gray-200 dark:border-slate-600 space-y-1">
                  {phase.activities?.map((activity) => {
                    const activityCompleted = activity.tasks?.every((t) => t.completed);
                    const activityTasks = activity.tasks?.length ?? 0;
                    const activityCompletedTasks = activity.tasks?.filter((t) => t.completed).length ?? 0;
                    const isActivityActive = currentActivityId === activity.id;

                    return (
                      <button
                        key={activity.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentActivity?.(activity.id);
                        }}
                        className={`w-full text-left p-2 rounded-md transition-all ${
                          isActivityActive
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-400'
                            : 'bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FolderOpen className={`w-3.5 h-3.5 ${
                            activityCompleted ? 'text-green-500' : 'text-indigo-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-medium truncate text-gray-800 dark:text-gray-200">
                              {activity.name}
                            </h5>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {activityCompletedTasks}/{activityTasks} tareas
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
