import { describe, it, expect, beforeEach } from 'vitest';
import { useProcessStore } from '@/lib/store';
import { ProcessState } from '@/lib/types';

// Mock simple process for testing
const createMockProcess = (): ProcessState => ({
  id: 'test-process',
  name: 'Test Process',
  description: 'Test Description',
  version: '1.0.0',
  phases: [
    {
      id: 'phase-1',
      name: 'Phase 1',
      description: 'Test phase',
      order: 1,
      tasks: [
        {
          id: 'task-1',
          name: 'Task 1',
          description: 'Test task',
          order: 1,
          completed: false,
          evidence: {
            text: '',
            images: []
          },
          references: [],
          dynamicLinks: [],
          evidenceConfig: { type: 'both', required: false },
          dependencies: [],
          isBlocked: false,
          type: 'standard',
          checkItems: []
        }
      ],
      progress: 0,
      dynamicLinks: [],
      activities: []
    },
    {
      id: 'phase-2',
      name: 'Phase 2',
      description: 'Second phase',
      order: 2,
      tasks: [
        {
          id: 'task-2',
          name: 'Task 2',
          description: 'Second task',
          order: 1,
          completed: false,
          evidence: {
            text: '',
            images: []
          },
          references: [],
          dynamicLinks: [],
          evidenceConfig: { type: 'both', required: false },
          dependencies: [],
          isBlocked: false,
          type: 'standard',
          checkItems: []
        }
      ],
      progress: 0,
      dynamicLinks: [],
      activities: []
    }
  ],
  progress: 0,
  variableDefinitions: [
    { key: 'project', label: 'Project', type: 'text', required: true },
    { key: 'env', label: 'Environment', type: 'select', required: false, options: ['dev', 'prod'] }
  ],
  capturedVariables: {},
  loadedAt: new Date().toISOString(),
  subprocesses: [],
  timeTracking: {
    status: 'idle',
    sessions: [],
    totalActiveTime: 0
  }
});

describe('store additional coverage', () => {
  beforeEach(() => {
    // Reset store before each test
    const store = useProcessStore.getState();
    store.clearProcess();
  });

  describe('setCurrentPhase', () => {
    it('should set current phase and reset activity/task', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      // Set activity and task first
      store.setCurrentActivity('activity-1');
      store.setCurrentTask('task-1');
      
      // Change phase
      store.setCurrentPhase('phase-2');
      
      const state = useProcessStore.getState();
      expect(state.currentPhaseId).toBe('phase-2');
      expect(state.currentActivityId).toBeNull();
      expect(state.currentTaskId).toBeNull();
    });
  });

  describe('setCurrentActivity', () => {
    it('should set current activity and reset task', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      store.setCurrentTask('task-1');
      
      store.setCurrentActivity('activity-1');
      
      const state = useProcessStore.getState();
      expect(state.currentActivityId).toBe('activity-1');
      expect(state.currentTaskId).toBeNull();
    });
  });

  describe('setCurrentTask', () => {
    it('should set current task', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.setCurrentTask('task-1');
      
      const state = useProcessStore.getState();
      expect(state.currentTaskId).toBe('task-1');
    });
  });

  describe('updateTaskEvidence', () => {
    it('should update task evidence text', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.updateTaskEvidence('phase-1', 'task-1', { text: 'Evidence text' });
      
      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      expect(task?.evidence.text).toBe('Evidence text');
    });

    it('should update task evidence images', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      const newImages = [{ id: 'img-1', name: 'test.png', url: 'data:image/png;base64,test', isPublic: true, source: 'file' as const, uploadedAt: new Date().toISOString(), cloudStoragePath: '' }];
      store.updateTaskEvidence('phase-1', 'task-1', { images: newImages });
      
      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      expect(task?.evidence.images).toHaveLength(1);
    });

    it('should handle non-existent phase gracefully', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      // Should not throw
      expect(() => {
        store.updateTaskEvidence('non-existent', 'task-1', { text: 'test' });
      }).not.toThrow();
    });
  });

  describe('completeTask and uncompleteTask', () => {
    it('should mark task as completed', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.completeTask('phase-1', 'task-1');
      
      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      expect(task?.completed).toBe(true);
      expect(task?.completedAt).toBeDefined();
    });

    it('should mark task as uncompleted', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.completeTask('phase-1', 'task-1');
      store.uncompleteTask('phase-1', 'task-1');
      
      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      expect(task?.completed).toBe(false);
      expect(task?.completedAt).toBeUndefined();
    });
  });

  describe('variable management', () => {
    it('should update captured variables', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.updateCapturedVariables({ project: 'MyProject', env: 'dev' });
      
      const state = useProcessStore.getState();
      expect(state.process?.capturedVariables.project).toBe('MyProject');
      expect(state.process?.capturedVariables.env).toBe('dev');
    });

    it('should update single variable', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.updateSingleVariable('project', 'TestProject');
      
      const state = useProcessStore.getState();
      expect(state.process?.capturedVariables.project).toBe('TestProject');
    });

    it('should return true when required variables are filled', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.updateSingleVariable('project', 'FilledProject');
      
      const result = store.areRequiredVariablesFilled();
      expect(result).toBe(true);
    });

    it('should return false when required variables are empty', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      // project is required but not set
      const result = store.areRequiredVariablesFilled();
      expect(result).toBe(false);
    });

    it('should return true when no variable definitions', () => {
      const store = useProcessStore.getState();
      const process = createMockProcess();
      process.variableDefinitions = [];
      store.loadProcess(process);
      
      const result = store.areRequiredVariablesFilled();
      expect(result).toBe(true);
    });

    it('should handle null process for areRequiredVariablesFilled', () => {
      const store = useProcessStore.getState();
      store.clearProcess();
      
      const result = store.areRequiredVariablesFilled();
      expect(result).toBe(false);
    });
  });

  describe('markProcessComplete', () => {
    it('should mark process as completed', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      
      store.markProcessComplete();
      
      const state = useProcessStore.getState();
      expect(state.process?.completedAt).toBeDefined();
    });

    it('should handle null process gracefully', () => {
      const store = useProcessStore.getState();
      store.clearProcess();
      
      // Should not throw
      expect(() => store.markProcessComplete()).not.toThrow();
    });
  });

  describe('clearProcess', () => {
    it('should reset all state to null', () => {
      const store = useProcessStore.getState();
      store.loadProcess(createMockProcess());
      store.setCurrentPhase('phase-1');
      
      store.clearProcess();
      
      const state = useProcessStore.getState();
      expect(state.process).toBeNull();
      expect(state.currentPhaseId).toBeNull();
      expect(state.currentActivityId).toBeNull();
      expect(state.currentTaskId).toBeNull();
    });
  });
});
