import yaml from 'js-yaml';
import { ProcessYAML, ProcessState, PhaseState, TaskState, ActivityState, SubprocessState, CapturedVariables, CheckItemState, ProcessExportConfig } from './types';
import { parseTimeString } from './helpers';

const CELL_REF_RE = /^[A-Z]+[0-9]+$/;

const COMPLETION_ALERT_SEVERITIES = new Set(['info', 'warning', 'critical']);
const OUTPUT_VAR_TYPES = new Set(['text', 'list', 'object']);

function validateOutputVars(
  outputVars: unknown,
  contextId: string,
): import('./types').TaskOutputVar[] | undefined {
  if (outputVars === undefined || outputVars === null) return undefined;
  if (!Array.isArray(outputVars)) {
    throw new Error(`outputVars in ${contextId} must be an array`);
  }
  if (outputVars.length === 0) return undefined;
  return outputVars.map((v: any, idx: number) => {
    if (!v.name || typeof v.name !== 'string') {
      throw new Error(`outputVars[${idx}] in ${contextId}: 'name' must be a string`);
    }
    if (!v.type || !OUTPUT_VAR_TYPES.has(v.type)) {
      throw new Error(`outputVars[${idx}] in ${contextId}: 'type' must be one of text|list|object`);
    }
    if (!v.source || typeof v.source !== 'string') {
      throw new Error(`outputVars[${idx}] in ${contextId}: 'source' must be a string`);
    }
    return {
      name: v.name,
      type: v.type,
      source: v.source,
      mapTo: v.mapTo,
    };
  });
}

function validateCompletionAlert(
  alert: unknown,
  contextId: string,
): import('./types').CompletionAlertConfig | undefined {
  if (alert === undefined || alert === null) return undefined;
  if (typeof alert !== 'object' || Array.isArray(alert)) {
    throw new Error(`completionAlert in ${contextId} must be an object`);
  }
  const a = alert as Record<string, unknown>;
  if (typeof a.description !== 'string' || a.description.trim().length === 0) {
    throw new Error(`completionAlert.description in ${contextId} is required and must be a non-empty string`);
  }
  const severity = a.severity ?? 'info';
  if (typeof severity !== 'string' || !COMPLETION_ALERT_SEVERITIES.has(severity)) {
    throw new Error(
      `completionAlert.severity in ${contextId} must be one of info|warning|critical (got '${String(severity)}')`,
    );
  }
  const optionalString = (key: 'title' | 'confirmLabel' | 'cancelLabel') => {
    const v = a[key];
    if (v === undefined || v === null) return undefined;
    if (typeof v !== 'string') {
      throw new Error(`completionAlert.${key} in ${contextId} must be a string when provided`);
    }
    return v;
  };
  return {
    severity: severity as 'info' | 'warning' | 'critical',
    description: a.description,
    title: optionalString('title'),
    confirmLabel: optionalString('confirmLabel'),
    cancelLabel: optionalString('cancelLabel'),
  };
}

function validateCellRef(ref: unknown, context: string): void {
  if (typeof ref !== 'string' || !CELL_REF_RE.test(ref)) {
    throw new Error(`Invalid cell reference "${ref}" in ${context} (expected format like "F85")`);
  }
}

function validateExportConfig(cfg: ProcessExportConfig | undefined, ctx: string): void {
  if (!cfg) return;
  if (!cfg.templatePath || typeof cfg.templatePath !== 'string') {
    throw new Error(`${ctx}: 'templatePath' is required`);
  }
  const m = cfg.mappings;
  if (!m) return;

  // Validate sheets array
  if (!Array.isArray(m.sheets) || m.sheets.length === 0) {
    throw new Error(`${ctx}.mappings: 'sheets' must be a non-empty array`);
  }

  for (const [sheetIdx, sheetSection] of m.sheets.entries()) {
    const sheetCtx = `${ctx}.mappings.sheets[${sheetIdx}]`;

    if (!sheetSection.sheet || typeof sheetSection.sheet !== 'string') {
      throw new Error(`${sheetCtx}: 'sheet' (worksheet name) is required`);
    }

    // Validate log-mode fields
    if (sheetSection.startRow !== undefined && typeof sheetSection.startRow !== 'number') {
      throw new Error(`${sheetCtx}: 'startRow' must be a number`);
    }
    if (sheetSection.timestampColumn && !/^[A-Z]+$/.test(sheetSection.timestampColumn)) {
      throw new Error(`${sheetCtx}: 'timestampColumn' must be a column letter`);
    }
    if (sheetSection.nameColumn && !/^[A-Z]+$/.test(sheetSection.nameColumn)) {
      throw new Error(`${sheetCtx}: 'nameColumn' must be a column letter`);
    }

    // Validate sources
    for (const [srcIdx, src] of (sheetSection.sources || []).entries()) {
      const where = `${sheetCtx}.sources[${srcIdx}]`;
      if (!src || typeof src !== 'object' || !('kind' in src)) {
        throw new Error(`${where}: missing 'kind'`);
      }

      if (src.kind === 'variables') {
        if (!src.mapping || typeof src.mapping !== 'object') {
          throw new Error(`${where}: 'mapping' must be an object for kind=variables`);
        }
        for (const [k, ref] of Object.entries(src.mapping)) {
          validateCellRef(ref, `${where}.mapping['${k}']`);
        }
      } else if (src.kind === 'static') {
        if (!src.cells || typeof src.cells !== 'object') {
          throw new Error(`${where}: 'cells' must be an object for kind=static`);
        }
        for (const ref of Object.keys(src.cells)) {
          validateCellRef(ref, `${where}.cells key`);
        }
      } else if (src.kind === 'time') {
        for (const [k, ref] of Object.entries(src)) {
          if (k === 'kind') continue;
          if (ref !== undefined && typeof ref === 'string') validateCellRef(ref, `${where}.${k}`);
        }
      } else if (src.kind === 'process') {
        for (const [k, ref] of Object.entries(src)) {
          if (k === 'kind') continue;
          if (ref !== undefined && typeof ref === 'string') validateCellRef(ref, `${where}.${k}`);
        }
      } else if (src.kind === 'comments') {
        if (!src.cell) throw new Error(`${where}: 'cell' required for kind=comments`);
        validateCellRef(src.cell, `${where}.cell`);
      } else if (src.kind === 'list') {
        if (!src.sourceTaskId) throw new Error(`${where}: 'sourceTaskId' required for kind=list`);
        if (!src.column || !/^[A-Z]+$/.test(src.column)) throw new Error(`${where}: invalid 'column'`);
        if (typeof src.startRow !== 'number') throw new Error(`${where}: 'startRow' must be a number`);
      } else if (src.kind === 'detail') {
        if (!src.sourceTaskId) throw new Error(`${where}: 'sourceTaskId' required for kind=detail`);
        if (!Array.isArray(src.sections) || src.sections.length === 0) {
          throw new Error(`${where}: 'sections' must be a non-empty array`);
        }
      } else if (src.kind === 'form') {
        if (!src.sourceTaskId) throw new Error(`${where}: 'sourceTaskId' required for kind=form`);
      } else if (src.kind === 'checklist') {
        if (typeof src.startRow !== 'number') throw new Error(`${where}: 'startRow' must be a number`);
      } else if (src.kind === 'detail-table') {
        if (!src.sourceTaskId) throw new Error(`${where}: 'sourceTaskId' required for kind=detail-table`);
        if (typeof src.startRow !== 'number') throw new Error(`${where}: 'startRow' must be a number`);
        if (!src.columns || typeof src.columns !== 'object') throw new Error(`${where}: 'columns' must be an object mapping field id to column letter`);
        for (const [fieldId, colLetter] of Object.entries(src.columns)) {
          if (typeof colLetter !== 'string' || !/^[A-Z]+$/.test(colLetter)) {
            throw new Error(`${where}: columns['${fieldId}'] must be a column letter like "L"`);
          }
        }
      } else if (src.kind === 'cell') {
        if (!src.sourceTaskId) throw new Error(`${where}: 'sourceTaskId' required for kind=cell`);
        if (!Array.isArray(src.fields) || src.fields.length === 0) throw new Error(`${where}: 'fields' must be a non-empty array for kind=cell`);
        for (const f of src.fields) {
          if (!f.field || typeof f.field !== 'string') throw new Error(`${where}: each field mapping must have a 'field' string`);
          if (!f.cell || typeof f.cell !== 'string') throw new Error(`${where}: each field mapping must have a 'cell' string`);
        }
      } else if (src.kind === 'range') {
        if (!src.range || typeof src.range !== 'string') throw new Error(`${where}: 'range' required for kind=range (e.g., "H46:L46")`);
        if (!src.outputVar || typeof src.outputVar !== 'string') throw new Error(`${where}: 'outputVar' required for kind=range`);
      } else {
        throw new Error(`${where}: unknown kind '${(src as { kind?: string }).kind}'`);
      }
    }
  }
}

export function parseYAMLToProcess(yamlContent: string): ProcessState {
  try {
    const parsed = yaml.load(yamlContent) as ProcessYAML;
    
    if (!parsed?.process) {
      throw new Error('Invalid YAML structure: missing "process" key');
    }

    const { id, name, description, version, variables, phases, subprocesses, estimatedTime, export: exportCfg } = parsed.process as any;

    if (!id || !name || !phases || !Array.isArray(phases)) {
      throw new Error('Invalid YAML: process must have id, name, and phases array');
    }

    // Validate declarative export configuration (process-level)
    validateExportConfig(exportCfg as ProcessExportConfig | undefined, `process.export`);

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
      
      if (taskType !== 'export-excel' && taskType !== 'dynamic-list' && taskType !== 'detail-list' && taskType !== 'detail-table' && taskType !== 'form') {
        throw new Error(`Invalid task type '${taskType}' in ${contextId}. Must be 'standard', 'check', 'multicheck', 'export-excel', 'dynamic-list', 'detail-list', 'detail-table', or 'form'`);
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

        // Validate export-excel task: must have templatePath itself OR inherit from process.export
        if (taskType === 'export-excel') {
          const taskTemplatePath = task.exportConfig?.templatePath;
          const inherits = task.exportConfig?.inherit !== false;
          const hasProcessTemplate = !!exportCfg?.templatePath;
          if (!taskTemplatePath && !(inherits && hasProcessTemplate)) {
            throw new Error(
              `Task '${task.id}' (type=export-excel) in ${contextId} requires either exportConfig.templatePath or process.export.templatePath`,
            );
          }
          // Also validate its mapping overrides if any
          if (task.exportConfig?.mappings || task.exportConfig?.templatePath) {
            validateExportConfig(
              {
                templatePath: taskTemplatePath || exportCfg?.templatePath || 'inherited',
                mappings: task.exportConfig?.mappings,
              } as ProcessExportConfig,
              `task '${task.id}'.exportConfig`,
            );
          }
        }

        return {
          id: task.id,
          name: task.name,
          description: task.description || '',
          order: task.order || 0,
          type: taskType as 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'detail-table' | 'form',
          checkItems: parseCheckItems(task, `task ${task.id} in ${contextId}`),
          references: task.references || [],
          evidenceConfig: task.evidence || { type: 'text', required: false },
          dependencies: task.dependencies || [],
          exportConfig: task.exportConfig,
          listConfig: task.listConfig,
          listData: [],
          detailConfig: task.detailConfig,
          detailData: [],
          detailTableConfig: task.detailTableConfig,
          detailTableData: [],
          formConfig: task.formConfig,
          formData: [],
          completed: false,
          evidence: { images: [] },
          isBlocked: false,
          dynamicLinks: task.dynamicLinks || [],
          completionAlert: validateCompletionAlert(task.completionAlert, `task '${task.id}' in ${contextId}`),
          outputVars: validateOutputVars(task.outputVars, `task '${task.id}' in ${contextId}`),
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
        // Validate optionsFrom: must be a string and only valid for type: select
        if (v.optionsFrom) {
          if (typeof v.optionsFrom !== 'string') {
            throw new Error(`Variable '${v.key}': optionsFrom must be a string`);
          }
          if (v.type !== 'select') {
            throw new Error(`Variable '${v.key}': optionsFrom is only valid for type: select`);
          }
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
      export: exportCfg as ProcessExportConfig | undefined,
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
