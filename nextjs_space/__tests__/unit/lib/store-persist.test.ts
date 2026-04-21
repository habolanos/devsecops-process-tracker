import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ProcessState } from '@/lib/types';

// ---------------------------------------------------------------------------
// Minimal in-memory localStorage polyfill so the persist middleware can run
// under Node without relying on jsdom quirks. Installed before the module
// under test is imported.
// ---------------------------------------------------------------------------

class MemoryStorage {
  private store = new Map<string, string>();
  getItem = (k: string) => (this.store.has(k) ? (this.store.get(k) as string) : null);
  setItem = (k: string, v: string) => {
    this.store.set(k, v);
  };
  removeItem = (k: string) => {
    this.store.delete(k);
  };
  clear = () => this.store.clear();
  key = (i: number) => Array.from(this.store.keys())[i] ?? null;
  get length() {
    return this.store.size;
  }
}

// ---------------------------------------------------------------------------
// Test fixture
// ---------------------------------------------------------------------------

const buildProcess = (): ProcessState => ({
  id: 'proc-alerts',
  name: 'Proc Alerts',
  description: '',
  version: '1.0.0',
  loadedAt: '2026-01-01T00:00:00Z',
  progress: 0,
  phases: [
    {
      id: 'p1',
      name: 'P1',
      description: '',
      order: 1,
      progress: 0,
      tasks: [
        {
          id: 't1',
          name: 'T1',
          description: '',
          order: 1,
          type: 'standard',
          checkItems: [],
          references: [],
          evidenceConfig: { type: 'text', required: false },
          dependencies: [],
          completed: true,
          completedAt: '2026-01-01T12:00:00Z',
          evidence: { text: 'persisted evidence', images: [] },
          isBlocked: false,
          dynamicLinks: [],
        },
      ],
      activities: [],
      dynamicLinks: [],
    },
  ],
  subprocesses: [],
  variableDefinitions: [],
  capturedVariables: { env: 'prod' },
  timeTracking: { status: 'idle', sessions: [], totalActiveTime: 0 },
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('process store persistence', () => {
  let store: typeof import('@/lib/store').useProcessStore;
  let memStorage: MemoryStorage;

  beforeEach(async () => {
    memStorage = new MemoryStorage();
    vi.stubGlobal('localStorage', memStorage);
    vi.resetModules();
    const mod = await import('@/lib/store');
    store = mod.useProcessStore;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // The compressed storage adapter debounces writes by 1000ms.
  const PERSIST_DEBOUNCE_MS = 1100;

  async function seedAndFlush(s: typeof store) {
    s.getState().loadProcess(buildProcess());
    await new Promise((r) => setTimeout(r, PERSIST_DEBOUNCE_MS));
  }

  it('persists only the progress envelope (no full process tree) under the expected key', async () => {
    await seedAndFlush(store);

    const rawKeys = Array.from({ length: memStorage.length }, (_, i) => memStorage.key(i)!);
    expect(rawKeys).toContain('process-tracker-storage');

    const raw = memStorage.getItem('process-tracker-storage');
    expect(raw).toBeTruthy();
    // Payload is LZ-compressed so we cannot grep for fields directly, but
    // size is the proxy: a progress envelope of one task plus timer + vars
    // should round-trip well below 2 KB. The full ProcessState for the
    // same fixture would be significantly larger once structure is added.
    expect((raw as string).length).toBeLessThan(2048);
  });

  it('rebuilds `process` from fresh YAML while preserving user progress, then flips hasHydrated', async () => {
    await seedAndFlush(store);

    const yamlContent = `
process:
  id: "proc-alerts"
  name: "Proc Alerts"
  description: ""
  version: "1.0.0"
  phases:
    - id: "p1"
      name: "P1"
      description: ""
      order: 1
      tasks:
        - id: "t1"
          name: "T1"
          order: 1
          evidence:
            type: "text"
            required: false
          completionAlert:
            severity: "critical"
            description: "Please confirm"
`;
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ content: yamlContent }),
    }));
    vi.stubGlobal('fetch', fetchMock);

    vi.resetModules();
    const mod = await import('@/lib/store');
    const reloaded = mod.useProcessStore;

    // Flush microtasks + macrotasks so onRehydrateStorage's IIFE completes.
    await new Promise((r) => setTimeout(r, 100));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/processes/proc-alerts'),
    );
    const s = reloaded.getState();
    expect(s.hasHydrated).toBe(true);
    // Structure comes from the fresh YAML — completionAlert must be present.
    const rebuiltTask = s.process?.phases[0]?.tasks?.[0];
    expect(rebuiltTask?.completionAlert).toEqual({
      severity: 'critical',
      description: 'Please confirm',
    });
    // Progress is preserved.
    expect(rebuiltTask?.completed).toBe(true);
    expect(rebuiltTask?.evidence?.text).toBe('persisted evidence');
    expect(s.process?.capturedVariables).toEqual({ env: 'prod' });
  });

  it('clears process and still flips hasHydrated when the YAML re-fetch fails', async () => {
    await seedAndFlush(store);

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })),
    );
    vi.resetModules();
    const mod = await import('@/lib/store');
    const reloaded = mod.useProcessStore;

    await new Promise((r) => setTimeout(r, 100));

    const s = reloaded.getState();
    expect(s.hasHydrated).toBe(true);
    expect(s.process).toBeNull();
  });

  it('flips hasHydrated immediately when no persisted progress exists', async () => {
    // No seed. Fresh store, fresh storage.
    await new Promise((r) => setTimeout(r, 50));
    expect(store.getState().hasHydrated).toBe(true);
    expect(store.getState().process).toBeNull();
  });
});
