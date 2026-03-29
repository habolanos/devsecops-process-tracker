import { describe, it, expect } from 'vitest';
import {
  calculateTaskProgress,
  calculatePhaseProgress,
  calculateProcessProgress,
  updateProgress,
  checkTaskDependencies,
  updateTaskBlockedStatus,
  validateTaskEvidence,
  canCompleteTask
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
    // Only counts valid tasks with completed property
    expect(calculateTaskProgress(tasks)).toBe(0.5); // 1 of 2 valid
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
    expect(updated.progress).toBe(0.75); // 3 of 4 tasks
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
