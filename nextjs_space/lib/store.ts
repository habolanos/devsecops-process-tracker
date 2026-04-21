'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { produce } from 'immer';
import { ProcessState, TaskEvidence, CapturedVariables, WorkSession, ListItem, DetailItem, FormFieldValue } from './types';
import { updateProgress, updateTaskBlockedStatus, getAllDependentTasks } from './helpers';
import { createCompressedStorage } from './persist-storage';
import { useUserProfileStore } from './user-profile-store';
import { extractProgress, mergeProgressIntoFresh } from './process-merge';
import { parseYAMLToProcess } from './yaml-parser';

interface ProcessStore {
  process: ProcessState | null;
  currentPhaseId: string | null;
  currentActivityId: string | null;
  currentTaskId: string | null;
  hasStartedInteraction: boolean; // Track if user has interacted with the process
  
  // Actions
  loadProcess: (process: ProcessState) => void;
  /**
   * Re-parse the YAML source of truth and overlay the current in-memory
   * progress on top of the fresh structure. Used after Zustand rehydrates a
   * persisted snapshot that may be missing new YAML fields (e.g. a newly
   * added `completionAlert`). Returns true on success, false if parsing
   * failed or there is no current process to refresh.
   */
  refreshFromYAML: (yamlContent: string) => boolean;
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
  
  // Dynamic List Actions (for dynamic-list tasks)
  updateListData: (phaseId: string, taskId: string, items: ListItem[], activityId?: string) => void;
  
  // Detail List Actions (for detail-list tasks)
  updateDetailData: (phaseId: string, taskId: string, detailData: DetailItem[], activityId?: string) => void;
  
  // Form Actions (for form tasks)
  updateFormData: (phaseId: string, taskId: string, formData: FormFieldValue[], activityId?: string) => void;
  
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

      // Capture author from user profile only if process doesn't already have one
      if (!updated.author) {
        const userProfile = useUserProfileStore.getState().profile;
        if (userProfile) {
          updated.author = {
            name: userProfile.name,
            avatarId: userProfile.avatarId,
            isCustom: userProfile.isCustom,
            capturedAt: new Date().toISOString(),
          };
        }
      }

      set({
        process: updated,
        currentPhaseId: updated.phases?.[0]?.id ?? null,
        currentActivityId: null,
        currentTaskId: null,
        hasStartedInteraction: false // Reset interaction flag on new process load
      });
    },

    refreshFromYAML: (yamlContent) => {
      const current = get().process;
      if (!current) return false;
      let fresh: ProcessState;
      try {
        fresh = parseYAMLToProcess(yamlContent);
      } catch (err) {
        console.error('[refreshFromYAML] Failed to parse YAML:', err);
        return false;
      }
      if (fresh.id !== current.id) {
        console.warn(
          `[refreshFromYAML] id mismatch (fresh='${fresh.id}', current='${current.id}') - aborting merge`,
        );
        return false;
      }
      const progress = extractProgress(current);
      const merged = updateTaskBlockedStatus(updateProgress(mergeProgressIntoFresh(fresh, progress)));
      set((state) => ({
        process: merged,
        // Clamp current selection to ids that still exist in the fresh structure
        currentPhaseId:
          state.currentPhaseId && merged.phases.some((p) => p.id === state.currentPhaseId)
            ? state.currentPhaseId
            : merged.phases[0]?.id ?? null,
      }));
      return true;
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
      set({
        currentPhaseId: phaseId,
        currentActivityId: null,
        currentTaskId: null,
        hasStartedInteraction: true, // Mark interaction on phase change
      });
    },

    setCurrentActivity: (activityId) => {
      set({
        currentActivityId: activityId,
        currentTaskId: null,
        hasStartedInteraction: true, // Mark interaction on activity change
      });
    },

    setCurrentTask: (taskId) => {
      set({
        currentTaskId: taskId,
        hasStartedInteraction: true, // Mark interaction on task selection
      });
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
        
        const newProcess = produce(state.process, (draft) => {
          const phase = draft.phases.find(p => p?.id === phaseId);
          if (!phase) return;
          
          let task;
          if (activityId) {
            const activity = phase.activities?.find(a => a?.id === activityId);
            task = activity?.tasks?.find(t => t?.id === taskId);
          } else {
            task = phase.tasks?.find(t => t?.id === taskId);
          }
          if (!task) return;
          
          const checkItem = task.checkItems?.find(i => i?.id === checkItemId);
          if (!checkItem) return;
          
          checkItem.checked = !checkItem.checked;
          checkItem.checkedAt = checkItem.checked ? new Date().toISOString() : undefined;
        });
        
        return { process: newProcess };
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

    updateListData: (phaseId, taskId, items, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updateTaskListData = (task: any) => {
          if (task?.id !== taskId) return task;
          return {
            ...task,
            listData: items
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
                  tasks: activity.tasks.map(updateTaskListData)
                };
              })
            };
          }

          return {
            ...phase,
            tasks: (phase.tasks ?? []).map(updateTaskListData)
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

    updateDetailData: (phaseId, taskId, detailData, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updateTaskDetailData = (task: any) => {
          if (task?.id !== taskId) return task;
          return {
            ...task,
            detailData: detailData
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
                  tasks: activity.tasks.map(updateTaskDetailData)
                };
              })
            };
          }

          return {
            ...phase,
            tasks: (phase.tasks ?? []).map(updateTaskDetailData)
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

    updateFormData: (phaseId, taskId, formData, activityId) => {
      set((state) => {
        if (!state.process) return state;

        const updateTaskFormData = (task: any) => {
          if (task?.id !== taskId) return task;
          return {
            ...task,
            formData: formData
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
                  tasks: activity.tasks.map(updateTaskFormData)
                };
              })
            };
          }

          return {
            ...phase,
            tasks: (phase.tasks ?? []).map(updateTaskFormData)
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
    onRehydrateStorage: () => (state) => {
      // After Zustand rehydrates from localStorage, ensure the process
      // structure reflects the latest YAML source of truth. This picks up
      // new fields (e.g. completionAlert, new tasks, renamed labels) that
      // the persisted snapshot predates, while preserving user progress.
      if (typeof window === 'undefined') return;
      const processId = state?.process?.id;
      if (!processId) return;
      void (async () => {
        try {
          const res = await fetch(`/api/processes/${encodeURIComponent(processId)}`);
          if (!res.ok) return;
          const data: { content?: string } = await res.json();
          if (typeof data.content !== 'string') return;
          useProcessStore.getState().refreshFromYAML(data.content);
        } catch (err) {
          // Non-fatal: the persisted snapshot remains usable.
          console.warn('[process-store] YAML refresh on rehydrate failed:', err);
        }
      })();
    },
  }
));
