// ============================================================================
// Process progress merger
// ============================================================================
// When a process YAML is re-fetched (e.g. after a structural change like the
// addition of `completionAlert`, new tasks, or updated labels) we MUST NOT
// discard the user's in-flight progress that Zustand persisted in
// localStorage.
//
// This module extracts the user-owned fields from a persisted `ProcessState`
// and overlays them onto a freshly-parsed `ProcessState` coming from the
// YAML, keeping the YAML as the structural source of truth.
//
// The merge is conservative: if a task/checkItem/subprocess from the
// persisted state is missing in the new YAML (removed or renamed), its
// progress is silently dropped. New structural items added by the YAML
// simply start with their default (uncompleted) state.
// ============================================================================

import {
  ProcessState,
  PhaseState,
  ActivityState,
  TaskState,
  SubprocessState,
  CheckItemState,
  CapturedVariables,
  ProcessTimeTracking,
  ProcessAuthor,
  TaskEvidence,
  ListItem,
  DetailItem,
  FormFieldValue,
} from './types';

// ---- Per-task progress envelope -------------------------------------------

interface TaskProgress {
  completed: boolean;
  completedAt?: string;
  evidence: TaskEvidence;
  listData?: ListItem[];
  detailData?: DetailItem[];
  formData?: FormFieldValue[];
  checkItems: Record<string, { checked: boolean; checkedAt?: string }>;
}

interface SubprocessProgress {
  status: SubprocessState['status'];
  variables: Record<string, string>;
  error?: string;
}

/**
 * User-owned progress snapshot extracted from a `ProcessState`. Structural
 * fields (names, descriptions, dependencies, configs, completionAlert, ...)
 * are intentionally excluded.
 */
export interface ProcessProgress {
  processId: string;
  capturedVariables: CapturedVariables;
  timeTracking: ProcessTimeTracking;
  loadedAt?: string;
  exportedAt?: string;
  completedAt?: string;
  author?: ProcessAuthor;
  /** Keyed by task id for O(1) lookup during overlay. */
  tasks: Record<string, TaskProgress>;
  /** Keyed by subprocess id. */
  subprocesses: Record<string, SubprocessProgress>;
}

// ---- Extraction ------------------------------------------------------------

function collectTasks(process: ProcessState): TaskState[] {
  const out: TaskState[] = [];
  for (const phase of process.phases ?? []) {
    for (const t of phase.tasks ?? []) out.push(t);
    for (const act of phase.activities ?? []) {
      for (const t of act.tasks ?? []) out.push(t);
    }
  }
  return out;
}

function extractTaskProgress(task: TaskState): TaskProgress {
  const checkItems: TaskProgress['checkItems'] = {};
  for (const ci of task.checkItems ?? []) {
    checkItems[ci.id] = { checked: !!ci.checked, checkedAt: ci.checkedAt };
  }
  return {
    completed: !!task.completed,
    completedAt: task.completedAt,
    evidence: task.evidence ?? { images: [] },
    listData: task.listData,
    detailData: task.detailData,
    formData: task.formData,
    checkItems,
  };
}

/**
 * Extract a pure progress snapshot from a fully-hydrated `ProcessState`.
 * This is what should be persisted (after partialize) instead of the whole
 * process tree.
 */
export function extractProgress(process: ProcessState): ProcessProgress {
  const tasks: ProcessProgress['tasks'] = {};
  for (const t of collectTasks(process)) {
    tasks[t.id] = extractTaskProgress(t);
  }
  const subprocesses: ProcessProgress['subprocesses'] = {};
  for (const sp of process.subprocesses ?? []) {
    subprocesses[sp.id] = {
      status: sp.status,
      variables: sp.variables ?? {},
      error: sp.error,
    };
  }
  return {
    processId: process.id,
    capturedVariables: process.capturedVariables ?? {},
    timeTracking: process.timeTracking,
    loadedAt: process.loadedAt,
    exportedAt: process.exportedAt,
    completedAt: process.completedAt,
    author: process.author,
    tasks,
    subprocesses,
  };
}

// ---- Overlay ---------------------------------------------------------------

function overlayCheckItems(
  freshItems: CheckItemState[],
  saved: TaskProgress['checkItems'] | undefined,
): CheckItemState[] {
  if (!saved) return freshItems;
  return freshItems.map((item) => {
    const s = saved[item.id];
    if (!s) return item;
    return { ...item, checked: !!s.checked, checkedAt: s.checkedAt };
  });
}

function overlayTask(task: TaskState, saved: TaskProgress | undefined): TaskState {
  if (!saved) return task;
  return {
    ...task,
    completed: saved.completed,
    completedAt: saved.completedAt,
    evidence: saved.evidence ?? task.evidence,
    listData: saved.listData ?? task.listData,
    detailData: saved.detailData ?? task.detailData,
    formData: saved.formData ?? task.formData,
    checkItems: overlayCheckItems(task.checkItems ?? [], saved.checkItems),
  };
}

function overlayActivity(
  activity: ActivityState,
  progress: ProcessProgress,
): ActivityState {
  return {
    ...activity,
    tasks: (activity.tasks ?? []).map((t) => overlayTask(t, progress.tasks[t.id])),
  };
}

function overlayPhase(phase: PhaseState, progress: ProcessProgress): PhaseState {
  return {
    ...phase,
    tasks: (phase.tasks ?? []).map((t) => overlayTask(t, progress.tasks[t.id])),
    activities: (phase.activities ?? []).map((a) => overlayActivity(a, progress)),
  };
}

function overlaySubprocess(
  sub: SubprocessState,
  saved: SubprocessProgress | undefined,
): SubprocessState {
  if (!saved) return sub;
  return {
    ...sub,
    status: saved.status,
    variables: { ...(sub.variables ?? {}), ...(saved.variables ?? {}) },
    error: saved.error,
  };
}

/**
 * Returns a new `ProcessState` that preserves the structure of `fresh`
 * (parsed from the YAML source of truth) while copying every user-owned
 * field from `progress`. Progress for items no longer present in `fresh`
 * is dropped.
 */
export function mergeProgressIntoFresh(
  fresh: ProcessState,
  progress: ProcessProgress,
): ProcessState {
  if (fresh.id !== progress.processId) {
    // Safety net: do not cross-pollinate progress between different processes.
    return fresh;
  }
  return {
    ...fresh,
    capturedVariables: { ...(fresh.capturedVariables ?? {}), ...progress.capturedVariables },
    timeTracking: progress.timeTracking ?? fresh.timeTracking,
    loadedAt: progress.loadedAt ?? fresh.loadedAt,
    exportedAt: progress.exportedAt,
    completedAt: progress.completedAt,
    author: progress.author ?? fresh.author,
    phases: fresh.phases.map((p) => overlayPhase(p, progress)),
    subprocesses: (fresh.subprocesses ?? []).map((sp) =>
      overlaySubprocess(sp, progress.subprocesses[sp.id]),
    ),
  };
}
