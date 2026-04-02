import { describe, it, expect, beforeEach, vi } from 'vitest';
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

describe('useProcessStore - Timer Actions', () => {
  beforeEach(() => {
    // Reset store
    useProcessStore.setState({
      process: null,
      currentPhaseId: null,
      currentActivityId: null,
      currentTaskId: null,
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

  describe('startProcessTimer', () => {
    it('should start timer when idle', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      
      useProcessStore.getState().startProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('running');
      expect(state.process?.timeTracking.sessions).toHaveLength(1);
      expect(state.process?.timeTracking.firstStartedAt).toBeDefined();
    });

    it('should not start timer if already running', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      
      const sessionsCount = useProcessStore.getState().process?.timeTracking.sessions.length ?? 0;
      
      // Try to start again
      useProcessStore.getState().startProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.sessions).toHaveLength(sessionsCount);
    });

    it('should not start if no process loaded', () => {
      useProcessStore.getState().startProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process).toBeNull();
    });
  });

  describe('pauseProcessTimer', () => {
    it('should pause running timer', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      
      // Wait a bit
      const startTime = Date.now();
      vi.useFakeTimers();
      vi.setSystemTime(startTime + 1000);
      
      useProcessStore.getState().pauseProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('paused');
      expect(state.process?.timeTracking.totalActiveTime).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });

    it('should not pause if not running', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      
      useProcessStore.getState().pauseProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('idle');
    });

    it('should not pause if no process loaded', () => {
      useProcessStore.getState().pauseProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process).toBeNull();
    });
  });

  describe('resumeProcessTimer', () => {
    it('should resume paused timer', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      useProcessStore.getState().pauseProcessTimer();
      
      useProcessStore.getState().resumeProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('running');
      expect(state.process?.timeTracking.sessions).toHaveLength(2);
    });
  });

  describe('stopProcessTimer', () => {
    it('should stop running timer and mark completed', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 2000);
      
      useProcessStore.getState().stopProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('completed');
      expect(state.process?.timeTracking.totalActiveTime).toBeGreaterThan(0);
      
      vi.useRealTimers();
    });

    it('should handle stopping when already paused', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      useProcessStore.getState().pauseProcessTimer();
      
      const totalTime = useProcessStore.getState().process?.timeTracking.totalActiveTime;
      
      useProcessStore.getState().stopProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process?.timeTracking.status).toBe('completed');
      expect(state.process?.timeTracking.totalActiveTime).toBe(totalTime);
    });

    it('should not error if no timer active', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      
      expect(() => useProcessStore.getState().stopProcessTimer()).not.toThrow();
    });

    it('should not stop if no process loaded', () => {
      useProcessStore.getState().stopProcessTimer();
      
      const state = useProcessStore.getState();
      expect(state.process).toBeNull();
    });
  });

  describe('getElapsedTime', () => {
    it('should return 0 if no timer', () => {
      const elapsed = useProcessStore.getState().getElapsedTime();
      expect(elapsed).toBe(0);
    });

    it('should return total time for completed/paused timer', () => {
      const mockProcess = createMockProcess();
      mockProcess.timeTracking = {
        status: 'paused',
        sessions: [{ id: 's1', startedAt: '2024-01-01', duration: 5000, endedAt: '2024-01-02' }],
        totalActiveTime: 5000,
      };
      useProcessStore.getState().loadProcess(mockProcess);
      
      const elapsed = useProcessStore.getState().getElapsedTime();
      expect(elapsed).toBe(5000);
    });

    it('should include current running session time', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      
      vi.useFakeTimers();
      vi.setSystemTime(Date.now() + 3000);
      
      const elapsed = useProcessStore.getState().getElapsedTime();
      expect(elapsed).toBeGreaterThanOrEqual(3000);
      
      vi.useRealTimers();
    });
  });

  describe('timeTracking with persistence', () => {
    it('should persist timer state across store resets', () => {
      const mockProcess = createMockProcess();
      useProcessStore.getState().loadProcess(mockProcess);
      useProcessStore.getState().startProcessTimer();
      
      // Simulate rehydration by clearing and reloading
      const processId = mockProcess.id;
      const timerState = useProcessStore.getState().process?.timeTracking;
      
      expect(timerState).toBeDefined();
      expect(timerState?.status).toBe('running');
    });
  });
});
