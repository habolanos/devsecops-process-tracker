import { ProcessState, PhaseState, TaskState, ActivityState } from './types';

export function calculateTaskProgress(tasks: TaskState[]): number {
  if (!tasks || tasks.length === 0) return 0;
  const completed = tasks.filter((t) => t?.completed).length;
  return completed / tasks.length;
}

export function calculateActivityProgress(activity: ActivityState): number {
  return calculateTaskProgress(activity?.tasks ?? []);
}

export function calculatePhaseProgress(phase: PhaseState): number {
  // Get all tasks from both activities and direct tasks
  const allTasks = getAllTasksFromPhase(phase);
  return calculateTaskProgress(allTasks);
}

export function getAllTasksFromPhase(phase: PhaseState): TaskState[] {
  const tasksFromActivities = (phase?.activities ?? []).flatMap(a => a?.tasks ?? []);
  const directTasks = phase?.tasks ?? [];
  return [...tasksFromActivities, ...directTasks];
}

export function calculateProcessProgress(process: ProcessState): number {
  if (!process?.phases || process.phases.length === 0) return 0;
  
  // Get all tasks from all phases (including activities)
  const allTasks = process.phases.flatMap(p => getAllTasksFromPhase(p));
  const totalTasks = allTasks.length;
  
  if (totalTasks === 0) return 0;
  const completedTasks = allTasks.filter(t => t?.completed).length;
  return completedTasks / totalTasks;
}

export function updateProgress(process: ProcessState): ProcessState {
  const updatedPhases = process.phases.map((phase) => {
    // Update activity progress
    const updatedActivities = (phase.activities ?? []).map((activity) => ({
      ...activity,
      progress: calculateActivityProgress(activity)
    }));
    
    return {
      ...phase,
      activities: updatedActivities,
      progress: calculatePhaseProgress({ ...phase, activities: updatedActivities })
    };
  });

  return {
    ...process,
    phases: updatedPhases,
    progress: calculateProcessProgress({ ...process, phases: updatedPhases })
  };
}

export function findTaskInProcess(taskId: string, process: ProcessState): TaskState | undefined {
  for (const phase of process.phases) {
    // Search in direct tasks
    const directTask = phase?.tasks?.find((t) => t?.id === taskId);
    if (directTask) return directTask;
    
    // Search in activities
    for (const activity of phase?.activities ?? []) {
      const activityTask = activity?.tasks?.find((t) => t?.id === taskId);
      if (activityTask) return activityTask;
    }
  }
  return undefined;
}

export function checkTaskDependencies(
  taskId: string,
  phaseId: string,
  process: ProcessState,
  activityId?: string
): boolean {
  const phase = process.phases.find((p) => p?.id === phaseId);
  if (!phase) return false;

  // Find task either in activity or direct tasks
  let task: TaskState | undefined;
  if (activityId) {
    const activity = phase.activities?.find((a) => a?.id === activityId);
    task = activity?.tasks?.find((t) => t?.id === taskId);
  } else {
    task = phase.tasks?.find((t) => t?.id === taskId);
  }
  
  if (!task || !task.dependencies || task.dependencies.length === 0) {
    return false; // No blocking
  }

  // Check if all dependencies are completed
  for (const depId of task.dependencies) {
    const depTask = findTaskInProcess(depId, process);
    if (!depTask || !depTask.completed) {
      return true; // Blocked
    }
  }

  return false; // Not blocked
}

export function updateTaskBlockedStatus(process: ProcessState): ProcessState {
  const updatedPhases = process.phases.map((phase) => {
    // Update blocked status for tasks in activities
    const updatedActivities = (phase.activities ?? []).map((activity) => ({
      ...activity,
      tasks: activity.tasks.map((task) => ({
        ...task,
        isBlocked: checkTaskDependencies(task.id, phase.id, process, activity.id)
      }))
    }));
    
    // Update blocked status for direct tasks
    const updatedTasks = (phase.tasks ?? []).map((task) => ({
      ...task,
      isBlocked: checkTaskDependencies(task.id, phase.id, process)
    }));
    
    return {
      ...phase,
      activities: updatedActivities,
      tasks: updatedTasks
    };
  });

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

// ============================================
// Time Formatting Helpers
// ============================================

export function formatDuration(ms: number): string {
  if (ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const pad = (n: number) => n.toString().padStart(2, '0');
  
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function formatDurationLong(ms: number): string {
  if (ms < 0) ms = 0;
  
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);
  
  return parts.join(' ');
}

export function calculateTaskDuration(
  task: TaskState,
  previousCompletedAt: string | null,
  processStartedAt: string | null
): number {
  if (!task.completedAt) return 0;
  
  const taskCompleted = new Date(task.completedAt).getTime();
  const referenceTime = previousCompletedAt 
    ? new Date(previousCompletedAt).getTime()
    : processStartedAt 
      ? new Date(processStartedAt).getTime()
      : taskCompleted;
  
  return Math.max(0, taskCompleted - referenceTime);
}
