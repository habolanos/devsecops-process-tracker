'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProcessState, TaskEvidence, CapturedVariables } from './types';
import { updateProgress, updateTaskBlockedStatus } from './helpers';

interface ProcessStore {
  process: ProcessState | null;
  currentPhaseId: string | null;
  currentTaskId: string | null;
  
  // Actions
  loadProcess: (process: ProcessState) => void;
  clearProcess: () => void;
  setCurrentPhase: (phaseId: string) => void;
  setCurrentTask: (taskId: string | null) => void;
  
  updateTaskEvidence: (phaseId: string, taskId: string, evidence: Partial<TaskEvidence>) => void;
  completeTask: (phaseId: string, taskId: string) => void;
  uncompleteTask: (phaseId: string, taskId: string) => void;
  
  markProcessComplete: () => void;
  
  // Variable Actions
  updateCapturedVariables: (variables: CapturedVariables) => void;
  updateSingleVariable: (key: string, value: string) => void;
  areRequiredVariablesFilled: () => boolean;
}

export const useProcessStore = create<ProcessStore>()(persist(
  (set, get) => ({
    process: null,
    currentPhaseId: null,
    currentTaskId: null,

    loadProcess: (process) => {
      const updated = updateTaskBlockedStatus(updateProgress(process));
      set({
        process: updated,
        currentPhaseId: updated.phases?.[0]?.id ?? null,
        currentTaskId: null
      });
    },

    clearProcess: () => {
      set({
        process: null,
        currentPhaseId: null,
        currentTaskId: null
      });
    },

    setCurrentPhase: (phaseId) => {
      set({ currentPhaseId: phaseId, currentTaskId: null });
    },

    setCurrentTask: (taskId) => {
      set({ currentTaskId: taskId });
    },

    updateTaskEvidence: (phaseId, taskId, evidence) => {
      set((state) => {
        if (!state.process) return state;

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          return {
            ...phase,
            tasks: phase.tasks.map((task) => {
              if (task?.id !== taskId) return task;

              return {
                ...task,
                evidence: {
                  ...task.evidence,
                  ...evidence,
                  images: evidence.images ?? task.evidence.images
                }
              };
            })
          };
        });

        const updatedProcess = updateProgress({
          ...state.process,
          phases: updatedPhases
        });

        return { process: updatedProcess };
      });
    },

    completeTask: (phaseId, taskId) => {
      set((state) => {
        if (!state.process) return state;

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          return {
            ...phase,
            tasks: phase.tasks.map((task) => {
              if (task?.id !== taskId) return task;

              return {
                ...task,
                completed: true,
                completedAt: new Date().toISOString()
              };
            })
          };
        });

        let updatedProcess = updateProgress({
          ...state.process,
          phases: updatedPhases
        });

        // Update blocked status after completion
        updatedProcess = updateTaskBlockedStatus(updatedProcess);

        return { process: updatedProcess };
      });
    },

    uncompleteTask: (phaseId, taskId) => {
      set((state) => {
        if (!state.process) return state;

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          return {
            ...phase,
            tasks: phase.tasks.map((task) => {
              if (task?.id !== taskId) return task;

              return {
                ...task,
                completed: false,
                completedAt: undefined
              };
            })
          };
        });

        let updatedProcess = updateProgress({
          ...state.process,
          phases: updatedPhases
        });

        // Update blocked status
        updatedProcess = updateTaskBlockedStatus(updatedProcess);

        return { process: updatedProcess };
      });
    },

    markProcessComplete: () => {
      set((state) => {
        if (!state.process) return state;

        return {
          process: {
            ...state.process,
            completedAt: new Date().toISOString()
          }
        };
      });
    },

    updateCapturedVariables: (variables) => {
      set((state) => {
        if (!state.process) return state;

        return {
          process: {
            ...state.process,
            capturedVariables: {
              ...state.process.capturedVariables,
              ...variables
            }
          }
        };
      });
    },

    updateSingleVariable: (key, value) => {
      set((state) => {
        if (!state.process) return state;

        return {
          process: {
            ...state.process,
            capturedVariables: {
              ...state.process.capturedVariables,
              [key]: value
            }
          }
        };
      });
    },

    areRequiredVariablesFilled: (): boolean => {
      const currentState = get();
      if (!currentState.process) return false;
      
      const { variableDefinitions, capturedVariables } = currentState.process;
      if (!variableDefinitions || variableDefinitions.length === 0) return true;
      
      return variableDefinitions
        .filter((v) => v.required)
        .every((v) => capturedVariables[v.key] && capturedVariables[v.key].trim() !== '');
    }
  }),
  {
    name: 'process-tracker-storage'
  }
));
