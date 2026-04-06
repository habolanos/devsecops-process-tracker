import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { useProcessStore } from '@/lib/store';
import { ProcessState } from '@/lib/types';

// Mock compress/decompress
vi.mock('lz-string', () => ({
  compress: vi.fn((data: string) => `compressed:${data}`),
  decompress: vi.fn((data: string) => {
    if (data.startsWith('compressed:')) {
      return data.replace('compressed:', '');
    }
    return null;
  }),
}));

// Mock localStorage
const localStorageMock: Record<string, string> = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => localStorageMock[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageMock[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageMock[key];
    }),
  },
  writable: true,
});

describe('ProcessTimer - Auto-start on first interaction', () => {
  beforeEach(() => {
    // Reset store
    useProcessStore.setState({
      process: null,
      currentPhaseId: null,
      currentActivityId: null,
      currentTaskId: null,
      hasStartedInteraction: false,
    });
    // Clear localStorage mock
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
  });

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
        tasks: [],
        progress: 0,
        dynamicLinks: [],
        activities: [],
      },
    ],
    progress: 0,
    variableDefinitions: [],
    capturedVariables: {},
    loadedAt: new Date().toISOString(),
    subprocesses: [],
    timeTracking: {
      status: 'idle',
      sessions: [],
      totalActiveTime: 0,
    },
  });

  it('should start timer automatically when user changes phase', () => {
    const mockProcess = createMockProcess();
    
    act(() => {
      useProcessStore.getState().loadProcess(mockProcess);
    });

    const stateBefore = useProcessStore.getState();
    expect(stateBefore.process?.timeTracking.status).toBe('idle');
    expect(stateBefore.hasStartedInteraction).toBe(false);

    act(() => {
      useProcessStore.getState().setCurrentPhase('phase-2');
    });

    const stateAfter = useProcessStore.getState();
    expect(stateAfter.hasStartedInteraction).toBe(true);
    // Note: The actual timer start happens in ProcessTimer component via useEffect
    // This test verifies that the interaction flag is set correctly
  });

  it('should start timer automatically when user selects a task', () => {
    const mockProcess = createMockProcess();
    mockProcess.phases[0].tasks = [
      {
        id: 'task-1',
        name: 'Task 1',
        description: '',
        order: 1,
        completed: false,
        evidenceConfig: { type: 'text', required: false },
        evidence: { text: '', images: [] },
        dependencies: [],
        isBlocked: false,
        type: 'standard',
        dynamicLinks: [],
        references: [],
        checkItems: []
      }
    ];
    
    act(() => {
      useProcessStore.getState().loadProcess(mockProcess);
    });

    const stateBefore = useProcessStore.getState();
    expect(stateBefore.process?.timeTracking.status).toBe('idle');

    act(() => {
      useProcessStore.getState().setCurrentTask('task-1');
    });

    const stateAfter = useProcessStore.getState();
    expect(stateAfter.hasStartedInteraction).toBe(true);
  });

  it('should start timer automatically when user selects an activity', () => {
    const mockProcess = createMockProcess();
    mockProcess.phases[0].activities = [
      {
        id: 'activity-1',
        name: 'Activity 1',
        description: '',
        order: 1,
        tasks: [],
        progress: 0,
        dynamicLinks: [],
        images: []
      }
    ];
    
    act(() => {
      useProcessStore.getState().loadProcess(mockProcess);
    });

    const stateBefore = useProcessStore.getState();
    expect(stateBefore.process?.timeTracking.status).toBe('idle');

    act(() => {
      useProcessStore.getState().setCurrentActivity('activity-1');
    });

    const stateAfter = useProcessStore.getState();
    expect(stateAfter.hasStartedInteraction).toBe(true);
  });

  it('should not reset hasStartedInteraction when switching phases/tasks', () => {
    const mockProcess = createMockProcess();
    
    act(() => {
      useProcessStore.getState().loadProcess(mockProcess);
    });

    act(() => {
      useProcessStore.getState().setCurrentPhase('phase-2');
    });

    act(() => {
      useProcessStore.getState().setCurrentTask('task-1');
    });

    const state = useProcessStore.getState();
    expect(state.hasStartedInteraction).toBe(true);
  });

  it('should reset hasStartedInteraction when loading a new process', () => {
    const mockProcess = createMockProcess();
    
    act(() => {
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().setCurrentPhase('phase-2');
    });

    const stateBefore = useProcessStore.getState();
    expect(stateBefore.hasStartedInteraction).toBe(true);

    const newProcess = createMockProcess();
    newProcess.id = 'new-process';
    
    act(() => {
      useProcessStore.getState().loadProcess(newProcess);
    });

    const stateAfter = useProcessStore.getState();
    expect(stateAfter.hasStartedInteraction).toBe(false);
  });
});
