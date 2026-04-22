/**
 * Tests for the session-level process tray store (`lib/session-store.ts`).
 *
 * The primary invariant under test is:
 *
 *   "The user cannot remove from the tray the process they are currently
 *    working on (the one whose `trayId` equals `activeTrayId`)."
 *
 * All UI entry points that previously wrote straight to the store
 * (`components/process-tabs.tsx`, `app/process/_components/process-tray.tsx`,
 * `components/command-palette.tsx`, `app/page.tsx`) now hide their
 * Remove/Close affordance for the active tray item; this suite makes sure
 * the *store-level* guard behind them still refuses the operation even if
 * a future call-site forgets the UI gate.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useSessionStore } from '@/lib/session-store';
import { ProcessState } from '@/lib/types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeProcess = (overrides: Partial<ProcessState> = {}): ProcessState => ({
  id: overrides.id ?? 'proc-1',
  name: overrides.name ?? 'Proceso de Prueba',
  description: '',
  version: '1.0.0',
  loadedAt: new Date().toISOString(),
  progress: overrides.progress ?? 0,
  phases: [],
  subprocesses: [],
  variableDefinitions: [],
  capturedVariables: {},
  timeTracking: {
    status: 'idle',
    sessions: [],
    totalActiveTime: 0,
  },
  ...overrides,
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Reset the store to a pristine empty state before every test. */
function resetStore() {
  useSessionStore.setState({
    sessionId: '',
    sessionStartedAt: '',
    processes: [],
    activeTrayId: null,
  });
}

/** Seed two processes into the tray and return their trayIds. */
function seedTwoProcesses(): { firstId: string; secondId: string } {
  const store = useSessionStore.getState();
  const firstId = store.addProcess(makeProcess({ id: 'proc-a', name: 'Proc A' }));
  const secondId = store.addProcess(makeProcess({ id: 'proc-b', name: 'Proc B' }));
  return { firstId, secondId };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('useSessionStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // -------------------------------------------------------------------------
  // addProcess
  // -------------------------------------------------------------------------

  describe('addProcess', () => {
    it('appends the process to the tray and marks it active', () => {
      const trayId = useSessionStore.getState().addProcess(makeProcess());

      const state = useSessionStore.getState();
      expect(state.processes).toHaveLength(1);
      expect(state.processes[0].trayId).toBe(trayId);
      expect(state.processes[0].status).toBe('active');
      expect(state.activeTrayId).toBe(trayId);
    });

    it('pauses the previously active process when a new one is added', () => {
      const { firstId, secondId } = seedTwoProcesses();

      const state = useSessionStore.getState();
      const first = state.processes.find((p) => p.trayId === firstId)!;
      const second = state.processes.find((p) => p.trayId === secondId)!;

      expect(first.status).toBe('paused');
      expect(first.pausedAt).toBeDefined();
      expect(second.status).toBe('active');
      expect(state.activeTrayId).toBe(secondId);
    });

    it('snapshots the progress at add time (decimal → percentage)', () => {
      const trayId = useSessionStore
        .getState()
        .addProcess(makeProcess({ progress: 0.42 }));

      const item = useSessionStore
        .getState()
        .processes.find((p) => p.trayId === trayId)!;
      expect(item.progress).toBe(42);
    });
  });

  // -------------------------------------------------------------------------
  // switchToProcess
  // -------------------------------------------------------------------------

  describe('switchToProcess', () => {
    it('activates the target and pauses the previous active one', () => {
      const { firstId, secondId } = seedTwoProcesses();

      const returned = useSessionStore.getState().switchToProcess(firstId);

      expect(returned?.id).toBe('proc-a');
      const state = useSessionStore.getState();
      expect(state.activeTrayId).toBe(firstId);
      expect(state.processes.find((p) => p.trayId === firstId)!.status).toBe('active');
      expect(state.processes.find((p) => p.trayId === secondId)!.status).toBe('paused');
    });

    it('returns null when the target does not exist', () => {
      seedTwoProcesses();
      const returned = useSessionStore.getState().switchToProcess('missing');
      expect(returned).toBeNull();
    });

    it('refuses to switch to a completed or cancelled item', () => {
      const { firstId, secondId } = seedTwoProcesses();
      useSessionStore.getState().cancelProcess(firstId);

      const returned = useSessionStore.getState().switchToProcess(firstId);

      expect(returned).toBeNull();
      // activeTrayId must not change.
      expect(useSessionStore.getState().activeTrayId).toBe(secondId);
    });
  });

  // -------------------------------------------------------------------------
  // removeFromTray — the critical invariant
  // -------------------------------------------------------------------------

  describe('removeFromTray (active-process guard)', () => {
    it('REJECTS removing the currently active tray entry', () => {
      const { firstId, secondId } = seedTwoProcesses();
      // secondId is the active one after seedTwoProcesses().
      const beforeLength = useSessionStore.getState().processes.length;

      const result = useSessionStore.getState().removeFromTray(secondId);

      expect(result).toBe(false);
      const state = useSessionStore.getState();
      expect(state.processes).toHaveLength(beforeLength);
      expect(state.processes.find((p) => p.trayId === secondId)).toBeDefined();
      expect(state.activeTrayId).toBe(secondId);
      // The sibling process is untouched by the rejected call.
      expect(state.processes.find((p) => p.trayId === firstId)).toBeDefined();
    });

    it('allows removing a non-active tray entry and returns true', () => {
      const { firstId, secondId } = seedTwoProcesses();
      // firstId is paused (non-active).

      const result = useSessionStore.getState().removeFromTray(firstId);

      expect(result).toBe(true);
      const state = useSessionStore.getState();
      expect(state.processes).toHaveLength(1);
      expect(state.processes[0].trayId).toBe(secondId);
      expect(state.activeTrayId).toBe(secondId);
    });

    it('allows removing any entry when there is no active process', () => {
      const trayId = useSessionStore.getState().addProcess(makeProcess());
      // Simulate the "no active" state (e.g. after pauseCurrentProcess).
      useSessionStore.setState({ activeTrayId: null });

      const result = useSessionStore.getState().removeFromTray(trayId);

      expect(result).toBe(true);
      expect(useSessionStore.getState().processes).toHaveLength(0);
    });

    it('keeps the guard invariant across a complete → remove flow', () => {
      const { firstId, secondId } = seedTwoProcesses();

      // Complete the active one; this should null out activeTrayId so the
      // item becomes removable afterwards.
      useSessionStore
        .getState()
        .completeProcess(secondId, makeProcess({ id: 'proc-b', progress: 1 }));
      expect(useSessionStore.getState().activeTrayId).toBeNull();

      const result = useSessionStore.getState().removeFromTray(secondId);

      expect(result).toBe(true);
      const state = useSessionStore.getState();
      expect(state.processes.map((p) => p.trayId)).toEqual([firstId]);
    });

    it('keeps the guard invariant across a cancel → remove flow', () => {
      const { firstId, secondId } = seedTwoProcesses();

      useSessionStore.getState().cancelProcess(secondId);
      expect(useSessionStore.getState().activeTrayId).toBeNull();

      const result = useSessionStore.getState().removeFromTray(secondId);

      expect(result).toBe(true);
      expect(
        useSessionStore.getState().processes.map((p) => p.trayId)
      ).toEqual([firstId]);
    });

    it('is idempotent for a non-existent trayId (returns true, no mutation)', () => {
      seedTwoProcesses();
      const snapshotBefore = useSessionStore.getState().processes;

      const result = useSessionStore.getState().removeFromTray('does-not-exist');

      // Current contract: the filter produces the same array shape.
      // `true` signals "the guard did not reject"; the caller can treat
      // a missing id as already-removed without needing a separate check.
      expect(result).toBe(true);
      expect(useSessionStore.getState().processes).toHaveLength(
        snapshotBefore.length
      );
    });
  });

  // -------------------------------------------------------------------------
  // completeProcess / cancelProcess
  // -------------------------------------------------------------------------

  describe('completeProcess', () => {
    it('marks the item completed, bumps progress to 100 and clears activeTrayId if it was active', () => {
      const { secondId } = seedTwoProcesses();
      const finished = makeProcess({ id: 'proc-b', progress: 1 });

      useSessionStore.getState().completeProcess(secondId, finished);

      const state = useSessionStore.getState();
      const item = state.processes.find((p) => p.trayId === secondId)!;
      expect(item.status).toBe('completed');
      expect(item.progress).toBe(100);
      expect(item.completedAt).toBeDefined();
      expect(state.activeTrayId).toBeNull();
    });

    it('does not clear activeTrayId when completing a non-active item', () => {
      const { firstId, secondId } = seedTwoProcesses();
      // Completing `firstId` (paused) must not disturb `secondId` (active).
      useSessionStore
        .getState()
        .completeProcess(firstId, makeProcess({ id: 'proc-a', progress: 1 }));

      expect(useSessionStore.getState().activeTrayId).toBe(secondId);
    });
  });

  describe('cancelProcess', () => {
    it('marks the item cancelled and clears activeTrayId if it was active', () => {
      const { secondId } = seedTwoProcesses();

      useSessionStore.getState().cancelProcess(secondId);

      const state = useSessionStore.getState();
      const item = state.processes.find((p) => p.trayId === secondId)!;
      expect(item.status).toBe('cancelled');
      expect(item.cancelledAt).toBeDefined();
      expect(state.activeTrayId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // updateSnapshot / queries
  // -------------------------------------------------------------------------

  describe('updateSnapshot', () => {
    it('replaces the stored snapshot and syncs progress', () => {
      const trayId = useSessionStore.getState().addProcess(makeProcess());

      const updated = makeProcess({ progress: 0.75 });
      useSessionStore.getState().updateSnapshot(trayId, updated);

      const item = useSessionStore
        .getState()
        .processes.find((p) => p.trayId === trayId)!;
      expect(item.progress).toBe(75);
      expect(item.snapshot.progress).toBe(0.75);
      expect(item.lastActiveAt).toBeDefined();
    });
  });

  describe('query helpers', () => {
    it('getActiveProcess returns the active tray item or null', () => {
      expect(useSessionStore.getState().getActiveProcess()).toBeNull();

      const { secondId } = seedTwoProcesses();
      const active = useSessionStore.getState().getActiveProcess();
      expect(active?.trayId).toBe(secondId);
    });

    it('getProcessCount reflects the tray size', () => {
      expect(useSessionStore.getState().getProcessCount()).toBe(0);
      seedTwoProcesses();
      expect(useSessionStore.getState().getProcessCount()).toBe(2);
    });

    it('getProcessesByStatus filters correctly', () => {
      const { firstId, secondId } = seedTwoProcesses();
      const byStatus = useSessionStore.getState().getProcessesByStatus;

      expect(byStatus('active').map((p) => p.trayId)).toEqual([secondId]);
      expect(byStatus('paused').map((p) => p.trayId)).toEqual([firstId]);
      expect(byStatus('completed')).toEqual([]);
      expect(byStatus('cancelled')).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // initSession / clearSession
  // -------------------------------------------------------------------------

  describe('initSession', () => {
    it('assigns a sessionId and sessionStartedAt on first call only', () => {
      useSessionStore.getState().initSession();
      const first = useSessionStore.getState();
      expect(first.sessionId).not.toBe('');
      expect(first.sessionStartedAt).not.toBe('');

      // Call again; must not overwrite the existing session identifiers.
      useSessionStore.getState().initSession();
      const second = useSessionStore.getState();
      expect(second.sessionId).toBe(first.sessionId);
      expect(second.sessionStartedAt).toBe(first.sessionStartedAt);
    });
  });

  describe('clearSession', () => {
    it('empties the tray and drops the active reference', () => {
      seedTwoProcesses();
      expect(useSessionStore.getState().processes).toHaveLength(2);

      useSessionStore.getState().clearSession();

      const state = useSessionStore.getState();
      expect(state.processes).toEqual([]);
      expect(state.activeTrayId).toBeNull();
    });
  });
});
