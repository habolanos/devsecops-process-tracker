import { describe, it, expect } from 'vitest';
import { parseBpmnXml, bpmnToYaml, validateYamlString } from '@/lib/bpmn-to-yaml';
import * as yaml from 'js-yaml';

// ============================================================
// Fixtures
// ============================================================

const SIMPLE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Proceso Test" processRef="Process_Test"/>
  </bpmn:collaboration>
  <bpmn:process id="Process_Test" name="Proceso Test" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Fase1" name="Fase de Inicio">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_tarea1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" name="Inicio"/>
    <bpmn:userTask id="Task_tarea1" name="Tarea Principal"/>
    <bpmn:endEvent id="EndEvent_1" name="Fin"/>
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_tarea1"/>
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_tarea1" targetRef="EndEvent_1"/>
  </bpmn:process>
</bpmn:definitions>`;

const TWO_PHASE_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions
  xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_twophase" name="Dos Fases" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_Fase1" name="Fase 1">
        <bpmn:flowNodeRef>Start_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_A</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_1</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Fase2" name="Fase 2">
        <bpmn:flowNodeRef>Start_2</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_B</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_C</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_2</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="Start_1"/>
    <bpmn:userTask id="Task_A" name="Tarea A"/>
    <bpmn:endEvent id="End_1"/>
    <bpmn:startEvent id="Start_2"/>
    <bpmn:userTask id="Task_B" name="Tarea B"/>
    <bpmn:userTask id="Task_C" name="Tarea C"/>
    <bpmn:endEvent id="End_2"/>
    <bpmn:sequenceFlow id="f1" sourceRef="Start_1" targetRef="Task_A"/>
    <bpmn:sequenceFlow id="f2" sourceRef="Task_A" targetRef="End_1"/>
    <bpmn:sequenceFlow id="f3" sourceRef="End_1" targetRef="Start_2"/>
    <bpmn:sequenceFlow id="f4" sourceRef="Start_2" targetRef="Task_B"/>
    <bpmn:sequenceFlow id="f5" sourceRef="Task_B" targetRef="Task_C"/>
    <bpmn:sequenceFlow id="f6" sourceRef="Task_C" targetRef="End_2"/>
  </bpmn:process>
</bpmn:definitions>`;

const SERVICE_TASK_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  id="D1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_svc" name="Con ServiceTask" isExecutable="false">
    <bpmn:laneSet id="LS1">
      <bpmn:lane id="Lane_1" name="Export">
        <bpmn:flowNodeRef>S1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>SvcTask</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>E1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="S1"/>
    <bpmn:serviceTask id="SvcTask" name="Generar Excel"/>
    <bpmn:endEvent id="E1"/>
    <bpmn:sequenceFlow id="f1" sourceRef="S1" targetRef="SvcTask"/>
    <bpmn:sequenceFlow id="f2" sourceRef="SvcTask" targetRef="E1"/>
  </bpmn:process>
</bpmn:definitions>`;

const WITH_EXTENSION_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:yaml="http://devsecops-tracker/schema"
  id="D1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_ext" name="Con Extensiones" isExecutable="false">
    <bpmn:laneSet id="LS1">
      <bpmn:lane id="Lane_1" name="Verificacion">
        <bpmn:flowNodeRef>S1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_check</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>E1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="S1"/>
    <bpmn:userTask id="Task_check" name="Verificar Arquitectura">
      <bpmn:extensionElements>
        <yaml:completionAlert severity="warning" title="Confirmar" description="¿Confirma la arquitectura?" confirmLabel="Sí" cancelLabel="No"/>
        <yaml:evidence type="both" required="true" description="Evidencia de verificación"/>
      </bpmn:extensionElements>
    </bpmn:userTask>
    <bpmn:endEvent id="E1"/>
    <bpmn:sequenceFlow id="f1" sourceRef="S1" targetRef="Task_check"/>
    <bpmn:sequenceFlow id="f2" sourceRef="Task_check" targetRef="E1"/>
  </bpmn:process>
</bpmn:definitions>`;

// ============================================================
// parseBpmnXml
// ============================================================

describe('parseBpmnXml()', () => {
  it('extracts process id, name, and version from simple BPMN', () => {
    const result = parseBpmnXml(SIMPLE_BPMN);
    expect(result.process.name).toBe('Proceso Test');
    expect(result.process.version).toBe('1.0.0');
    expect(result.process.id).toBeTruthy();
  });

  it('maps a single lane to one phase with tasks', () => {
    const result = parseBpmnXml(SIMPLE_BPMN);
    expect(result.process.phases).toHaveLength(1);
    expect(result.process.phases[0].name).toBe('Fase de Inicio');
    expect(result.process.phases[0].tasks).toHaveLength(1);
    expect(result.process.phases[0].tasks[0].name).toBe('Tarea Principal');
  });

  it('maps two lanes to two phases preserving order', () => {
    const result = parseBpmnXml(TWO_PHASE_BPMN);
    expect(result.process.phases).toHaveLength(2);
    expect(result.process.phases[0].name).toBe('Fase 1');
    expect(result.process.phases[1].name).toBe('Fase 2');
  });

  it('creates two tasks in Phase 2 in topological order', () => {
    const result = parseBpmnXml(TWO_PHASE_BPMN);
    const phase2 = result.process.phases[1];
    expect(phase2.tasks).toHaveLength(2);
    expect(phase2.tasks[0].name).toBe('Tarea B');
    expect(phase2.tasks[1].name).toBe('Tarea C');
  });

  it('assigns order numbers starting from 1', () => {
    const result = parseBpmnXml(TWO_PHASE_BPMN);
    expect(result.process.phases[0].order).toBe(1);
    expect(result.process.phases[1].order).toBe(2);
    expect(result.process.phases[1].tasks[0].order).toBe(1);
    expect(result.process.phases[1].tasks[1].order).toBe(2);
  });

  it('maps serviceTask to export-excel type', () => {
    const result = parseBpmnXml(SERVICE_TASK_BPMN);
    expect(result.process.phases[0].tasks[0].type).toBe('export-excel');
  });

  it('maps userTask without type annotation to standard', () => {
    const result = parseBpmnXml(SIMPLE_BPMN);
    expect(result.process.phases[0].tasks[0].type).toBe('standard');
  });

  it('extracts completionAlert from extensionElements', () => {
    const result = parseBpmnXml(WITH_EXTENSION_BPMN);
    const task = result.process.phases[0].tasks[0];
    expect(task.completionAlert).toBeDefined();
    expect(task.completionAlert?.severity).toBe('warning');
    expect(task.completionAlert?.title).toBe('Confirmar');
    expect(task.completionAlert?.description).toBe('¿Confirma la arquitectura?');
    expect(task.completionAlert?.confirmLabel).toBe('Sí');
    expect(task.completionAlert?.cancelLabel).toBe('No');
  });

  it('extracts evidence from extensionElements', () => {
    const result = parseBpmnXml(WITH_EXTENSION_BPMN);
    const task = result.process.phases[0].tasks[0];
    expect(task.evidence?.type).toBe('both');
    expect(task.evidence?.required).toBe(true);
  });

  it('defaults evidence to text/required/empty-description when not in extensionElements', () => {
    const result = parseBpmnXml(SIMPLE_BPMN);
    expect(result.process.phases[0].tasks[0].evidence).toEqual({ type: 'text', required: true, description: '' });
  });

  it('throws on invalid XML', () => {
    expect(() => parseBpmnXml('<not valid xml <<<')).toThrow();
  });

  it('throws when no <process> element found', () => {
    expect(() =>
      parseBpmnXml('<?xml version="1.0"?><bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"></bpmn:definitions>')
    ).toThrow('No <process> found');
  });
});

// ============================================================
// bpmnToYaml (serialization)
// ============================================================

describe('bpmnToYaml()', () => {
  it('returns a non-empty YAML string', () => {
    const result = bpmnToYaml(SIMPLE_BPMN);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('produces valid YAML parseable by js-yaml', () => {
    const result = bpmnToYaml(SIMPLE_BPMN);
    expect(() => yaml.load(result)).not.toThrow();
  });

  it('round-trip preserves process name', () => {
    const yamlStr = bpmnToYaml(SIMPLE_BPMN);
    const parsed = yaml.load(yamlStr) as Record<string, Record<string, string>>;
    expect(parsed.process.name).toBe('Proceso Test');
  });

  it('round-trip preserves phase count', () => {
    const yamlStr = bpmnToYaml(TWO_PHASE_BPMN);
    const parsed = yaml.load(yamlStr) as Record<string, Record<string, unknown[]>>;
    expect(parsed.process.phases).toHaveLength(2);
  });

  it('round-trip preserves completionAlert severity', () => {
    const yamlStr = bpmnToYaml(WITH_EXTENSION_BPMN);
    const parsed = yaml.load(yamlStr) as Record<string, Record<string, unknown[]>>;
    const phase = (parsed.process.phases as Array<Record<string, unknown[]>>)[0];
    const task = (phase.tasks as Array<Record<string, Record<string, string>>>)[0];
    expect(task.completionAlert?.severity).toBe('warning');
  });
});

// ============================================================
// validateYamlString
// ============================================================

describe('validateYamlString()', () => {
  it('returns valid for a well-formed YAML process', () => {
    const goodYaml = `
process:
  id: test-proc
  name: Test
  description: Test process
  version: 1.0.0
  phases:
    - id: phase-1
      name: Fase 1
      order: 1
      tasks:
        - id: task-1
          name: Tarea 1
          order: 1
`.trim();
    const result = validateYamlString(goodYaml);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('flags missing process.id', () => {
    const bad = `
process:
  name: X
  description: D
  version: 1.0.0
  phases:
    - id: p1
      name: P
      order: 1
      tasks:
        - id: t1
          name: T
          order: 1
`.trim();
    const result = validateYamlString(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('process.id'))).toBe(true);
  });

  it('flags empty phases array', () => {
    const bad = `
process:
  id: x
  name: X
  description: D
  version: 1.0.0
  phases: []
`.trim();
    const result = validateYamlString(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('phases'))).toBe(true);
  });

  it('returns invalid for malformed YAML', () => {
    const result = validateYamlString('{ invalid: yaml: content: [}');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/sintaxis YAML/i);
  });

  it('returns invalid for empty string', () => {
    const result = validateYamlString('');
    expect(result.valid).toBe(false);
  });

  it('flags phase with no tasks and no activities', () => {
    const bad = `
process:
  id: x
  name: X
  description: D
  version: 1.0.0
  phases:
    - id: p1
      name: P
      order: 1
`.trim();
    const result = validateYamlString(bad);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('tasks'))).toBe(true);
  });
});
