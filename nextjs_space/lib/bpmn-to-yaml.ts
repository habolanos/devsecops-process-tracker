import * as yaml from 'js-yaml';

// ============================================================
// Types
// ============================================================

export interface ParsedYamlTask {
  id: string;
  name: string;
  description?: string;
  order: number;
  type?: string;
  dependencies?: string[];
  evidence?: { type: string; required: boolean; description?: string };
  completionAlert?: {
    severity?: string;
    title?: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
  checkItem?: { description: string; required: boolean };
}

export interface ParsedYamlPhase {
  id: string;
  name: string;
  description?: string;
  order: number;
  tasks: ParsedYamlTask[];
}

export interface ParsedYamlVariable {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required: boolean;
  placeholder?: string;
  options?: string[];
}

export interface ParsedYamlProcess {
  process: {
    id: string;
    name: string;
    description: string;
    version: string;
    variables?: ParsedYamlVariable[];
    phases: ParsedYamlPhase[];
  };
}

// ============================================================
// DOM helpers (DOMParser – browser + jsdom)
// ============================================================

function getByTagNS(root: Element | Document, localName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', localName));
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? '';
}

function docText(el: Element): string {
  const docs = getByTagNS(el, 'documentation');
  return docs.length > 0 ? (docs[0].textContent?.trim() ?? '') : '';
}

function taskYamlType(localName: string, extensionEl: Element | null): string {
  const extType = extensionEl
    ? getByTagNS(extensionEl, 'type')[0]?.textContent?.trim()
    : null;
  if (extType) return extType;
  if (localName === 'serviceTask') return 'export-excel';
  if (localName === 'manualTask') return 'check';
  return 'standard';
}

// ============================================================
// Core parser: BPMN XML → ParsedYamlProcess
// ============================================================

export function parseBpmnXml(xml: string): ParsedYamlProcess {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');

  const parseErr = doc.getElementsByTagNameNS('*', 'parsererror');
  if (parseErr.length > 0) {
    throw new Error('Invalid BPMN XML: ' + (parseErr[0].textContent ?? 'parse error'));
  }

  // ── Process element ──────────────────────────────────────
  const processEls = getByTagNS(doc as unknown as Element, 'process');
  if (processEls.length === 0) throw new Error('No <process> found in BPMN XML');
  const processEl = processEls[0];

  const rawProcessId = attr(processEl, 'id');
  const processId = rawProcessId.replace(/^Process_/i, '').toLowerCase().replace(/[^a-z0-9-_]/g, '-') || 'imported-process';
  const processName = attr(processEl, 'name') || processId;
  const processDesc = docText(processEl) || processName;

  // ── Variables from <dataObject> ───────────────────────────
  const dataObjects = getByTagNS(processEl, 'dataObject');
  const variables: ParsedYamlVariable[] = dataObjects.map((d) => {
    const rawId = attr(d, 'id');
    const key = rawId
      .replace(/^var[_-]/i, '')
      .replace(/[^A-Za-z0-9_]/g, '_')
      .replace(/^_+/, '');
    const extEls = getByTagNS(d, 'variable');
    const type = (extEls[0] ? attr(extEls[0], 'type') : '') as 'text' | 'select' | 'number' || 'text';
    const optionEls = extEls[0] ? getByTagNS(extEls[0], 'option') : [];
    const options = optionEls.map((o) => o.textContent?.trim() ?? '').filter(Boolean);
    return {
      key: key || 'variable',
      label: attr(d, 'name') || key,
      type,
      required: true,
      ...(options.length > 0 && { options }),
    };
  });

  // ── Build flow maps ───────────────────────────────────────
  const flows = getByTagNS(processEl, 'sequenceFlow');
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();

  for (const flow of flows) {
    const src = attr(flow, 'sourceRef');
    const tgt = attr(flow, 'targetRef');
    if (!outgoing.has(src)) outgoing.set(src, []);
    outgoing.get(src)!.push(tgt);
    if (!incoming.has(tgt)) incoming.set(tgt, []);
    incoming.get(tgt)!.push(src);
  }

  // ── Lanes ─────────────────────────────────────────────────
  const lanes = getByTagNS(processEl, 'lane');

  // Map nodeId → laneId
  const nodeToLane = new Map<string, string>();
  lanes.forEach((lane, idx) => {
    const laneId = attr(lane, 'id');
    const refs = getByTagNS(lane, 'flowNodeRef');
    refs.forEach((r) => nodeToLane.set(r.textContent?.trim() ?? '', laneId));
    // fallback order attr if absent
    if (!lane.getAttribute('data-order')) lane.setAttribute('data-order', String(idx));
  });

  // ── Task elements ─────────────────────────────────────────
  const taskTagNames = ['userTask', 'serviceTask', 'manualTask'];
  const allTaskEls: Element[] = [];
  for (const tag of taskTagNames) {
    allTaskEls.push(...getByTagNS(processEl, tag));
  }

  // Group tasks by lane
  const laneTasksMap = new Map<string, Element[]>();
  for (const task of allTaskEls) {
    const tid = attr(task, 'id');
    const laneId = nodeToLane.get(tid) ?? '__orphan__';
    if (!laneTasksMap.has(laneId)) laneTasksMap.set(laneId, []);
    laneTasksMap.get(laneId)!.push(task);
  }

  // ── Build phases ──────────────────────────────────────────
  const phases: ParsedYamlPhase[] = lanes
    .map((lane, laneIdx) => {
      const laneId = attr(lane, 'id');
      const laneName = attr(lane, 'name') || `Fase ${laneIdx + 1}`;
      const laneDesc = docText(lane) || undefined;
      const laneTasks = laneTasksMap.get(laneId) ?? [];

      if (laneTasks.length === 0) return null;

      const laneTaskIds = new Set(laneTasks.map((t) => attr(t, 'id')));
      const isLaneTask = (id: string) => laneTaskIds.has(id);

      // Topological sort within lane
      const ordered: Element[] = [];
      const visited = new Set<string>();

      // Tasks with no lane-task predecessors = entry points
      const starters = laneTasks.filter((t) => {
        const incomers = incoming.get(attr(t, 'id')) ?? [];
        return !incomers.some(isLaneTask);
      });

      const queue = [...starters];
      while (queue.length > 0) {
        const current = queue.shift()!;
        const id = attr(current, 'id');
        if (visited.has(id)) continue;
        visited.add(id);
        ordered.push(current);
        const successors = (outgoing.get(id) ?? [])
          .filter(isLaneTask)
          .map((sid) => laneTasks.find((t) => attr(t, 'id') === sid))
          .filter(Boolean) as Element[];
        queue.push(...successors);
      }

      // Remaining (disconnected / cycles)
      for (const t of laneTasks) {
        if (!visited.has(attr(t, 'id'))) ordered.push(t);
      }

      const tasks: ParsedYamlTask[] = ordered.map((taskEl, tIdx) => {
        const tid = attr(taskEl, 'id');
        const tname = attr(taskEl, 'name') || `Tarea ${tIdx + 1}`;
        const tdesc = docText(taskEl) || undefined;

        // extensionElements → yaml:taskConfig
        const extEl = getByTagNS(taskEl, 'extensionElements')[0] ?? null;
        const type = taskYamlType(taskEl.localName, extEl);

        // completionAlert from extensionElements
        let completionAlert: ParsedYamlTask['completionAlert'] | undefined;
        if (extEl) {
          const alertEl = getByTagNS(extEl, 'completionAlert')[0];
          if (alertEl) {
            completionAlert = {
              severity: attr(alertEl, 'severity') || 'info',
              title: attr(alertEl, 'title') || undefined,
              description: attr(alertEl, 'description') || tname,
              confirmLabel: attr(alertEl, 'confirmLabel') || undefined,
              cancelLabel: attr(alertEl, 'cancelLabel') || undefined,
            };
            if (!completionAlert.title) delete completionAlert.title;
            if (!completionAlert.confirmLabel) delete completionAlert.confirmLabel;
            if (!completionAlert.cancelLabel) delete completionAlert.cancelLabel;
          }
        }

        // evidence
        let evidence: ParsedYamlTask['evidence'] | undefined;
        if (extEl) {
          const evEl = getByTagNS(extEl, 'evidence')[0];
          if (evEl) {
            evidence = {
              type: attr(evEl, 'type') || 'text',
              required: attr(evEl, 'required') !== 'false',
              description: attr(evEl, 'description') || undefined,
            };
            if (!evidence.description) delete evidence.description;
          }
        }
        if (!evidence) {
          evidence = { type: 'text', required: true };
        }

        // checkItem for check tasks
        let checkItem: ParsedYamlTask['checkItem'] | undefined;
        if (type === 'check' && extEl) {
          const ciEl = getByTagNS(extEl, 'checkItem')[0];
          if (ciEl) {
            checkItem = {
              description: attr(ciEl, 'description') || tname,
              required: attr(ciEl, 'required') !== 'false',
            };
          } else {
            checkItem = { description: tname, required: true };
          }
        }

        // Dependencies: lane-task predecessors only
        const deps = (incoming.get(tid) ?? []).filter(isLaneTask).map((did) => {
          const depEl = laneTasks.find((t) => attr(t, 'id') === did);
          return depEl ? attr(depEl, 'id') : did;
        });

        // Convert IDs to clean YAML identifiers
        const cleanId = (rawId: string) =>
          rawId.replace(/^Task_/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        return {
          id: cleanId(tid) || `task-${laneIdx + 1}-${tIdx + 1}`,
          name: tname,
          ...(tdesc && { description: tdesc }),
          order: tIdx + 1,
          ...(type !== 'standard' && { type }),
          ...(deps.length > 0 && { dependencies: deps.map(cleanId) }),
          evidence,
          ...(completionAlert && { completionAlert }),
          ...(checkItem && { checkItem }),
        };
      });

      const cleanLaneId = (id: string) =>
        id.replace(/^Lane_/i, '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

      return {
        id: cleanLaneId(laneId) || `phase-${laneIdx + 1}`,
        name: laneName,
        ...(laneDesc && { description: laneDesc }),
        order: laneIdx + 1,
        tasks,
      } as ParsedYamlPhase;
    })
    .filter(Boolean) as ParsedYamlPhase[];

  return {
    process: {
      id: processId,
      name: processName,
      description: processDesc,
      version: '1.0.0',
      ...(variables.length > 0 && { variables }),
      phases,
    },
  };
}

// ============================================================
// Serialize parsed result to YAML string
// ============================================================

export function bpmnToYaml(xml: string): string {
  const parsed = parseBpmnXml(xml);
  return yaml.dump(parsed, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true,
    noCompatMode: true,
  });
}

// ============================================================
// Validate YAML string against basic schema constraints
// ============================================================

export interface YamlValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateYamlString(yamlStr: string): YamlValidationResult {
  const errors: string[] = [];
  try {
    const parsed = yaml.load(yamlStr) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') {
      errors.push('El YAML no contiene un objeto válido');
      return { valid: false, errors };
    }
    const proc = parsed['process'] as Record<string, unknown> | undefined;
    if (!proc) errors.push('Falta la clave raíz "process"');
    else {
      if (!proc['id']) errors.push('process.id es requerido');
      if (!proc['name']) errors.push('process.name es requerido');
      if (!proc['description']) errors.push('process.description es requerido');
      if (!proc['version']) errors.push('process.version es requerido');
      const phases = proc['phases'] as unknown[] | undefined;
      if (!phases || !Array.isArray(phases) || phases.length === 0) {
        errors.push('process.phases debe tener al menos una fase');
      } else {
        phases.forEach((p: unknown, i: number) => {
          const phase = p as Record<string, unknown>;
          if (!phase['id']) errors.push(`phases[${i}].id es requerido`);
          if (!phase['name']) errors.push(`phases[${i}].name es requerido`);
          const tasks = phase['tasks'] as unknown[] | undefined;
          const activities = phase['activities'] as unknown[] | undefined;
          if ((!tasks || tasks.length === 0) && (!activities || activities.length === 0)) {
            errors.push(`phases[${i}] debe tener tasks o activities`);
          }
        });
      }
    }
  } catch (e) {
    errors.push(`Error de sintaxis YAML: ${(e as Error).message}`);
  }
  return { valid: errors.length === 0, errors };
}
