import { describe, it, expect } from 'vitest';
import { extractProgress, mergeProgressIntoFresh } from '@/lib/process-merge';
import type {
  ProcessState,
  TaskState,
  PhaseState,
  ActivityState,
  CheckItemState,
} from '@/lib/types';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<TaskState> = {}): TaskState {
  return {
    id: overrides.id ?? 'task-1',
    name: overrides.name ?? 'Task 1',
    description: overrides.description ?? '',
    order: overrides.order ?? 1,
    type: overrides.type ?? 'standard',
    checkItems: overrides.checkItems ?? [],
    references: overrides.references ?? [],
    evidenceConfig: overrides.evidenceConfig ?? { type: 'text', required: false },
    dependencies: overrides.dependencies ?? [],
    completed: overrides.completed ?? false,
    completedAt: overrides.completedAt,
    evidence: overrides.evidence ?? { images: [] },
    isBlocked: overrides.isBlocked ?? false,
    dynamicLinks: overrides.dynamicLinks ?? [],
    listData: overrides.listData,
    detailData: overrides.detailData,
    formData: overrides.formData,
    completionAlert: overrides.completionAlert,
  };
}

function makePhase(tasks: TaskState[], overrides: Partial<PhaseState> = {}): PhaseState {
  return {
    id: overrides.id ?? 'phase-1',
    name: overrides.name ?? 'Phase 1',
    description: overrides.description ?? '',
    order: overrides.order ?? 1,
    progress: overrides.progress ?? 0,
    activities: overrides.activities ?? [],
    tasks,
    dynamicLinks: overrides.dynamicLinks ?? [],
  };
}

function makeProcess(phases: PhaseState[], overrides: Partial<ProcessState> = {}): ProcessState {
  return {
    id: overrides.id ?? 'proc-1',
    name: overrides.name ?? 'Proc',
    description: overrides.description ?? '',
    version: overrides.version ?? '1.0.0',
    loadedAt: overrides.loadedAt ?? '2026-01-01T00:00:00Z',
    progress: overrides.progress ?? 0,
    phases,
    subprocesses: overrides.subprocesses ?? [],
    variableDefinitions: overrides.variableDefinitions ?? [],
    capturedVariables: overrides.capturedVariables ?? {},
    timeTracking: overrides.timeTracking ?? {
      status: 'idle',
      sessions: [],
      totalActiveTime: 0,
    },
    author: overrides.author,
    export: overrides.export,
  };
}

// ---------------------------------------------------------------------------
// extractProgress
// ---------------------------------------------------------------------------

describe('extractProgress', () => {
  it('captures per-task progress across both direct tasks and activity tasks', () => {
    const directTask = makeTask({
      id: 'direct',
      completed: true,
      completedAt: '2026-01-02T10:00:00Z',
      evidence: { text: 'done', images: [] },
    });
    const activityTask = makeTask({
      id: 'act-task',
      listData: [{ id: 'l1', value: 'a', addedAt: '2026-01-02T09:30:00Z' }],
    });
    const activity: ActivityState = {
      id: 'act-1',
      name: 'Act',
      description: '',
      order: 1,
      progress: 0,
      tasks: [activityTask],
      dynamicLinks: [],
      images: [],
    };
    const phase = makePhase([directTask], { activities: [activity] });
    const process = makeProcess([phase], {
      capturedVariables: { env: 'prod' },
      timeTracking: {
        status: 'running',
        sessions: [],
        totalActiveTime: 12345,
        currentSessionStart: '2026-01-02T09:00:00Z',
      },
    });

    const snap = extractProgress(process);

    expect(snap.processId).toBe('proc-1');
    expect(snap.capturedVariables).toEqual({ env: 'prod' });
    expect(snap.timeTracking.totalActiveTime).toBe(12345);
    expect(snap.tasks.direct).toMatchObject({
      completed: true,
      completedAt: '2026-01-02T10:00:00Z',
      evidence: { text: 'done', images: [] },
    });
    expect(snap.tasks['act-task'].listData).toEqual([
      { id: 'l1', value: 'a', addedAt: '2026-01-02T09:30:00Z' },
    ]);
  });

  it('keys checkItems by id with their checked state', () => {
    const checkItems: CheckItemState[] = [
      { id: 'ci-1', description: 'a', required: true, checked: true, checkedAt: 't1' },
      { id: 'ci-2', description: 'b', required: false, checked: false },
    ];
    const task = makeTask({ id: 't', type: 'multicheck', checkItems });
    const snap = extractProgress(makeProcess([makePhase([task])]));
    expect(snap.tasks.t.checkItems).toEqual({
      'ci-1': { checked: true, checkedAt: 't1' },
      'ci-2': { checked: false, checkedAt: undefined },
    });
  });
});

// ---------------------------------------------------------------------------
// mergeProgressIntoFresh
// ---------------------------------------------------------------------------

describe('mergeProgressIntoFresh', () => {
  it('preserves user progress while taking structure from the fresh YAML', () => {
    const persisted = makeProcess(
      [
        makePhase([
          // Persisted task lacks completionAlert (old YAML snapshot).
          makeTask({
            id: 't1',
            name: 'OLD NAME',
            completed: true,
            completedAt: '2026-01-01T12:00:00Z',
            evidence: { text: 'evidence text', images: [] },
          }),
        ]),
      ],
      { capturedVariables: { env: 'prod' } },
    );

    const fresh = makeProcess(
      [
        makePhase([
          // Fresh task has the new completionAlert field and a renamed label.
          makeTask({
            id: 't1',
            name: 'NEW NAME',
            completionAlert: {
              severity: 'critical',
              description: 'Confirm before proceeding',
            },
          }),
        ]),
      ],
      { capturedVariables: {} },
    );

    const progress = extractProgress(persisted);
    const merged = mergeProgressIntoFresh(fresh, progress);

    const t1 = merged.phases[0].tasks[0];
    // Structure comes from fresh:
    expect(t1.name).toBe('NEW NAME');
    expect(t1.completionAlert).toEqual({
      severity: 'critical',
      description: 'Confirm before proceeding',
    });
    // Progress comes from persisted:
    expect(t1.completed).toBe(true);
    expect(t1.completedAt).toBe('2026-01-01T12:00:00Z');
    expect(t1.evidence.text).toBe('evidence text');
    expect(merged.capturedVariables).toEqual({ env: 'prod' });
  });

  it('drops progress for tasks that no longer exist in the fresh YAML', () => {
    const persisted = makeProcess([
      makePhase([
        makeTask({ id: 'ghost', completed: true }),
        makeTask({ id: 'keep', completed: true }),
      ]),
    ]);
    const fresh = makeProcess([makePhase([makeTask({ id: 'keep' })])]);
    const merged = mergeProgressIntoFresh(fresh, extractProgress(persisted));
    expect(merged.phases[0].tasks).toHaveLength(1);
    expect(merged.phases[0].tasks[0].id).toBe('keep');
    expect(merged.phases[0].tasks[0].completed).toBe(true);
  });

  it('leaves new tasks (absent in persisted) with their fresh defaults', () => {
    const persisted = makeProcess([makePhase([makeTask({ id: 't1', completed: true })])]);
    const fresh = makeProcess([
      makePhase([
        makeTask({ id: 't1' }),
        makeTask({ id: 't2-new' }),
      ]),
    ]);
    const merged = mergeProgressIntoFresh(fresh, extractProgress(persisted));
    const [t1, t2] = merged.phases[0].tasks;
    expect(t1.completed).toBe(true);
    expect(t2.completed).toBe(false);
  });

  it('refuses to merge when process ids differ (safety net)', () => {
    const persisted = makeProcess([makePhase([makeTask({ id: 't', completed: true })])], {
      id: 'proc-OLD',
    });
    const fresh = makeProcess([makePhase([makeTask({ id: 't' })])], { id: 'proc-NEW' });
    const merged = mergeProgressIntoFresh(fresh, extractProgress(persisted));
    expect(merged).toBe(fresh);
    expect(merged.phases[0].tasks[0].completed).toBe(false);
  });

  it('merges checkItem.checked by id when the fresh structure adds new items', () => {
    const persistedTask = makeTask({
      id: 't',
      type: 'multicheck',
      checkItems: [
        { id: 'a', description: 'A', required: true, checked: true, checkedAt: 'ts' },
        { id: 'b', description: 'B', required: true, checked: false },
      ],
    });
    const freshTask = makeTask({
      id: 't',
      type: 'multicheck',
      checkItems: [
        { id: 'a', description: 'A renamed', required: true, checked: false },
        { id: 'b', description: 'B', required: true, checked: false },
        { id: 'c-new', description: 'C', required: false, checked: false },
      ],
    });
    const merged = mergeProgressIntoFresh(
      makeProcess([makePhase([freshTask])]),
      extractProgress(makeProcess([makePhase([persistedTask])])),
    );
    const items = merged.phases[0].tasks[0].checkItems;
    expect(items).toHaveLength(3);
    // Description comes from fresh (renamed) but checked state survives.
    expect(items[0]).toMatchObject({ id: 'a', description: 'A renamed', checked: true, checkedAt: 'ts' });
    expect(items[1]).toMatchObject({ id: 'b', checked: false });
    expect(items[2]).toMatchObject({ id: 'c-new', checked: false });
  });
});
