import { describe, it, expect } from 'vitest';
import {
  formatDuration,
  formatDurationLong,
  calculateTaskDuration,
  calculateTaskProgress,
  calculateActivityProgress,
  calculatePhaseProgress,
  calculateProcessProgress,
  getAllTasksFromPhase,
  findTaskInProcess,
  checkTaskDependencies,
  updateTaskBlockedStatus,
  validateTaskEvidence,
  canCompleteTask,
  updateProgress
} from '@/lib/helpers';
import { ProcessState, TaskState, PhaseState, ActivityState } from '@/lib/types';

describe('helpers additional coverage', () => {
  describe('formatDuration', () => {
    it('should format duration with hours', () => {
      expect(formatDuration(3661000)).toBe('01:01:01'); // 1h 1m 1s
    });

    it('should format duration without hours', () => {
      expect(formatDuration(61000)).toBe('01:01'); // 1m 1s
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('00:00');
    });

    it('should handle negative duration', () => {
      expect(formatDuration(-1000)).toBe('00:00');
    });

    it('should pad single digits', () => {
      expect(formatDuration(5000)).toBe('00:05'); // 5 seconds
    });
  });

  describe('formatDurationLong', () => {
    it('should format long duration with all units', () => {
      expect(formatDurationLong(3661000)).toBe('1h 1m 1s');
    });

    it('should format without hours', () => {
      expect(formatDurationLong(65000)).toBe('1m 5s');
    });

    it('should format only seconds', () => {
      expect(formatDurationLong(5000)).toBe('5s');
    });

    it('should handle zero duration', () => {
      expect(formatDurationLong(0)).toBe('0s');
    });

    it('should handle negative duration', () => {
      expect(formatDurationLong(-1000)).toBe('0s');
    });
  });

  describe('calculateTaskDuration', () => {
    it('should calculate duration with previousCompletedAt', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'both', required: false },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      const duration = calculateTaskDuration(task, '2024-01-01T09:00:00Z', null);
      expect(duration).toBe(3600000); // 1 hour in ms
    });

    it('should calculate duration with processStartedAt when no previous', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'both', required: false },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      const duration = calculateTaskDuration(task, null, '2024-01-01T09:00:00Z');
      expect(duration).toBe(3600000); // 1 hour in ms
    });

    it('should use taskCompleted as reference when no other dates', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: true,
        completedAt: '2024-01-01T10:00:00Z',
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'both', required: false },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      const duration = calculateTaskDuration(task, null, null);
      expect(duration).toBe(0);
    });

    it('should return 0 when task not completed', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: false,
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'both', required: false },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      const duration = calculateTaskDuration(task, '2024-01-01T09:00:00Z', null);
      expect(duration).toBe(0);
    });
  });

  describe('calculateTaskProgress edge cases', () => {
    it('should handle null tasks array', () => {
      expect(calculateTaskProgress(null as any)).toBe(0);
    });

    it('should handle empty tasks array', () => {
      expect(calculateTaskProgress([])).toBe(0);
    });
  });

  describe('getAllTasksFromPhase edge cases', () => {
    it('should handle phase with only activities', () => {
      const phase: PhaseState = {
        id: 'phase-1',
        name: 'Phase 1',
        description: '',
        order: 1,
        progress: 0,
        dynamicLinks: [],
        tasks: [],
        activities: [
          {
            id: 'activity-1',
            name: 'Activity 1',
            description: '',
            order: 1,
            progress: 0,
            dynamicLinks: [],
            images: [],
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                description: '',
                order: 1,
                completed: false,
                evidence: { text: '', images: [] },
                references: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'both', required: false },
                dependencies: [],
                isBlocked: false,
                type: 'standard',
                checkItems: []
              }
            ]
          }
        ]
      };
      
      const tasks = getAllTasksFromPhase(phase);
      expect(tasks).toHaveLength(1);
    });
  });

  describe('calculateProcessProgress edge cases', () => {
    it('should handle null process', () => {
      expect(calculateProcessProgress(null as any)).toBe(0);
    });

    it('should handle empty phases', () => {
      const process: ProcessState = {
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0',
        phases: [],
        progress: 0,
        variableDefinitions: [],
        capturedVariables: {},
        subprocesses: [],
        timeTracking: { status: 'idle', sessions: [], totalActiveTime: 0 },
        loadedAt: new Date().toISOString()
      };
      expect(calculateProcessProgress(process)).toBe(0);
    });
  });

  describe('findTaskInProcess edge cases', () => {
    it('should return undefined for non-existent task', () => {
      const process: ProcessState = {
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0',
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 1,
            progress: 0,
            dynamicLinks: [],
            tasks: [],
            activities: []
          }
        ],
        progress: 0,
        variableDefinitions: [],
        capturedVariables: {},
        subprocesses: [],
        timeTracking: { status: 'idle', sessions: [], totalActiveTime: 0 },
        loadedAt: new Date().toISOString()
      };
      
      expect(findTaskInProcess('non-existent', process)).toBeUndefined();
    });
  });

  describe('checkTaskDependencies edge cases', () => {
    it('should return false for non-existent phase', () => {
      const process: ProcessState = {
        id: 'test',
        name: 'Test',
        description: '',
        version: '1.0',
        phases: [],
        progress: 0,
        variableDefinitions: [],
        capturedVariables: {},
        subprocesses: [],
        timeTracking: { status: 'idle', sessions: [], totalActiveTime: 0 },
        loadedAt: new Date().toISOString()
      };
      
      expect(checkTaskDependencies('task-1', 'non-existent', process)).toBe(false);
    });
  });

  describe('validateTaskEvidence edge cases', () => {
    it('should return true when no evidence config', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: false,
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'text', required: false },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      expect(validateTaskEvidence(task)).toBe(true);
    });

    it('should return true for unknown evidence type', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: false,
        evidence: { text: '', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'unknown' as any, required: true },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: []
      };
      
      expect(validateTaskEvidence(task)).toBe(true);
    });
  });

  describe('canCompleteTask edge cases', () => {
    it('should return false for blocked task regardless of evidence', () => {
      const task: TaskState = {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: false,
        isBlocked: true,
        evidence: { text: 'Valid evidence', images: [] },
        references: [],
        dynamicLinks: [],
        evidenceConfig: { type: 'text', required: true },
        dependencies: [],
        type: 'standard',
        checkItems: []
      };
      
      expect(canCompleteTask(task)).toBe(false);
    });
  });
});
