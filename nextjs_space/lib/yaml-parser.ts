import yaml from 'js-yaml';
import { ProcessYAML, ProcessState, PhaseState, TaskState, ActivityState, SubprocessState, CapturedVariables, CheckItemState } from './types';
import { parseTimeString } from './helpers';

export function parseYAMLToProcess(yamlContent: string): ProcessState {
  try {
    const parsed = yaml.load(yamlContent) as ProcessYAML;
    
    if (!parsed?.process) {
      throw new Error('Invalid YAML structure: missing "process" key');
    }

    const { id, name, description, version, variables, phases, subprocesses, estimatedTime } = parsed.process as any;

    if (!id || !name || !phases || !Array.isArray(phases)) {
      throw new Error('Invalid YAML: process must have id, name, and phases array');
    }

    // Helper function to parse checkItems based on task type
    const parseCheckItems = (task: any, contextId: string): CheckItemState[] => {
      const taskType = task.type || 'standard';
      
      if (taskType === 'standard') {
        return [];
      }
      
      if (taskType === 'check') {
        if (!task.checkItem || !task.checkItem.description) {
          throw new Error(`Task type 'check' requires checkItem with description in ${contextId}`);
        }
        return [{
          id: task.checkItem.id || `${task.id}-check`,
          description: task.checkItem.description,
          required: task.checkItem.required ?? true,
          checked: false
        }];
      }
      
      if (taskType === 'multicheck') {
        if (!task.checkItems || !Array.isArray(task.checkItems) || task.checkItems.length === 0) {
          throw new Error(`Task type 'multicheck' requires checkItems array with at least 1 item in ${contextId}`);
        }
        return task.checkItems.map((item: any, idx: number) => {
          if (!item.description) {
            throw new Error(`CheckItem missing description in ${contextId}`);
          }
          return {
            id: item.id || `${task.id}-check-${idx}`,
            description: item.description,
            required: item.required ?? true,
            checked: false
          };
        });
      }
      
      if (taskType !== 'export-excel' && taskType !== 'dynamic-list') {
        throw new Error(`Invalid task type '${taskType}' in ${contextId}. Must be 'standard', 'check', 'multicheck', 'export-excel', or 'dynamic-list'`);
      }
      return [];
    };

    // Helper function to parse tasks
    const parseTasks = (tasks: any[], contextId: string): TaskState[] => {
      return tasks.map((task) => {
        if (!task.id || !task.name) {
          throw new Error(`Invalid task structure in ${contextId}`);
        }
        const taskType = task.type || 'standard';
        return {
          id: task.id,
          name: task.name,
          description: task.description || '',
          order: task.order || 0,
          type: taskType as 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list',
          checkItems: parseCheckItems(task, `task ${task.id} in ${contextId}`),
          references: task.references || [],
          evidenceConfig: task.evidence || { type: 'text', required: false },
          dependencies: task.dependencies || [],
          exportConfig: task.exportConfig,
          listConfig: task.listConfig,
          listData: [],
          completed: false,
          evidence: { images: [] },
          isBlocked: false,
          dynamicLinks: task.dynamicLinks || []
        };
      });
    };

    // Helper function to parse activities
    const parseActivities = (activities: any[], phaseId: string): ActivityState[] => {
      if (!activities || !Array.isArray(activities)) return [];
      return activities.map((activity) => {
        if (!activity.id || !activity.name || !activity.tasks || !Array.isArray(activity.tasks)) {
          throw new Error(`Invalid activity structure in phase ${phaseId}`);
        }
        if (activity.tasks.length === 0) {
          throw new Error(`Activity ${activity.id} must have at least 1 task`);
        }
        return {
          id: activity.id,
          name: activity.name,
          description: activity.description || '',
          order: activity.order || 0,
          progress: 0,
          tasks: parseTasks(activity.tasks, `activity ${activity.id}`),
          dynamicLinks: activity.dynamicLinks || [],
          images: activity.images || []
        };
      });
    };

    // Parse subprocesses
    const parseSubprocesses = (subs: any[]): SubprocessState[] => {
      if (!subs || !Array.isArray(subs)) return [];
      return subs.map((sub) => {
        if (!sub.id || !sub.name || !sub.source) {
          throw new Error(`Invalid subprocess structure: ${sub?.id || 'unknown'}`);
        }
        return {
          id: sub.id,
          name: sub.name,
          order: sub.order || 0,
          source: sub.source,
          variables: sub.variables || {},
          optional: sub.optional || false,
          status: 'pending'
        };
      });
    };

    // Initialize captured variables with default values if provided
    const initialCapturedVariables: CapturedVariables = {};
    if (variables && Array.isArray(variables)) {
      variables.forEach((v) => {
        if (v.defaultValue) {
          initialCapturedVariables[v.key] = v.defaultValue;
        }
      });
    }

    const processState: ProcessState = {
      id,
      name,
      description: description || '',
      version: version || '1.0.0',
      loadedAt: new Date().toISOString(),
      progress: 0,
      estimatedTime: estimatedTime ? parseTimeString(estimatedTime) : undefined,
      variableDefinitions: variables || [],
      capturedVariables: initialCapturedVariables,
      timeTracking: {
        status: 'idle',
        sessions: [],
        totalActiveTime: 0
      },
      subprocesses: parseSubprocesses(subprocesses || []),
      phases: phases.map((phase) => {
        // Phase must have either activities or tasks (or both for backward compatibility)
        const hasActivities = phase.activities && Array.isArray(phase.activities) && phase.activities.length > 0;
        const hasTasks = phase.tasks && Array.isArray(phase.tasks) && phase.tasks.length > 0;
        
        if (!phase.id || !phase.name || (!hasActivities && !hasTasks)) {
          throw new Error(`Invalid phase structure: ${phase?.id || 'unknown'} - must have activities or tasks`);
        }

        const phaseState: PhaseState = {
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          order: phase.order || 0,
          progress: 0,
          dynamicLinks: phase.dynamicLinks || [],
          activities: parseActivities(phase.activities || [], phase.id),
          tasks: hasTasks ? parseTasks(phase.tasks || [], `phase ${phase.id}`) : []
        };

        return phaseState;
      })
    };

    return processState;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to parse YAML: ${errorMessage}`);
  }
}

export function validateYAML(yamlContent: string): { valid: boolean; error?: string } {
  try {
    parseYAMLToProcess(yamlContent);
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
