import yaml from 'js-yaml';
import { ProcessYAML, ProcessState, PhaseState, TaskState } from './types';

export function parseYAMLToProcess(yamlContent: string): ProcessState {
  try {
    const parsed = yaml.load(yamlContent) as ProcessYAML;
    
    if (!parsed?.process) {
      throw new Error('Invalid YAML structure: missing "process" key');
    }

    const { id, name, description, version, phases } = parsed.process;

    if (!id || !name || !phases || !Array.isArray(phases)) {
      throw new Error('Invalid YAML: process must have id, name, and phases array');
    }

    const processState: ProcessState = {
      id,
      name,
      description: description || '',
      version: version || '1.0.0',
      loadedAt: new Date().toISOString(),
      progress: 0,
      phases: phases.map((phase) => {
        if (!phase.id || !phase.name || !phase.tasks || !Array.isArray(phase.tasks)) {
          throw new Error(`Invalid phase structure: ${phase?.id || 'unknown'}`);
        }

        const phaseState: PhaseState = {
          id: phase.id,
          name: phase.name,
          description: phase.description || '',
          order: phase.order || 0,
          progress: 0,
          tasks: phase.tasks.map((task) => {
            if (!task.id || !task.name) {
              throw new Error(`Invalid task structure in phase ${phase.id}`);
            }

            const taskState: TaskState = {
              id: task.id,
              name: task.name,
              description: task.description || '',
              order: task.order || 0,
              references: task.references || [],
              evidenceConfig: task.evidence || { type: 'text', required: false },
              dependencies: task.dependencies || [],
              completed: false,
              evidence: {
                images: []
              },
              isBlocked: false
            };

            return taskState;
          })
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
