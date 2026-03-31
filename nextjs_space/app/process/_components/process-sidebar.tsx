'use client';

import { useProcessStore } from '@/lib/store';
import { CheckCircle2, Circle } from 'lucide-react';

export default function ProcessSidebar() {
  const process = useProcessStore((state) => state?.process);
  const currentPhaseId = useProcessStore((state) => state?.currentPhaseId);
  const setCurrentPhase = useProcessStore((state) => state?.setCurrentPhase);

  if (!process) return null;

  return (
    <aside data-testid="process-sidebar" className="w-72 bg-white border-r border-gray-200 min-h-[calc(100vh-130px)] p-4">
      <h3 className="text-base font-bold text-gray-900 mb-3">Fases</h3>
      
      <div className="space-y-1.5">
        {process.phases?.map((phase, index) => {
          const isActive = phase?.id === currentPhaseId;
          const isCompleted = (phase?.progress ?? 0) === 1;
          const completedTasks = phase?.tasks?.filter((t) => t?.completed).length ?? 0;
          const totalTasks = phase?.tasks?.length ?? 0;

          return (
            <button
              key={phase?.id}
              onClick={() => setCurrentPhase?.(phase?.id ?? '')}
              data-testid={`phase-${phase?.id}`}
              className={`w-full text-left p-3 rounded-lg transition-all ${
                isActive
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Circle className={`w-4 h-4 ${
                      isActive ? 'text-blue-500' : 'text-gray-400'
                    }`} />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-xs font-semibold text-gray-500">
                      {index + 1}
                    </span>
                    <h4 className={`text-sm font-semibold truncate ${
                      isActive ? 'text-blue-900' : 'text-gray-900'
                    }`}>
                      {phase?.name}
                    </h4>
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    {completedTasks}/{totalTasks} tareas
                  </p>
                  
                  {/* Mini progress bar */}
                  <div data-testid="sidebar-progress" className="mt-1.5 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${(phase?.progress ?? 0) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </button>
          );
        }) ?? null}
      </div>
    </aside>
  );
}
