'use client';
// TanStack Virtual's useVirtualizer exposes functions that React Compiler
// cannot safely memoize (stale UI risk). Opt out of auto-memoization for
// this component — the ESLint rule react-hooks/incompatible-library honors
// the directive and silences the informational warning.
'use no memo';

import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { TaskState } from '@/lib/types';
import TaskCard from '@/app/process/_components/task-card';

interface VirtualizedTaskListProps {
  tasks: TaskState[];
  phaseId: string;
  onViewEvidence: (taskId: string) => void;
  estimatedTaskHeight?: number;
}

export default function VirtualizedTaskList({
  tasks,
  phaseId,
  onViewEvidence,
  estimatedTaskHeight = 180,
}: VirtualizedTaskListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => estimatedTaskHeight, [estimatedTaskHeight]),
    overscan: 3,
  });

  const virtualItems = virtualizer.getVirtualItems();

  // If few tasks, render normally without virtualization
  if (tasks.length <= 10) {
    return (
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            phaseId={phaseId}
            onViewEvidence={() => onViewEvidence(task.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-300px)] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const task = tasks[virtualItem.index];
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <div className="pb-4">
                <TaskCard
                  task={task}
                  phaseId={phaseId}
                  onViewEvidence={() => onViewEvidence(task.id)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
