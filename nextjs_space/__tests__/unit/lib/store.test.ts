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

describe('useProcessStore - Interaction Tracking', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should mark interaction as started', () => {
    useProcessStore.setState({ hasStartedInteraction: false });
    useProcessStore.getState().markInteractionStarted();

    expect(useProcessStore.getState().hasStartedInteraction).toBe(true);
  });

  it('should mark interaction when setting phase', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: mockProcess, hasStartedInteraction: false });

    useProcessStore.getState().setCurrentPhase('phase-1');

    expect(useProcessStore.getState().hasStartedInteraction).toBe(true);
    expect(useProcessStore.getState().currentPhaseId).toBe('phase-1');
  });

  it('should mark interaction when setting activity', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: mockProcess, hasStartedInteraction: false });

    useProcessStore.getState().setCurrentActivity('activity-1');

    expect(useProcessStore.getState().hasStartedInteraction).toBe(true);
    expect(useProcessStore.getState().currentActivityId).toBe('activity-1');
  });

  it('should mark interaction when setting task', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: mockProcess, hasStartedInteraction: false });

    useProcessStore.getState().setCurrentTask('task-1');

    expect(useProcessStore.getState().hasStartedInteraction).toBe(true);
    expect(useProcessStore.getState().currentTaskId).toBe('task-1');
  });
});

describe('useProcessStore - Variable Management', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should update captured variables', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: mockProcess });

    const variables = { rfc: 'RFC123', app: 'tracker' };
    useProcessStore.getState().updateCapturedVariables(variables);

    expect(useProcessStore.getState().process?.capturedVariables).toEqual(variables);
  });

  it('should update single variable', () => {
    const mockProcess = createMockProcess();
    mockProcess.capturedVariables = { rfc: 'RFC123' };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().updateSingleVariable('app', 'tracker');

    expect(useProcessStore.getState().process?.capturedVariables).toEqual({
      rfc: 'RFC123',
      app: 'tracker'
    });
  });

  it('should check if required variables are filled', () => {
    const mockProcess = createMockProcess();
    mockProcess.variableDefinitions = [
      { key: 'rfc', label: 'RFC', required: true, type: 'text' },
      { key: 'app', label: 'App', required: true, type: 'text' }
    ];
    mockProcess.capturedVariables = { rfc: 'RFC123', app: 'tracker' };
    useProcessStore.setState({ process: mockProcess });

    expect(useProcessStore.getState().areRequiredVariablesFilled()).toBe(true);
  });

  it('should return false when required variables are missing', () => {
    const mockProcess = createMockProcess();
    mockProcess.variableDefinitions = [
      { key: 'rfc', label: 'RFC', required: true, type: 'text' },
      { key: 'app', label: 'App', required: true, type: 'text' }
    ];
    mockProcess.capturedVariables = { rfc: 'RFC123' };
    useProcessStore.setState({ process: mockProcess });

    expect(useProcessStore.getState().areRequiredVariablesFilled()).toBe(false);
  });

  it('should return true when no variable definitions exist', () => {
    const mockProcess = createMockProcess();
    mockProcess.variableDefinitions = [];
    useProcessStore.setState({ process: mockProcess });

    expect(useProcessStore.getState().areRequiredVariablesFilled()).toBe(true);
  });
});

describe('useProcessStore - Process Management', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should clear process', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: mockProcess, currentPhaseId: 'phase-1' });

    useProcessStore.getState().clearProcess();

    expect(useProcessStore.getState().process).toBeNull();
    expect(useProcessStore.getState().currentPhaseId).toBeNull();
    expect(useProcessStore.getState().currentActivityId).toBeNull();
    expect(useProcessStore.getState().currentTaskId).toBeNull();
    expect(useProcessStore.getState().hasStartedInteraction).toBe(false);
  });

  it('should load process and set initial phase', () => {
    const mockProcess = createMockProcess();
    useProcessStore.setState({ process: null });

    useProcessStore.getState().loadProcess(mockProcess);

    expect(useProcessStore.getState().process).not.toBeNull();
    expect(useProcessStore.getState().currentPhaseId).toBe('phase-1');
    expect(useProcessStore.getState().hasStartedInteraction).toBe(false);
  });
});

describe('useProcessStore - Data Updates', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null });
  });

  it('should update list data for dynamic-list task', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [
            {
              id: 'task-1',
              name: 'Dynamic List Task',
              description: '',
              order: 1,
              type: 'dynamic-list' as const,
              completed: false,
              isBlocked: false,
              evidenceConfig: { type: 'text' as const, required: false },
              evidence: { text: '', images: [] },
              dependencies: [],
              checkItems: [],
              dynamicLinks: [],
              references: [],
              listData: [],
              listConfig: { label: 'Item' }
            }
          ],
          activities: [],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const items = [{ id: 'item-1', value: 'test', addedAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateListData('phase-1', 'task-1', items);

    const state = useProcessStore.getState();
    const task = state.process?.phases[0].tasks[0];

    expect(task?.listData).toEqual(items);
  });

  it('should update list data for task in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Dynamic List Task',
                  description: '',
                  order: 1,
                  type: 'dynamic-list' as const,
                  completed: false,
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: [],
                  listData: [],
                  listConfig: { label: 'Item' }
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const items = [{ id: 'item-1', value: 'test', addedAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateListData('phase-1', 'task-1', items, 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.listData).toEqual(items);
  });

  it('should update detail data for detail-list task', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [
            {
              id: 'task-1',
              name: 'Detail List Task',
              description: '',
              order: 1,
              type: 'detail-list' as const,
              completed: false,
              isBlocked: false,
              evidenceConfig: { type: 'text' as const, required: false },
              evidence: { text: '', images: [] },
              dependencies: [],
              checkItems: [],
              dynamicLinks: [],
              references: [],
              detailData: [],
              detailConfig: { sourceTaskId: 'source-task' }
            }
          ],
          activities: [],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const detailData = [{ itemId: 'item-1', detail: 'test detail', sourceItem: '', capturedText: '', addedAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateDetailData('phase-1', 'task-1', detailData);

    const state = useProcessStore.getState();
    const task = state.process?.phases[0].tasks[0];

    expect(task?.detailData).toEqual(detailData);
  });

  it('should update detail data for task in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Detail List Task',
                  description: '',
                  order: 1,
                  type: 'detail-list' as const,
                  completed: false,
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: [],
                  detailData: [],
                  detailConfig: { sourceTaskId: 'source-task' }
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const detailData = [{ itemId: 'item-1', detail: 'test detail', sourceItem: '', capturedText: '', addedAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateDetailData('phase-1', 'task-1', detailData, 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.detailData).toEqual(detailData);
  });

  it('should update form data for form task', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [
            {
              id: 'task-1',
              name: 'Form Task',
              description: '',
              order: 1,
              type: 'form' as const,
              completed: false,
              isBlocked: false,
              evidenceConfig: { type: 'form' as const, required: false },
              evidence: { text: '', images: [] },
              dependencies: [],
              checkItems: [],
              dynamicLinks: [],
              references: [],
              formData: [],
              formConfig: {
                layout: { type: 'vertical' as const },
                fields: []
              }
            }
          ],
          activities: [],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const formData = [{ fieldId: 'field-1', value: 'test value', filledAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateFormData('phase-1', 'task-1', formData);

    const state = useProcessStore.getState();
    const task = state.process?.phases[0].tasks[0];

    expect(task?.formData).toEqual(formData);
  });

  it('should update form data for task in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Form Task',
                  description: '',
                  order: 1,
                  type: 'form' as const,
                  completed: false,
                  isBlocked: false,
                  evidenceConfig: { type: 'form' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: [],
                  formData: [],
                  formConfig: {
                    layout: { type: 'vertical' as const },
                    fields: []
                  }
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const formData = [{ fieldId: 'field-1', value: 'test value', filledAt: '2024-01-01T00:00:00Z' }];
    useProcessStore.getState().updateFormData('phase-1', 'task-1', formData, 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.formData).toEqual(formData);
  });
});

describe('useProcessStore - Activity Operations', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should update task evidence in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Task 1',
                  description: '',
                  order: 1,
                  type: 'standard' as const,
                  completed: false,
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: []
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    const newEvidence = { text: 'New evidence', images: [] };
    useProcessStore.getState().updateTaskEvidence('phase-1', 'task-1', newEvidence, 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.evidence).toEqual(newEvidence);
  });

  it('should complete task in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Task 1',
                  description: '',
                  order: 1,
                  type: 'standard' as const,
                  completed: false,
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: []
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().completeTask('phase-1', 'task-1', 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.completed).toBe(true);
    expect(task?.completedAt).toBeDefined();
  });

  it('should uncomplete task in activity', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Task 1',
                  description: '',
                  order: 1,
                  type: 'standard' as const,
                  completed: true,
                  completedAt: '2024-01-01T00:00:00Z',
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: []
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().uncompleteTask('phase-1', 'task-1', 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task = activity?.tasks[0];

    expect(task?.completed).toBe(false);
    expect(task?.completedAt).toBeUndefined();
  });

  it('should uncomplete dependent tasks in other activities', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: '',
          order: 1,
          progress: 0,
          tasks: [],
          activities: [
            {
              id: 'activity-1',
              name: 'Activity 1',
              description: '',
              order: 1,
              progress: 0,
              tasks: [
                {
                  id: 'task-1',
                  name: 'Task 1',
                  description: '',
                  order: 1,
                  type: 'standard' as const,
                  completed: true,
                  completedAt: '2024-01-01T00:00:00Z',
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: [],
                  checkItems: [],
                  dynamicLinks: [],
                  references: []
                },
                {
                  id: 'task-2',
                  name: 'Task 2',
                  description: '',
                  order: 2,
                  type: 'standard' as const,
                  completed: true,
                  completedAt: '2024-01-01T00:00:00Z',
                  isBlocked: false,
                  evidenceConfig: { type: 'text' as const, required: false },
                  evidence: { text: '', images: [] },
                  dependencies: ['task-1'],
                  checkItems: [],
                  dynamicLinks: [],
                  references: []
                }
              ],
              dynamicLinks: [],
              images: []
            }
          ],
          dynamicLinks: []
        }
      ],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'idle' as const,
        sessions: [],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().uncompleteTask('phase-1', 'task-1', 'activity-1');

    const state = useProcessStore.getState();
    const activity = state.process?.phases[0].activities?.[0];
    const task1 = activity?.tasks[0];
    const task2 = activity?.tasks[1];

    expect(task1?.completed).toBe(false);
    expect(task1?.completedAt).toBeUndefined();
    expect(task2?.completed).toBe(false);
    expect(task2?.completedAt).toBeUndefined();
  });
});

describe('useProcessStore - Timer Operations', () => {
  beforeEach(() => {
    useProcessStore.setState({ process: null, hasStartedInteraction: false });
  });

  it('should pause process timer', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'running' as const,
        currentSessionStart: '2024-01-01T10:00:00Z',
        sessions: [{ id: 'session-1', startedAt: '2024-01-01T10:00:00Z', duration: 0 }],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().pauseProcessTimer();

    const state = useProcessStore.getState();
    const timeTracking = state.process?.timeTracking;

    expect(timeTracking?.status).toBe('paused');
    expect(timeTracking?.sessions[0]?.endedAt).toBeDefined();
    expect(timeTracking?.sessions[0]?.duration).toBeDefined();
  });

  it('should resume process timer', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'paused' as const,
        sessions: [{ id: 'session-1', startedAt: '2024-01-01T10:00:00Z', endedAt: '2024-01-01T11:00:00Z', duration: 3600000 }],
        totalActiveTime: 3600000
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().resumeProcessTimer();

    const state = useProcessStore.getState();
    const timeTracking = state.process?.timeTracking;

    expect(timeTracking?.status).toBe('running');
    expect(timeTracking?.currentSessionStart).toBeDefined();
  });

  it('should stop process timer', () => {
    const mockProcess = {
      id: 'test-process',
      name: 'Test Process',
      version: '1.0.0',
      description: 'Test',
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {},
      phases: [],
      loadedAt: '2024-01-01T00:00:00Z',
      progress: 0,
      timeTracking: {
        status: 'running' as const,
        currentSessionStart: '2024-01-01T10:00:00Z',
        sessions: [{ id: 'session-1', startedAt: '2024-01-01T10:00:00Z', duration: 0 }],
        totalActiveTime: 0
      }
    };
    useProcessStore.setState({ process: mockProcess });

    useProcessStore.getState().stopProcessTimer();

    const state = useProcessStore.getState();
    const timeTracking = state.process?.timeTracking;

    expect(timeTracking?.status).toBe('completed');
    expect(timeTracking?.sessions[0]?.endedAt).toBeDefined();
  });
});
