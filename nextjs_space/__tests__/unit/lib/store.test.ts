import { describe, it, expect, beforeEach } from 'vitest';
import { useProcessStore } from '@/lib/store';
import { ProcessState, TaskState, CheckItemState } from '@/lib/types';

// Helper to create a mock task with checkItems
const createMockCheckTask = (
  id: string,
  type: 'check' | 'multicheck',
  checkItems: CheckItemState[]
): TaskState => ({
  id,
  name: `Task ${id}`,
  description: '',
  order: 1,
  completed: false,
  evidenceConfig: { type: 'text', required: false },
  evidence: { text: '', images: [] },
  dependencies: [],
  isBlocked: false,
  type,
  checkItems,
  dynamicLinks: [],
  references: []
});

// Helper to create a mock process with check tasks
const createMockProcess = (): ProcessState => ({
  id: 'test-process',
  name: 'Test Process',
  description: 'Test process with check tasks',
  version: '1.0.0',
  phases: [
    {
      id: 'phase-1',
      name: 'Phase 1',
      description: '',
      order: 1,
      progress: 0,
      tasks: [
        createMockCheckTask('task-check', 'check', [
          { id: 'check-1', description: 'Single check item', required: true, checked: false }
        ]),
        createMockCheckTask('task-multicheck', 'multicheck', [
          { id: 'multi-1', description: 'Required item 1', required: true, checked: false },
          { id: 'multi-2', description: 'Required item 2', required: true, checked: false },
          { id: 'multi-3', description: 'Optional item', required: false, checked: false }
        ])
      ],
      dynamicLinks: [],
      activities: []
    }
  ],
  progress: 0,
  variableDefinitions: [],
  capturedVariables: {},
  loadedAt: new Date().toISOString(),
  subprocesses: [],
  timeTracking: {
    status: 'idle',
    sessions: [],
    totalActiveTime: 0
  }
});

describe('useProcessStore - Check Items', () => {
  beforeEach(() => {
    // Reset the store before each test
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  describe('toggleCheckItem', () => {
    it('should toggle a check item from unchecked to checked', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      useProcessStore.getState().toggleCheckItem('phase-1', 'task-check', 'check-1');

      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      
      expect(task?.checkItems[0].checked).toBe(true);
      expect(task?.checkItems[0].checkedAt).toBeDefined();
    });

    it('should toggle a check item from checked to unchecked', () => {
      const mockProcess = createMockProcess();
      mockProcess.phases[0].tasks[0].checkItems[0].checked = true;
      mockProcess.phases[0].tasks[0].checkItems[0].checkedAt = new Date().toISOString();
      useProcessStore.setState({ process: mockProcess });

      useProcessStore.getState().toggleCheckItem('phase-1', 'task-check', 'check-1');

      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      
      expect(task?.checkItems[0].checked).toBe(false);
      expect(task?.checkItems[0].checkedAt).toBeUndefined();
    });

    it('should toggle individual items in multicheck task', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      // Toggle first item
      useProcessStore.getState().toggleCheckItem('phase-1', 'task-multicheck', 'multi-1');
      
      let state = useProcessStore.getState();
      let task = state.process?.phases[0].tasks[1];
      
      expect(task?.checkItems[0].checked).toBe(true);
      expect(task?.checkItems[1].checked).toBe(false);
      expect(task?.checkItems[2].checked).toBe(false);

      // Toggle second item
      useProcessStore.getState().toggleCheckItem('phase-1', 'task-multicheck', 'multi-2');
      
      state = useProcessStore.getState();
      task = state.process?.phases[0].tasks[1];
      
      expect(task?.checkItems[0].checked).toBe(true);
      expect(task?.checkItems[1].checked).toBe(true);
      expect(task?.checkItems[2].checked).toBe(false);
    });

    it('should not affect other tasks when toggling', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      useProcessStore.getState().toggleCheckItem('phase-1', 'task-check', 'check-1');

      const state = useProcessStore.getState();
      const otherTask = state.process?.phases[0].tasks[1];
      
      // Other task's check items should remain unchanged
      expect(otherTask?.checkItems[0].checked).toBe(false);
      expect(otherTask?.checkItems[1].checked).toBe(false);
    });

    it('should handle non-existent phase gracefully', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      // Should not throw
      useProcessStore.getState().toggleCheckItem('non-existent-phase', 'task-check', 'check-1');

      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      
      // Original state should be unchanged
      expect(task?.checkItems[0].checked).toBe(false);
    });

    it('should handle non-existent task gracefully', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      // Should not throw
      useProcessStore.getState().toggleCheckItem('phase-1', 'non-existent-task', 'check-1');

      const state = useProcessStore.getState();
      const task = state.process?.phases[0].tasks[0];
      
      // Original state should be unchanged
      expect(task?.checkItems[0].checked).toBe(false);
    });
  });

  describe('canCompleteCheckTask', () => {
    it('should return true when all required check items are checked', () => {
      const mockProcess = createMockProcess();
      // Check all required items in multicheck task
      mockProcess.phases[0].tasks[1].checkItems[0].checked = true;
      mockProcess.phases[0].tasks[1].checkItems[1].checked = true;
      // Optional item not checked
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-multicheck');

      expect(canComplete).toBe(true);
    });

    it('should return false when not all required check items are checked', () => {
      const mockProcess = createMockProcess();
      // Only check one of two required items
      mockProcess.phases[0].tasks[1].checkItems[0].checked = true;
      mockProcess.phases[0].tasks[1].checkItems[1].checked = false;
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-multicheck');

      expect(canComplete).toBe(false);
    });

    it('should return true for check task when single required item is checked', () => {
      const mockProcess = createMockProcess();
      mockProcess.phases[0].tasks[0].checkItems[0].checked = true;
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-check');

      expect(canComplete).toBe(true);
    });

    it('should return false for check task when single required item is not checked', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-check');

      expect(canComplete).toBe(false);
    });

    it('should return true when only optional items exist and none are checked', () => {
      const mockProcess = createMockProcess();
      // Make all items optional
      mockProcess.phases[0].tasks[1].checkItems.forEach(item => {
        item.required = false;
      });
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-multicheck');

      expect(canComplete).toBe(true);
    });

    it('should return true for standard task (no checkItems)', () => {
      const mockProcess = createMockProcess();
      // Add a standard task
      mockProcess.phases[0].tasks.push({
        id: 'task-standard',
        name: 'Standard Task',
        description: '',
        order: 3,
        completed: false,
        evidenceConfig: { type: 'text', required: false },
        evidence: { text: '', images: [] },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        checkItems: [],
        dynamicLinks: [],
        references: []
      });
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'task-standard');

      expect(canComplete).toBe(true);
    });

    it('should return false for non-existent task', () => {
      const mockProcess = createMockProcess();
      useProcessStore.setState({ process: mockProcess });

      // Non-existent tasks return false (task not found)
      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'non-existent');

      expect(canComplete).toBe(false);
    });

    it('should handle tasks in activities', () => {
      const mockProcess = createMockProcess();
      // Add an activity with a check task
      mockProcess.phases[0].activities = [
        {
          id: 'activity-1',
          name: 'Activity 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [
            createMockCheckTask('activity-task', 'check', [
              { id: 'act-check-1', description: 'Activity check', required: true, checked: true }
            ])
          ],
          dynamicLinks: [],
          images: []
        }
      ];
      useProcessStore.setState({ process: mockProcess });

      const canComplete = useProcessStore.getState().canCompleteCheckTask('phase-1', 'activity-task', 'activity-1');

      expect(canComplete).toBe(true);
    });
  });
});

describe('useProcessStore - Toggle Check Item in Activities', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should toggle check item in task within an activity', () => {
    const mockProcess = createMockProcess();
    mockProcess.phases[0].activities = [
      {
        id: 'activity-1',
        name: 'Activity 1',
        description: '',
        order: 1,
        progress: 0,
        tasks: [
          createMockCheckTask('activity-task', 'multicheck', [
            { id: 'act-1', description: 'Item 1', required: true, checked: false },
            { id: 'act-2', description: 'Item 2', required: true, checked: false }
          ])
        ],
        dynamicLinks: [],
        images: []
      }
    ];
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().toggleCheckItem('phase-1', 'activity-task', 'act-1', 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.checkItems[0].checked).toBe(true);
    expect(task?.checkItems[1].checked).toBe(false);
  });
});
