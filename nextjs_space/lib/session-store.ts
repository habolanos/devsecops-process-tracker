'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createCompressedStorage } from './persist-storage';
import { ProcessState } from './types';

// ============================================
// Process Tray Types
// ============================================

export type ProcessTrayStatus = 'active' | 'paused' | 'completed' | 'cancelled';

export interface ProcessTrayItem {
  trayId: string;
  processId: string;
  processName: string;
  status: ProcessTrayStatus;
  progress: number;
  startedAt: string;
  lastActiveAt: string;
  pausedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  totalActiveTime: number;
  snapshot: ProcessState;
}

// ============================================
// Session Store Interface
// ============================================

interface SessionStore {
  sessionId: string;
  sessionStartedAt: string;
  processes: ProcessTrayItem[];
  activeTrayId: string | null;

  // Actions
  initSession: () => void;
  addProcess: (process: ProcessState) => string;
  switchToProcess: (trayId: string) => ProcessState | null;
  pauseCurrentProcess: (snapshot: ProcessState) => void;
  completeProcess: (trayId: string, snapshot: ProcessState) => void;
  cancelProcess: (trayId: string) => void;
  removeFromTray: (trayId: string) => void;
  updateSnapshot: (trayId: string, snapshot: ProcessState) => void;
  getActiveProcess: () => ProcessTrayItem | null;
  getProcessCount: () => number;
  getProcessesByStatus: (status: ProcessTrayStatus) => ProcessTrayItem[];
  clearSession: () => void;
}

// ============================================
// Session Store Implementation
// ============================================

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessionId: '',
      sessionStartedAt: '',
      processes: [],
      activeTrayId: null,

      initSession: () => {
        const state = get();
        if (!state.sessionId) {
          set({
            sessionId: `session-${Date.now()}`,
            sessionStartedAt: new Date().toISOString(),
          });
        }
      },

      addProcess: (process) => {
        const trayId = `tray-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();

        const { activeTrayId, processes } = get();
        let updatedProcesses = [...processes];

        // Pause current active process if exists
        if (activeTrayId) {
          updatedProcesses = updatedProcesses.map((p) =>
            p.trayId === activeTrayId
              ? { ...p, status: 'paused' as const, pausedAt: now }
              : p
          );
        }

        const newItem: ProcessTrayItem = {
          trayId,
          processId: process.id,
          processName: process.name,
          status: 'active',
          progress: Math.round(process.progress * 100),
          startedAt: now,
          lastActiveAt: now,
          totalActiveTime: process.timeTracking?.totalActiveTime || 0,
          snapshot: process,
        };

        set({
          processes: [...updatedProcesses, newItem],
          activeTrayId: trayId,
        });

        return trayId;
      },

      switchToProcess: (trayId) => {
        const { processes, activeTrayId } = get();
        const target = processes.find((p) => p.trayId === trayId);

        if (!target || target.status === 'completed' || target.status === 'cancelled') {
          return null;
        }

        const now = new Date().toISOString();

        set({
          processes: processes.map((p) => {
            if (p.trayId === activeTrayId && p.trayId !== trayId) {
              return { ...p, status: 'paused' as const, pausedAt: now };
            }
            if (p.trayId === trayId) {
              return {
                ...p,
                status: 'active' as const,
                lastActiveAt: now,
                pausedAt: undefined,
              };
            }
            return p;
          }),
          activeTrayId: trayId,
        });

        return target.snapshot;
      },

      pauseCurrentProcess: (snapshot) => {
        const { activeTrayId, processes } = get();
        if (!activeTrayId) return;

        const now = new Date().toISOString();
        set({
          processes: processes.map((p) =>
            p.trayId === activeTrayId
              ? {
                  ...p,
                  status: 'paused' as const,
                  pausedAt: now,
                  snapshot,
                  progress: Math.round(snapshot.progress * 100),
                  totalActiveTime: snapshot.timeTracking?.totalActiveTime || p.totalActiveTime,
                }
              : p
          ),
          activeTrayId: null,
        });
      },

      completeProcess: (trayId, snapshot) => {
        const now = new Date().toISOString();
        set((state) => ({
          processes: state.processes.map((p) =>
            p.trayId === trayId
              ? {
                  ...p,
                  status: 'completed' as const,
                  completedAt: now,
                  snapshot,
                  progress: 100,
                  totalActiveTime: snapshot.timeTracking?.totalActiveTime || p.totalActiveTime,
                }
              : p
          ),
          activeTrayId: state.activeTrayId === trayId ? null : state.activeTrayId,
        }));
      },

      cancelProcess: (trayId) => {
        const now = new Date().toISOString();
        set((state) => ({
          processes: state.processes.map((p) =>
            p.trayId === trayId
              ? { ...p, status: 'cancelled' as const, cancelledAt: now }
              : p
          ),
          activeTrayId: state.activeTrayId === trayId ? null : state.activeTrayId,
        }));
      },

      removeFromTray: (trayId) => {
        set((state) => ({
          processes: state.processes.filter((p) => p.trayId !== trayId),
          activeTrayId: state.activeTrayId === trayId ? null : state.activeTrayId,
        }));
      },

      updateSnapshot: (trayId, snapshot) => {
        set((state) => ({
          processes: state.processes.map((p) =>
            p.trayId === trayId
              ? {
                  ...p,
                  snapshot,
                  progress: Math.round(snapshot.progress * 100),
                  lastActiveAt: new Date().toISOString(),
                  totalActiveTime: snapshot.timeTracking?.totalActiveTime || p.totalActiveTime,
                }
              : p
          ),
        }));
      },

      getActiveProcess: () => {
        const { processes, activeTrayId } = get();
        return processes.find((p) => p.trayId === activeTrayId) || null;
      },

      getProcessCount: () => get().processes.length,

      getProcessesByStatus: (status) => {
        return get().processes.filter((p) => p.status === status);
      },

      clearSession: () => {
        set({
          sessionId: `session-${Date.now()}`,
          sessionStartedAt: new Date().toISOString(),
          processes: [],
          activeTrayId: null,
        });
      },
    }),
    {
      name: 'process-session-storage',
      storage: createCompressedStorage<SessionStore>(),
    }
  )
);
