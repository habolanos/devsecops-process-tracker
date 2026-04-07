import { describe, it, expect } from 'vitest';
import {
  calculateTaskProgress,
  calculatePhaseProgress,
  calculateProcessProgress,
  updateProgress,
  checkTaskDependencies,
  updateTaskBlockedStatus,
  validateTaskEvidence,
  canCompleteTask,
  formatDurationLong,
  parseTimeString,
  getTimeStatus,
  calculateTaskDuration,
  findTaskInProcess,
  getAllDependentTasks
} from '@/lib/helpers';
import { ProcessState, PhaseState, TaskState } from '@/lib/types';

describe('calculateTaskProgress', () => {
  it('should return 0 for empty task array', () => {
    expect(calculateTaskProgress([])).toBe(0);
  });

  it('should return 0 when no tasks are completed', () => {
    const tasks = [
      { completed: false },
      { completed: false },
      { completed: false }
    ] as TaskState[];
    expect(calculateTaskProgress(tasks)).toBe(0);
  });

  it('should return 1 when all tasks are completed', () => {
    const tasks = [
      { completed: true },
      { completed: true },
      { completed: true }
    ] as TaskState[];
    expect(calculateTaskProgress(tasks)).toBe(1);
  });

  it('should return 0.5 when half of tasks are completed', () => {
    const tasks = [
      { completed: true },
      { completed: false },
      { completed: true },
      { completed: false }
    ] as TaskState[];
    expect(calculateTaskProgress(tasks)).toBe(0.5);
  });

  it('should handle null or undefined tasks gracefully', () => {
    const tasks = [
      { completed: true },
      null,
      undefined,
      { completed: false }
    ] as TaskState[];
    // Code counts all items in array for total, but only truthy for completed
    // 1 completed / 4 total = 0.25
    expect(calculateTaskProgress(tasks)).toBe(0.25);
  });
});

describe('calculatePhaseProgress', () => {
  it('should return 0 for phase with no tasks', () => {
    const phase = { tasks: [] } as PhaseState;
    expect(calculatePhaseProgress(phase)).toBe(0);
  });

  it('should calculate progress based on tasks', () => {
    const phase = {
      tasks: [
        { completed: true },
        { completed: false }
      ]
    } as PhaseState;
    expect(calculatePhaseProgress(phase)).toBe(0.5);
  });

  it('should handle undefined phase', () => {
    expect(calculatePhaseProgress(undefined as any)).toBe(0);
  });
});

describe('calculateProcessProgress', () => {
  it('should return 0 for empty process', () => {
    const process = { phases: [] } as ProcessState;
    expect(calculateProcessProgress(process)).toBe(0);
  });

  it('should return 0 for process with empty phases', () => {
    const process = {
      phases: [
        { tasks: [] },
        { tasks: [] }
      ]
    } as ProcessState;
    expect(calculateProcessProgress(process)).toBe(0);
  });

  it('should calculate overall progress across all phases', () => {
    const process = {
      phases: [
        { tasks: [{ completed: true }, { completed: false }] }, // 50%
        { tasks: [{ completed: true }, { completed: true }] }   // 100%
      ]
    } as ProcessState;
    // Total: 3 of 4 tasks completed = 75%
    expect(calculateProcessProgress(process)).toBe(0.75);
  });

  it('should handle null or undefined phases', () => {
    const process = { phases: null } as any;
    expect(calculateProcessProgress(process)).toBe(0);
  });
});

describe('updateProgress', () => {
  it('should update phase progress and overall progress', () => {
    const process = {
      id: 'test',
      phases: [
        {
          id: 'p1',
          tasks: [{ completed: true }, { completed: false }],
          progress: 0
        },
        {
          id: 'p2',
          tasks: [{ completed: true }],
          progress: 0
        }
      ],
      progress: 0
    } as ProcessState;

    const updated = updateProgress(process);

    expect(updated.phases[0].progress).toBe(0.5);
    expect(updated.phases[1].progress).toBe(1);
    // Overall progress is total completed tasks / total tasks: 2 of 3 = 0.666...
    expect(updated.progress).toBeCloseTo(0.6667, 3);
  });

  it('should not mutate original process', () => {
    const process = {
      phases: [{ tasks: [{ completed: true }] }]
    } as ProcessState;

    const updated = updateProgress(process);

    expect(updated).not.toBe(process);
    expect(updated.phases).not.toBe(process.phases);
  });
});

describe('checkTaskDependencies', () => {
  const mockProcess = {
    phases: [
      {
        id: 'phase-1',
        tasks: [
          { id: 'task-1', completed: true },
          { id: 'task-2', completed: false },
          { id: 'task-3', completed: false, dependencies: ['task-1'] }
        ]
      },
      {
        id: 'phase-2',
        tasks: [
          { id: 'task-4', completed: true }
        ]
      }
    ]
  } as ProcessState;

  it('should return false for task with no dependencies', () => {
    expect(checkTaskDependencies('task-1', 'phase-1', mockProcess)).toBe(false);
  });

  it('should return false when dependency is completed', () => {
    expect(checkTaskDependencies('task-3', 'phase-1', mockProcess)).toBe(false);
  });

  it('should return true when dependency is not completed', () => {
    const processWithPendingDep = {
      phases: [
        {
          id: 'phase-1',
          tasks: [
            { id: 'task-1', completed: false },
            { id: 'task-2', completed: false, dependencies: ['task-1'] }
          ]
        }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-2', 'phase-1', processWithPendingDep)).toBe(true);
  });

  it('should check dependencies across all phases', () => {
    const processWithCrossPhaseDep = {
      phases: [
        {
          id: 'phase-1',
          tasks: [{ id: 'task-1', completed: false }]
        },
        {
          id: 'phase-2',
          tasks: [
            { id: 'task-2', completed: false, dependencies: ['task-1'] }
          ]
        }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-2', 'phase-2', processWithCrossPhaseDep)).toBe(true);
  });

  it('should return false for non-existent phase', () => {
    expect(checkTaskDependencies('task-1', 'nonexistent', mockProcess)).toBe(false);
  });

  it('should handle multiple dependencies (AND logic)', () => {
    const processWithMultipleDeps = {
      phases: [
        {
          id: 'phase-1',
          tasks: [
            { id: 'task-1', completed: true },
            { id: 'task-2', completed: false },
            { id: 'task-3', completed: false, dependencies: ['task-1', 'task-2'] }
          ]
        }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-3', 'phase-1', processWithMultipleDeps)).toBe(true);
  });
});

describe('updateTaskBlockedStatus', () => {
  it('should update blocked status for all tasks', () => {
    const process = {
      phases: [
        {
          id: 'phase-1',
          tasks: [
            { id: 'task-1', completed: true, dependencies: [], isBlocked: false },
            { id: 'task-2', completed: false, dependencies: ['task-1'], isBlocked: false }
          ]
        }
      ]
    } as ProcessState;

    const updated = updateTaskBlockedStatus(process);

    expect(updated.phases[0].tasks[0].isBlocked).toBe(false);
    expect(updated.phases[0].tasks[1].isBlocked).toBe(false); // task-1 is completed
  });

  it('should block tasks with uncompleted dependencies', () => {
    const process = {
      phases: [
        {
          id: 'phase-1',
          tasks: [
            { id: 'task-1', completed: false, dependencies: [], isBlocked: false },
            { id: 'task-2', completed: false, dependencies: ['task-1'], isBlocked: false }
          ]
        }
      ]
    } as ProcessState;

    const updated = updateTaskBlockedStatus(process);

    expect(updated.phases[0].tasks[0].isBlocked).toBe(false);
    expect(updated.phases[0].tasks[1].isBlocked).toBe(true);
  });
});

describe('validateTaskEvidence', () => {
  it('should return true when evidence is not required', () => {
    const task = {
      evidenceConfig: { required: false, type: 'text' },
      evidence: { text: '', images: [] }
    } as TaskState;

    expect(validateTaskEvidence(task)).toBe(true);
  });

  it('should validate text evidence', () => {
    const taskWithText = {
      evidenceConfig: { required: true, type: 'text' },
      evidence: { text: 'Some evidence', images: [] }
    } as TaskState;

    const taskWithoutText = {
      evidenceConfig: { required: true, type: 'text' },
      evidence: { text: '', images: [] }
    } as TaskState;

    const taskWithWhitespace = {
      evidenceConfig: { required: true, type: 'text' },
      evidence: { text: '   ', images: [] }
    } as TaskState;

    expect(validateTaskEvidence(taskWithText)).toBe(true);
    expect(validateTaskEvidence(taskWithoutText)).toBe(false);
    expect(validateTaskEvidence(taskWithWhitespace)).toBe(false);
  });

  it('should validate image evidence', () => {
    const taskWithImages = {
      evidenceConfig: { required: true, type: 'image' },
      evidence: {
        images: [{ id: '1', name: 'img.jpg' }]
      }
    } as TaskState;

    const taskWithoutImages = {
      evidenceConfig: { required: true, type: 'image' },
      evidence: { images: [] }
    } as TaskState;

    expect(validateTaskEvidence(taskWithImages)).toBe(true);
    expect(validateTaskEvidence(taskWithoutImages)).toBe(false);
  });

  it('should validate both text and image evidence', () => {
    const taskComplete = {
      evidenceConfig: { required: true, type: 'both' },
      evidence: {
        text: 'Description',
        images: [{ id: '1', name: 'img.jpg' }]
      }
    } as TaskState;

    const taskTextOnly = {
      evidenceConfig: { required: true, type: 'both' },
      evidence: {
        text: 'Description',
        images: []
      }
    } as TaskState;

    const taskImageOnly = {
      evidenceConfig: { required: true, type: 'both' },
      evidence: {
        text: '',
        images: [{ id: '1', name: 'img.jpg' }]
      }
    } as TaskState;

    expect(validateTaskEvidence(taskComplete)).toBe(true);
    expect(validateTaskEvidence(taskTextOnly)).toBe(false);
    expect(validateTaskEvidence(taskImageOnly)).toBe(false);
  });

  it('should handle missing evidence config', () => {
    const task = { evidenceConfig: null } as TaskState;
    expect(validateTaskEvidence(task)).toBe(true);
  });
});

describe('canCompleteTask', () => {
  it('should return false for blocked tasks regardless of evidence', () => {
    const blockedTask = {
      isBlocked: true,
      evidenceConfig: { required: false },
      evidence: { text: 'Valid evidence', images: [] }
    } as TaskState;

    expect(canCompleteTask(blockedTask)).toBe(false);
  });

  it('should return true for unblocked task with valid evidence', () => {
    const validTask = {
      isBlocked: false,
      evidenceConfig: { required: true, type: 'text' },
      evidence: { text: 'Valid evidence', images: [] }
    } as TaskState;

    expect(canCompleteTask(validTask)).toBe(true);
  });

  it('should return false for unblocked task with invalid evidence', () => {
    const invalidTask = {
      isBlocked: false,
      evidenceConfig: { required: true, type: 'text' },
      evidence: { text: '', images: [] }
    } as TaskState;

    expect(canCompleteTask(invalidTask)).toBe(false);
  });

  it('should allow completion when no evidence is required', () => {
    const task = {
      isBlocked: false,
      evidenceConfig: { required: false },
      evidence: { images: [] }
    } as TaskState;

    expect(canCompleteTask(task)).toBe(true);
  });
});

describe('formatDurationLong', () => {
  it('formats zero milliseconds', () => {
    expect(formatDurationLong(0)).toBe('0s');
  });

  it('formats seconds only', () => {
    expect(formatDurationLong(5000)).toBe('5s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDurationLong(125000)).toBe('2m 5s');
  });

  it('formats hours, minutes, and seconds', () => {
    expect(formatDurationLong(3665000)).toBe('1h 1m 5s');
  });

  it('handles negative values by treating as zero', () => {
    expect(formatDurationLong(-1000)).toBe('0s');
  });

  it('formats large duration', () => {
    expect(formatDurationLong(86465000)).toBe('24h 1m 5s');
  });
});

describe('parseTimeString', () => {
  it('parses hours string', () => {
    expect(parseTimeString('2h')).toBe(7200000);
  });

  it('parses minutes string', () => {
    expect(parseTimeString('30m')).toBe(1800000);
  });

  it('parses seconds string', () => {
    expect(parseTimeString('45s')).toBe(45000);
  });

  it('parses combined time string', () => {
    expect(parseTimeString('1h 30m 45s')).toBe(5445000);
  });

  it('handles decimal hours', () => {
    expect(parseTimeString('1.5h')).toBe(5400000);
  });

  it('handles case insensitive input', () => {
    expect(parseTimeString('2H')).toBe(7200000);
  });

  it('handles whitespace', () => {
    expect(parseTimeString(' 2h 30m ')).toBe(9000000);
  });

  it('returns 0 for invalid input', () => {
    expect(parseTimeString('invalid')).toBe(0);
  });

  it('returns 0 for null or undefined', () => {
    expect(parseTimeString(null as unknown as string)).toBe(0);
    expect(parseTimeString(undefined as unknown as string)).toBe(0);
  });
});

describe('getTimeStatus', () => {
  it('returns on-time when no estimated time', () => {
    expect(getTimeStatus(1000, 0)).toBe('on-time');
  });

  it('returns on-time when within 60% of estimated', () => {
    expect(getTimeStatus(3000, 10000)).toBe('on-time');
  });

  it('returns warning when between 60% and 100% of estimated', () => {
    expect(getTimeStatus(8000, 10000)).toBe('warning');
  });

  it('returns exceeded when over 100% of estimated', () => {
    expect(getTimeStatus(12000, 10000)).toBe('exceeded');
  });

  it('handles exact 60% boundary', () => {
    expect(getTimeStatus(6000, 10000)).toBe('on-time');
  });

  it('handles exact 100% boundary', () => {
    expect(getTimeStatus(10000, 10000)).toBe('warning');
  });
});

describe('calculateTaskDuration', () => {
  it('returns 0 when task is not completed', () => {
    const task = { completedAt: null } as TaskState;
    expect(calculateTaskDuration(task, null, null)).toBe(0);
  });

  it('calculates duration from process start time', () => {
    const task = { completedAt: '2024-01-01T01:00:00Z' } as TaskState;
    const processStartedAt = '2024-01-01T00:00:00Z';
    expect(calculateTaskDuration(task, null, processStartedAt)).toBe(3600000);
  });

  it('calculates duration from previous completed task', () => {
    const task = { completedAt: '2024-01-01T02:00:00Z' } as TaskState;
    const previousCompletedAt = '2024-01-01T01:00:00Z';
    expect(calculateTaskDuration(task, previousCompletedAt, null)).toBe(3600000);
  });

  it('prefers previous completed time over process start time', () => {
    const task = { completedAt: '2024-01-01T02:00:00Z' } as TaskState;
    const previousCompletedAt = '2024-01-01T01:00:00Z';
    const processStartedAt = '2024-01-01T00:00:00Z';
    expect(calculateTaskDuration(task, previousCompletedAt, processStartedAt)).toBe(3600000);
  });

  it('uses task completion time when no reference available', () => {
    const task = { completedAt: '2024-01-01T01:00:00Z' } as TaskState;
    expect(calculateTaskDuration(task, null, null)).toBe(0);
  });

  it('handles negative durations by returning 0', () => {
    const task = { completedAt: '2024-01-01T00:00:00Z' } as TaskState;
    const previousCompletedAt = '2024-01-01T01:00:00Z';
    expect(calculateTaskDuration(task, previousCompletedAt, null)).toBe(0);
  });
});

describe('findTaskInProcess', () => {
  it('finds task in direct tasks', () => {
    const task1 = { id: 'task-1', completed: true } as TaskState;
    const task2 = { id: 'task-2', completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2], activities: [] }
      ]
    } as ProcessState;

    expect(findTaskInProcess('task-1', process)).toBe(task1);
    expect(findTaskInProcess('task-2', process)).toBe(task2);
  });

  it('finds task in activities', () => {
    const task1 = { id: 'task-1', completed: true } as TaskState;
    const process = {
      phases: [
        {
          id: 'phase-1',
          tasks: [],
          activities: [
            { id: 'activity-1', tasks: [task1] }
          ]
        }
      ]
    } as ProcessState;

    expect(findTaskInProcess('task-1', process)).toBe(task1);
  });

  it('returns undefined for non-existent task', () => {
    const process = {
      phases: [
        { id: 'phase-1', tasks: [], activities: [] }
      ]
    } as ProcessState;

    expect(findTaskInProcess('non-existent', process)).toBeUndefined();
  });
});

describe('getAllDependentTasks', () => {
  it('returns empty array when task has no dependents', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-3'], completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2], activities: [] }
      ]
    } as ProcessState;

    expect(getAllDependentTasks('task-1', process)).toEqual([]);
  });

  it('finds direct dependents', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-1'], completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2], activities: [] }
      ]
    } as ProcessState;

    expect(getAllDependentTasks('task-1', process)).toEqual(['task-2']);
  });

  it('finds transitive dependents', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-1'], completed: false } as TaskState;
    const task3 = { id: 'task-3', dependencies: ['task-2'], completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2, task3], activities: [] }
      ]
    } as ProcessState;

    const dependents = getAllDependentTasks('task-1', process);
    expect(dependents).toContain('task-2');
    expect(dependents).toContain('task-3');
  });

  it('handles dependents in activities', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-1'], completed: false } as TaskState;
    const process = {
      phases: [
        {
          id: 'phase-1',
          tasks: [task1],
          activities: [
            { id: 'activity-1', tasks: [task2] }
          ]
        }
      ]
    } as ProcessState;

    expect(getAllDependentTasks('task-1', process)).toEqual(['task-2']);
  });
});

describe('checkTaskDependencies', () => {
  it('returns false when task has no dependencies', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1], activities: [] }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-1', 'phase-1', process)).toBe(false);
  });

  it('returns false when phase does not exist', () => {
    const process = {
      phases: [
        { id: 'phase-1', tasks: [], activities: [] }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-1', 'non-existent', process)).toBe(false);
  });

  it('returns false when task in activity has no dependencies', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const process = {
      phases: [
        {
          id: 'phase-1',
          tasks: [],
          activities: [
            { id: 'activity-1', tasks: [task1] }
          ]
        }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-1', 'phase-1', process, 'activity-1')).toBe(false);
  });

  it('returns false when task has completed dependency', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: true } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-1'], completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2], activities: [] }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-2', 'phase-1', process)).toBe(false);
  });

  it('returns true when task has uncompleted dependency', () => {
    const task1 = { id: 'task-1', dependencies: [], completed: false } as TaskState;
    const task2 = { id: 'task-2', dependencies: ['task-1'], completed: false } as TaskState;
    const process = {
      phases: [
        { id: 'phase-1', tasks: [task1, task2], activities: [] }
      ]
    } as ProcessState;

    expect(checkTaskDependencies('task-2', 'phase-1', process)).toBe(true);
  });
});
