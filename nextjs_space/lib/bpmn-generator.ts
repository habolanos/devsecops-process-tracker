import { ProcessState, TaskState } from './types';

// ============================================
// Layout Constants
// ============================================
const L = {
  POOL_X: 160,
  POOL_Y: 80,
  PARTICIPANT_BAND: 30,  // Width of pool name band (left vertical strip)
  LANE_BAND: 30,         // Width of lane name band (inside pool)
  H_PAD: 20,             // Horizontal padding before first element in lane
  V_PAD: 25,             // Vertical padding inside each lane
  EVENT_W: 36,
  EVENT_H: 36,
  TASK_W: 120,
  TASK_H: 80,
  H_GAP: 50,             // Gap between elements horizontally
  R_PAD: 40,             // Right padding after last element
} as const;

// x where lane content area begins
const CONTENT_X = L.POOL_X + L.PARTICIPANT_BAND + L.LANE_BAND;
// Height of each lane (single row)
const LANE_H = L.TASK_H + 2 * L.V_PAD;

// ============================================
// Public Types
// ============================================

export interface BpmnTaskMeta {
  taskId: string;
  phaseId: string;
  activityId?: string;
  bpmnElementId: string;
}

export interface BpmnGeneratorResult {
  xml: string;
  taskMeta: BpmnTaskMeta[];
}

interface Bounds {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ============================================
// Helpers
// ============================================

export function sanitizeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '_');
}

export function escapeXml(str: string): string {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function getBpmnTaskType(type: TaskState['type']): string {
  switch (type) {
    case 'export-excel':
      return 'serviceTask';
    case 'check':
    case 'multicheck':
      return 'manualTask';
    default:
      return 'userTask';
  }
}

// ============================================
// Main Generator
// ============================================

export function generateBpmnXml(process: ProcessState): BpmnGeneratorResult {
  const taskMeta: BpmnTaskMeta[] = [];
  const boundsMap = new Map<string, Bounds>();

  // Collect and sort tasks per phase (flatten activities)
  interface PhaseEntry {
    task: TaskState;
    activityId?: string;
  }

  const phaseTasksMap = new Map<string, PhaseEntry[]>();

  for (const phase of process.phases) {
    const entries: PhaseEntry[] = [];

    if (phase.activities && phase.activities.length > 0) {
      for (const act of phase.activities) {
        for (const task of act.tasks) {
          entries.push({ task, activityId: act.id });
        }
      }
    }
    for (const task of phase.tasks ?? []) {
      entries.push({ task });
    }

    entries.sort((a, b) => (a.task.order ?? 0) - (b.task.order ?? 0));
    phaseTasksMap.set(phase.id, entries);
  }

  // Max tasks across phases → pool width
  let maxTasks = 0;
  for (const entries of phaseTasksMap.values()) {
    maxTasks = Math.max(maxTasks, entries.length);
  }

  const poolWidth =
    L.PARTICIPANT_BAND +
    L.LANE_BAND +
    L.H_PAD +
    L.EVENT_W +
    L.H_GAP +
    maxTasks * (L.TASK_W + L.H_GAP) +
    L.EVENT_W +
    L.R_PAD;

  const poolHeight = process.phases.length * LANE_H;

  boundsMap.set('Pool_1', {
    x: L.POOL_X,
    y: L.POOL_Y,
    w: poolWidth,
    h: poolHeight,
  });

  // Compute element bounds per phase
  let currentY = L.POOL_Y;

  for (const phase of process.phases) {
    const laneId = `Lane_${sanitizeId(phase.id)}`;
    const startId = `Start_${sanitizeId(phase.id)}`;
    const endId = `End_${sanitizeId(phase.id)}`;
    const entries = phaseTasksMap.get(phase.id) ?? [];

    boundsMap.set(laneId, {
      x: L.POOL_X + L.PARTICIPANT_BAND,
      y: currentY,
      w: poolWidth - L.PARTICIPANT_BAND,
      h: LANE_H,
    });

    const eventY = currentY + (LANE_H - L.EVENT_H) / 2;
    const taskY = currentY + (LANE_H - L.TASK_H) / 2;

    boundsMap.set(startId, {
      x: CONTENT_X + L.H_PAD,
      y: eventY,
      w: L.EVENT_W,
      h: L.EVENT_H,
    });

    for (let j = 0; j < entries.length; j++) {
      const bpmnId = `Task_${sanitizeId(entries[j].task.id)}`;
      boundsMap.set(bpmnId, {
        x: CONTENT_X + L.H_PAD + L.EVENT_W + L.H_GAP + j * (L.TASK_W + L.H_GAP),
        y: taskY,
        w: L.TASK_W,
        h: L.TASK_H,
      });
    }

    const endX =
      CONTENT_X +
      L.H_PAD +
      L.EVENT_W +
      L.H_GAP +
      entries.length * (L.TASK_W + L.H_GAP);
    boundsMap.set(endId, { x: endX, y: eventY, w: L.EVENT_W, h: L.EVENT_H });

    currentY += LANE_H;
  }

  // ============================================
  // XML assembly
  // ============================================
  const laneSetLines: string[] = [];
  const elementLines: string[] = [];
  const flowLines: string[] = [];
  const diShapes: string[] = [];
  const diEdges: string[] = [];

  let flowCounter = 0;
  const nextFlowId = () => `Flow_${++flowCounter}`;

  const addEdge = (sourceId: string, targetId: string): void => {
    const flowId = nextFlowId();
    flowLines.push(
      `    <bpmn:sequenceFlow id="${flowId}" sourceRef="${sourceId}" targetRef="${targetId}"/>`
    );

    const src = boundsMap.get(sourceId);
    const tgt = boundsMap.get(targetId);
    if (!src || !tgt) return;

    const srcX = Math.round(src.x + src.w);
    const srcY = Math.round(src.y + src.h / 2);
    const tgtX = Math.round(tgt.x);
    const tgtY = Math.round(tgt.y + tgt.h / 2);

    diEdges.push(
      `      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">\n` +
        `        <di:waypoint x="${srcX}" y="${srcY}"/>\n` +
        `        <di:waypoint x="${tgtX}" y="${tgtY}"/>\n` +
        `      </bpmndi:BPMNEdge>`
    );
  };

  const shapeXml = (id: string, bpmnEl: string, extra = ''): string => {
    const b = boundsMap.get(id);
    if (!b) return '';
    return (
      `      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${bpmnEl}"${extra}>\n` +
      `        <dc:Bounds x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}"/>\n` +
      `      </bpmndi:BPMNShape>`
    );
  };

  // Pool shape (participant)
  diShapes.push(shapeXml('Pool_1', 'Participant_1', ' isHorizontal="true"'));

  for (let i = 0; i < process.phases.length; i++) {
    const phase = process.phases[i];
    const laneId = `Lane_${sanitizeId(phase.id)}`;
    const startId = `Start_${sanitizeId(phase.id)}`;
    const endId = `End_${sanitizeId(phase.id)}`;
    const entries = phaseTasksMap.get(phase.id) ?? [];

    // Lane logical
    const refs = [
      startId,
      ...entries.map((e) => `Task_${sanitizeId(e.task.id)}`),
      endId,
    ];
    laneSetLines.push(
      `      <bpmn:lane id="${laneId}" name="${escapeXml(phase.name)}">\n` +
        refs.map((r) => `        <bpmn:flowNodeRef>${r}</bpmn:flowNodeRef>`).join('\n') +
        `\n      </bpmn:lane>`
    );

    // Start / end events
    elementLines.push(
      `    <bpmn:startEvent id="${startId}" name="${escapeXml(phase.name)}"/>`
    );
    elementLines.push(
      `    <bpmn:endEvent id="${endId}" name="${escapeXml(phase.name)}"/>`
    );

    // Task elements
    for (const { task, activityId } of entries) {
      const bpmnId = `Task_${sanitizeId(task.id)}`;
      const bpmnType = getBpmnTaskType(task.type);
      elementLines.push(
        `    <bpmn:${bpmnType} id="${bpmnId}" name="${escapeXml(task.name)}"/>`
      );
      taskMeta.push({ taskId: task.id, phaseId: phase.id, activityId, bpmnElementId: bpmnId });
    }

    // Sequence flows: Start → T1 → T2 → ... → Tn → End
    if (entries.length === 0) {
      addEdge(startId, endId);
    } else {
      addEdge(startId, `Task_${sanitizeId(entries[0].task.id)}`);
      for (let j = 1; j < entries.length; j++) {
        addEdge(
          `Task_${sanitizeId(entries[j - 1].task.id)}`,
          `Task_${sanitizeId(entries[j].task.id)}`
        );
      }
      addEdge(`Task_${sanitizeId(entries[entries.length - 1].task.id)}`, endId);
    }

    // Phase connections: End_Pi → Start_P(i+1)
    if (i < process.phases.length - 1) {
      const nextStartId = `Start_${sanitizeId(process.phases[i + 1].id)}`;
      addEdge(endId, nextStartId);
    }

    // DI shapes
    diShapes.push(shapeXml(laneId, laneId, ' isHorizontal="true"'));
    diShapes.push(shapeXml(startId, startId));
    for (const { task } of entries) {
      const bpmnId = `Task_${sanitizeId(task.id)}`;
      diShapes.push(shapeXml(bpmnId, bpmnId));
    }
    diShapes.push(shapeXml(endId, endId));
  }

  const processId = `Process_${sanitizeId(process.id)}`;
  const processName = escapeXml(process.name);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="${processName}" processRef="${processId}"/>
  </bpmn:collaboration>
  <bpmn:process id="${processId}" name="${processName}" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
${laneSetLines.join('\n')}
    </bpmn:laneSet>
${elementLines.join('\n')}
${flowLines.join('\n')}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
${diShapes.join('\n')}
${diEdges.join('\n')}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

  return { xml, taskMeta };
}
