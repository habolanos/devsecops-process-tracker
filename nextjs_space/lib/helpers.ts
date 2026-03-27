import { ProcessState, PhaseState, TaskState } from './types';

export function calculateTaskProgress(tasks: TaskState[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t?.completed).length;
  return completed / tasks.length;
}

export function calculatePhaseProgress(phase: PhaseState): number {
  return calculateTaskProgress(phase?.tasks ?? []);
}

export function calculateProcessProgress(process: ProcessState): number {
  if (!process?.phases || process.phases.length === 0) return 0;
  const totalTasks = process.phases.reduce((sum, p) => sum + (p?.tasks?.length ?? 0), 0);
  if (totalTasks === 0) return 0;
  const completedTasks = process.phases.reduce(
    (sum, p) => sum + (p?.tasks?.filter((t) => t?.completed).length ?? 0),
    0
  );
  return completedTasks / totalTasks;
}

export function updateProgress(process: ProcessState): ProcessState {
  const updatedPhases = process.phases.map((phase) => ({
    ...phase,
    progress: calculatePhaseProgress(phase)
  }));

  return {
    ...process,
    phases: updatedPhases,
    progress: calculateProcessProgress({ ...process, phases: updatedPhases })
  };
}

export function checkTaskDependencies(
  taskId: string,
  phaseId: string,
  process: ProcessState
): boolean {
  const phase = process.phases.find((p) => p?.id === phaseId);
  if (!phase) return false;

  const task = phase.tasks.find((t) => t?.id === taskId);
  if (!task || !task.dependencies || task.dependencies.length === 0) {
    return false; // No blocking
  }

  // Check if all dependencies are completed
  for (const depId of task.dependencies) {
    let depCompleted = false;
    
    // Search for dependency in all phases
    for (const p of process.phases) {
      const depTask = p?.tasks?.find((t) => t?.id === depId);
      if (depTask) {
        depCompleted = depTask.completed ?? false;
        break;
      }
    }

    if (!depCompleted) {
      return true; // Blocked
    }
  }

  return false; // Not blocked
}

export function updateTaskBlockedStatus(process: ProcessState): ProcessState {
  const updatedPhases = process.phases.map((phase) => ({
    ...phase,
    tasks: phase.tasks.map((task) => ({
      ...task,
      isBlocked: checkTaskDependencies(task.id, phase.id, process)
    }))
  }));

  return {
    ...process,
    phases: updatedPhases
  };
}

export function validateTaskEvidence(task: TaskState): boolean {
  if (!task?.evidenceConfig?.required) return true;

  const { type } = task.evidenceConfig;
  const { text, images } = task?.evidence ?? {};

  switch (type) {
    case 'text':
      return !!(text && text.trim().length > 0);
    case 'image':
      return !!(images && images.length > 0);
    case 'both':
      return !!(
        text &&
        text.trim().length > 0 &&
        images &&
        images.length > 0
      );
    default:
      return true;
  }
}

export function canCompleteTask(task: TaskState): boolean {
  if (task?.isBlocked) return false;
  return validateTaskEvidence(task);
}
