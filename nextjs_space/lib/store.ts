'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ProcessState, TaskEvidence, CapturedVariables, WorkSession } from './types';
import { updateProgress, updateTaskBlockedStatus, getAllDependentTasks } from './helpers';
import { createCompressedStorage } from './persist-storage';

interface ProcessStore {
  process: ProcessState | null;
  currentPhaseId: string | null;
  currentActivityId: string | null;
  currentTaskId: string | null;
  hasStartedInteraction: boolean; // Track if user has interacted with the process
  
  // Actions
  loadProcess: (process: ProcessState) => void;
  clearProcess: () => void;
  setCurrentPhase: (phaseId: string) => void;
  setCurrentActivity: (activityId: string | null) => void;
  setCurrentTask: (taskId: string | null) => void;
  markInteractionStarted: () => void; // Mark that user has started interacting
  
  updateTaskEvidence: (phaseId: string, taskId: string, evidence: Partial<TaskEvidence>, activityId?: string) => void;
  completeTask: (phaseId: string, taskId: string, activityId?: string) => void;
  uncompleteTask: (phaseId: string, taskId: string, activityId?: string) => void;
  
  // CheckItem Actions (for check/multicheck tasks)
  toggleCheckItem: (phaseId: string, taskId: string, checkItemId: string, activityId?: string) => void;
  canCompleteCheckTask: (phaseId: string, taskId: string, activityId?: string) => boolean;
  
  markProcessComplete: () => void;
  
  // Variable Actions
  updateCapturedVariables: (variables: CapturedVariables) => void;
  updateSingleVariable: (key: string, value: string) => void;
  areRequiredVariablesFilled: () => boolean;
  
  // Timer Actions
  startProcessTimer: () => void;
  pauseProcessTimer: () => void;
  resumeProcessTimer: () => void;
  stopProcessTimer: () => void;
  getElapsedTime: () => number;
}

export const useProcessStore = create<ProcessStore>()(persist(
  (set, get) => ({
    process: null,
    currentPhaseId: null,
    currentActivityId: null,
    currentTaskId: null,
    hasStartedInteraction: false,

    loadProcess: (process) => {
      const updated = updateTaskBlockedStatus(updateProgress(process));
      set({
        process: updated,
        currentPhaseId: updated.phases?.[0]?.id ?? null,
        currentActivityId: null,
        currentTaskId: null,
        hasStartedInteraction: false // Reset interaction flag on new process load
      });
    },

    clearProcess: () => {
      set({
        process: null,
        currentPhaseId: null,
        currentActivityId: null,
        currentTaskId: null,
        hasStartedInteraction: false
      });
    },

    setCurrentPhase: (phaseId) => {
      set((state) => ({
        currentPhaseId: phaseId,
        currentActivityId: null,
        currentTaskId: null,
        hasStartedInteraction: true // Mark interaction on phase change
      }));
    },

    setCurrentActivity: (activityId) => {
      set((state) => ({
        currentActivityId: activityId,
        currentTaskId: null,
        hasStartedInteraction: true // Mark interaction on activity change
      }));
    },

    setCurrentTask: (taskId) => {
      set((state) => ({
        currentTaskId: taskId,
        hasStartedInteraction: true // Mark interaction on task selection
      }));
    },

    markInteractionStarted: () => {
      set({ hasStartedInteraction: true });
    },

    updateTaskEvidence: (phaseId, taskId, evidence, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          // Update task in activity
          if (activityId) {
            return {
              ...phase,
              activities: (phase.activities ?? []).map((activity) => {
                if (activity?.id !== activityId) return activity;
                return {
                  ...activity,
                  tasks: activity.tasks.map((task) => {
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
              })
            };
          }

          // Update direct task
          return {
            ...phase,
            tasks: (phase.tasks ?? []).map((task) => {
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

    completeTask: (phaseId, taskId, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          // Complete task in activity
          if (activityId) {
            return {
              ...phase,
              activities: (phase.activities ?? []).map((activity) => {
                if (activity?.id !== activityId) return activity;
                return {
                  ...activity,
                  tasks: activity.tasks.map((task) => {
                    if (task?.id !== taskId) return task;
                    return {
                      ...task,
                      completed: true,
                      completedAt: new Date().toISOString()
                    };
                  })
                };
              })
            };
          }

          // Complete direct task
          return {
            ...phase,
            tasks: (phase.tasks ?? []).map((task) => {
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

    uncompleteTask: (phaseId, taskId, activityId) => {
      set((state) => {
        if (!state.process) return state;

        // Get all tasks that depend on this task (cascade)
        const dependentIds = getAllDependentTasks(taskId, state.process);
        const allIdsToUncomplete = [taskId, ...dependentIds];

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) {
            // Also process other phases that might have dependent tasks
            return {
              ...phase,
              tasks: (phase.tasks ?? []).map((task) => {
                if (allIdsToUncomplete.includes(task.id)) {
                  return { ...task, completed: false, completedAt: undefined };
                }
                return task;
              }),
              activities: (phase.activities ?? []).map((activity) => ({
                ...activity,
                tasks: activity.tasks.map((task) => {
                  if (allIdsToUncomplete.includes(task.id)) {
                    return { ...task, completed: false, completedAt: undefined };
                  }
                  return task;
                })
              }))
            };
          }

          // Uncomplete task in activity
          if (activityId) {
            return {
              ...phase,
              activities: (phase.activities ?? []).map((activity) => {
                if (activity?.id !== activityId) {
                  // Check for dependent tasks in other activities
                  return {
                    ...activity,
                    tasks: activity.tasks.map((task) => {
                      if (allIdsToUncomplete.includes(task.id)) {
                        return { ...task, completed: false, completedAt: undefined };
                      }
                      return task;
                    })
                  };
                }
                return {
                  ...activity,
                  tasks: activity.tasks.map((task) => {
                    if (allIdsToUncomplete.includes(task.id)) {
                      return { ...task, completed: false, completedAt: undefined };
                    }
                    return task;
                  })
                };
              })
            };
          }

          // Uncomplete direct task
          return {
            ...phase,
            tasks: (phase.tasks ?? []).map((task) => {
              if (allIdsToUncomplete.includes(task.id)) {
                return { ...task, completed: false, completedAt: undefined };
              }
              return task;
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

    toggleCheckItem: (phaseId, taskId, checkItemId, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updateCheckItems = (task: any) => {
          if (task?.id !== taskId) return task;
          return {
            ...task,
            checkItems: task.checkItems.map((item: any) => {
              if (item.id !== checkItemId) return item;
              return {
                ...item,
                checked: !item.checked,
                checkedAt: !item.checked ? new Date().toISOString() : undefined
              };
            })
          };
        };

        const updatedPhases = state.process.phases.map((phase) => {
          if (phase?.id !== phaseId) return phase;

          if (activityId) {
            return {
              ...phase,
              activities: (phase.activities ?? []).map((activity) => {
                if (activity?.id !== activityId) return activity;
                return {
                  ...activity,
                  tasks: activity.tasks.map(updateCheckItems)
                };
              })
            };
          }

          return {
            ...phase,
            tasks: (phase.tasks ?? []).map(updateCheckItems)
          };
        });

        return {
          process: {
            ...state.process,
            phases: updatedPhases
          }
        };
      });
    },

    canCompleteCheckTask: (phaseId, taskId, activityId): boolean => {
      const currentState = get();
      if (!currentState.process) return false;

      const phase = currentState.process.phases.find((p) => p?.id === phaseId);
      if (!phase) return false;

      let task;
      if (activityId) {
        const activity = phase.activities?.find((a) => a?.id === activityId);
        task = activity?.tasks?.find((t) => t?.id === taskId);
      } else {
        task = phase.tasks?.find((t) => t?.id === taskId);
      }

      if (!task) return false;

      // For standard tasks, always completable (evidence check handled elsewhere)
      if (task.type === 'standard') return true;

      // For check/multicheck tasks, all required checkItems must be checked
      const requiredItems = task.checkItems.filter((item) => item.required);
      return requiredItems.every((item) => item.checked);
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
    },

    startProcessTimer: () => {
      set((state) => {
        if (!state.process) return state;
        
        const now = new Date().toISOString();
        const timeTracking = state.process.timeTracking || {
          status: 'idle',
          sessions: [],
          totalActiveTime: 0
        };
        
        // Don't start if already running
        if (timeTracking.status === 'running') return state;
        
        const newSession: WorkSession = {
          id: `session-${Date.now()}`,
          startedAt: now,
          duration: 0
        };
        
        return {
          process: {
            ...state.process,
            timeTracking: {
              ...timeTracking,
              status: 'running',
              firstStartedAt: timeTracking.firstStartedAt || now,
              currentSessionStart: now,
              sessions: [...timeTracking.sessions, newSession]
            }
          }
        };
      });
    },

    pauseProcessTimer: () => {
      set((state) => {
        if (!state.process?.timeTracking) return state;
        
        const { timeTracking } = state.process;
        if (timeTracking.status !== 'running') return state;
        
        const now = new Date().toISOString();
        const currentSessionStart = timeTracking.currentSessionStart;
        
        // Calculate duration for current session
        const sessionDuration = currentSessionStart 
          ? new Date(now).getTime() - new Date(currentSessionStart).getTime()
          : 0;
        
        // Update the last session with end time and duration
        const updatedSessions = timeTracking.sessions.map((session, idx) => {
          if (idx === timeTracking.sessions.length - 1) {
            return {
              ...session,
              endedAt: now,
              duration: sessionDuration
            };
          }
          return session;
        });
        
        return {
          process: {
            ...state.process,
            timeTracking: {
              ...timeTracking,
              status: 'paused',
              currentSessionStart: undefined,
              sessions: updatedSessions,
              totalActiveTime: timeTracking.totalActiveTime + sessionDuration
            }
          }
        };
      });
    },

    resumeProcessTimer: () => {
      const { startProcessTimer } = get();
      startProcessTimer();
    },

    stopProcessTimer: () => {
      set((state) => {
        if (!state.process?.timeTracking) return state;
        
        const { timeTracking } = state.process;
        const now = new Date().toISOString();
        
        let finalSessions = [...timeTracking.sessions];
        let finalTotalTime = timeTracking.totalActiveTime;
        
        // If running, close current session
        if (timeTracking.status === 'running' && timeTracking.currentSessionStart) {
          const sessionDuration = new Date(now).getTime() - new Date(timeTracking.currentSessionStart).getTime();
          finalSessions = timeTracking.sessions.map((session, idx) => {
            if (idx === timeTracking.sessions.length - 1) {
              return {
                ...session,
                endedAt: now,
                duration: sessionDuration
              };
            }
            return session;
          });
          finalTotalTime += sessionDuration;
        }
        
        return {
          process: {
            ...state.process,
            timeTracking: {
              ...timeTracking,
              status: 'completed',
              currentSessionStart: undefined,
              sessions: finalSessions,
              totalActiveTime: finalTotalTime
            }
          }
        };
      });
    },

    getElapsedTime: (): number => {
      const currentState = get();
      if (!currentState.process?.timeTracking) return 0;
      
      const { timeTracking } = currentState.process;
      let total = timeTracking.totalActiveTime;
      
      // Add current running session time
      if (timeTracking.status === 'running' && timeTracking.currentSessionStart) {
        total += Date.now() - new Date(timeTracking.currentSessionStart).getTime();
      }
      
      return total;
    }
  }),
  {
    name: 'process-tracker-storage',
    storage: createCompressedStorage<ProcessStore>(),
  }
));
