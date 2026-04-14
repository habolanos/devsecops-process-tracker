import { describe, it, expect } from 'vitest';
import {
  generateBpmnXml,
  sanitizeId,
  escapeXml,
  getBpmnTaskType,
  BpmnGeneratorResult,
} from '@/lib/bpmn-generator';
import { ProcessState } from '@/lib/types';

// ============================================
// Test Fixtures
// ============================================

const makeTask = (id: string, name: string, order = 1, type: 'standard' | 'check' | 'multicheck' | 'export-excel' | 'dynamic-list' | 'detail-list' | 'form' = 'standard') => ({
  id,
  name,
  description: '',
  order,
  type,
  checkItems: [],
  references: [],
  evidenceConfig: { type: 'none' as const, required: false },
  dependencies: [],
  completed: false,
  completedAt: undefined,
  evidence: { images: [] },
  isBlocked: false,
  dynamicLinks: [],
});

const makeProcess = (overrides: Partial<ProcessState> = {}): ProcessState => ({
  id: 'proc-1',
  name: 'Test Process',
  description: 'Test',
  version: '1.0.0',
  loadedAt: '2024-01-01T00:00:00Z',
  progress: 0,
  phases: [],
  subprocesses: [],
  variableDefinitions: [],
  capturedVariables: {},
  timeTracking: { status: 'idle', sessions: [], totalActiveTime: 0 },
  ...overrides,
});

// ============================================
// sanitizeId
// ============================================
describe('sanitizeId', () => {
  it('replaces non-alphanumeric characters with underscore', () => {
    expect(sanitizeId('phase-1')).toBe('phase_1');
    expect(sanitizeId('task.id.2')).toBe('task_id_2');
    expect(sanitizeId('id with spaces')).toBe('id_with_spaces');
  });

  it('keeps alphanumeric and underscore unchanged', () => {
    expect(sanitizeId('phaseOne')).toBe('phaseOne');
    expect(sanitizeId('task_123')).toBe('task_123');
  });
});

// ============================================
// escapeXml
// ============================================
describe('escapeXml', () => {
  it('escapes all XML special characters', () => {
    expect(escapeXml('a & b')).toBe('a &amp; b');
    expect(escapeXml('<tag>')).toBe('&lt;tag&gt;');
    expect(escapeXml('"quoted"')).toBe('&quot;quoted&quot;');
    expect(escapeXml("it's")).toBe('it&apos;s');
  });

  it('handles empty string', () => {
    expect(escapeXml('')).toBe('');
  });

  it('handles undefined/null gracefully', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(escapeXml(undefined as any)).toBe('');
  });

  it('leaves plain strings unchanged', () => {
    expect(escapeXml('Hello World 123')).toBe('Hello World 123');
  });
});

// ============================================
// getBpmnTaskType
// ============================================
describe('getBpmnTaskType', () => {
  it('maps export-excel to serviceTask', () => {
    expect(getBpmnTaskType('export-excel')).toBe('serviceTask');
  });

  it('maps check to manualTask', () => {
    expect(getBpmnTaskType('check')).toBe('manualTask');
  });

  it('maps multicheck to manualTask', () => {
    expect(getBpmnTaskType('multicheck')).toBe('manualTask');
  });

  it('maps standard to userTask', () => {
    expect(getBpmnTaskType('standard')).toBe('userTask');
  });

  it('maps dynamic-list to userTask', () => {
    expect(getBpmnTaskType('dynamic-list')).toBe('userTask');
  });

  it('maps detail-list to userTask', () => {
    expect(getBpmnTaskType('detail-list')).toBe('userTask');
  });

  it('maps form to userTask', () => {
    expect(getBpmnTaskType('form')).toBe('userTask');
  });
});

// ============================================
// generateBpmnXml — structure
// ============================================
describe('generateBpmnXml', () => {
  describe('XML structure', () => {
    it('returns xml string and taskMeta array', () => {
      const result: BpmnGeneratorResult = generateBpmnXml(makeProcess());
      expect(result).toHaveProperty('xml');
      expect(result).toHaveProperty('taskMeta');
      expect(typeof result.xml).toBe('string');
      expect(Array.isArray(result.taskMeta)).toBe(true);
    });

    it('generates valid XML declaration', () => {
      const { xml } = generateBpmnXml(makeProcess());
      expect(xml).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?>/);
    });

    it('includes BPMN namespace declarations', () => {
      const { xml } = generateBpmnXml(makeProcess());
      expect(xml).toContain('xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"');
      expect(xml).toContain('xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"');
      expect(xml).toContain('xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"');
      expect(xml).toContain('xmlns:di="http://www.omg.org/spec/DD/20100524/DI"');
    });

    it('includes collaboration and participant', () => {
      const { xml } = generateBpmnXml(makeProcess({ name: 'My Process' }));
      expect(xml).toContain('<bpmn:collaboration id="Collaboration_1">');
      expect(xml).toContain('name="My Process"');
      expect(xml).toContain('bpmnElement="Collaboration_1"');
    });

    it('includes BPMNDiagram section', () => {
      const { xml } = generateBpmnXml(makeProcess());
      expect(xml).toContain('<bpmndi:BPMNDiagram id="BPMNDiagram_1">');
      expect(xml).toContain('<bpmndi:BPMNPlane');
    });
  });

  // ============================================
  // Single phase, no tasks
  // ============================================
  describe('single phase — no tasks', () => {
    const process = makeProcess({
      phases: [{
        id: 'phase-1',
        name: 'Phase One',
        description: '',
        order: 1,
        progress: 0,
        activities: [],
        tasks: [],
        dynamicLinks: [],
      }],
    });

    it('creates lane for the phase', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('Lane_phase_1');
      expect(xml).toContain('name="Phase One"');
    });

    it('creates start and end events', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<bpmn:startEvent id="Start_phase_1"');
      expect(xml).toContain('<bpmn:endEvent id="End_phase_1"');
    });

    it('connects start to end with a sequence flow', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('sourceRef="Start_phase_1" targetRef="End_phase_1"');
    });

    it('returns empty taskMeta', () => {
      const { taskMeta } = generateBpmnXml(process);
      expect(taskMeta).toHaveLength(0);
    });
  });

  // ============================================
  // Single phase with tasks
  // ============================================
  describe('single phase — with tasks', () => {
    const process = makeProcess({
      phases: [{
        id: 'phase-1',
        name: 'Deployment',
        description: '',
        order: 1,
        progress: 0,
        activities: [],
        tasks: [
          makeTask('task-a', 'Task A', 1),
          makeTask('task-b', 'Task B', 2, 'check'),
          makeTask('task-c', 'Export', 3, 'export-excel'),
        ],
        dynamicLinks: [],
      }],
    });

    it('creates userTask for standard task', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<bpmn:userTask id="Task_task_a" name="Task A"/>');
    });

    it('creates manualTask for check task', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<bpmn:manualTask id="Task_task_b" name="Task B"/>');
    });

    it('creates serviceTask for export-excel task', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<bpmn:serviceTask id="Task_task_c" name="Export"/>');
    });

    it('connects start → task-a → task-b → task-c → end', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('sourceRef="Start_phase_1" targetRef="Task_task_a"');
      expect(xml).toContain('sourceRef="Task_task_a" targetRef="Task_task_b"');
      expect(xml).toContain('sourceRef="Task_task_b" targetRef="Task_task_c"');
      expect(xml).toContain('sourceRef="Task_task_c" targetRef="End_phase_1"');
    });

    it('generates taskMeta with correct fields', () => {
      const { taskMeta } = generateBpmnXml(process);
      expect(taskMeta).toHaveLength(3);
      expect(taskMeta[0]).toMatchObject({ taskId: 'task-a', phaseId: 'phase-1', bpmnElementId: 'Task_task_a' });
      expect(taskMeta[1]).toMatchObject({ taskId: 'task-b', phaseId: 'phase-1', bpmnElementId: 'Task_task_b' });
      expect(taskMeta[2]).toMatchObject({ taskId: 'task-c', phaseId: 'phase-1', bpmnElementId: 'Task_task_c' });
    });

    it('generates BPMNShape with Bounds for each task', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<bpmndi:BPMNShape id="Task_task_a_di" bpmnElement="Task_task_a">');
      expect(xml).toContain('<dc:Bounds');
    });

    it('generates waypoints for sequence flows', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('<di:waypoint');
    });
  });

  // ============================================
  // Multi-phase process
  // ============================================
  describe('multi-phase process', () => {
    const process = makeProcess({
      phases: [
        {
          id: 'phase-1',
          name: 'Planning',
          description: '',
          order: 1,
          progress: 0,
          activities: [],
          tasks: [makeTask('task-1', 'Plan', 1)],
          dynamicLinks: [],
        },
        {
          id: 'phase-2',
          name: 'Execution',
          description: '',
          order: 2,
          progress: 0,
          activities: [],
          tasks: [makeTask('task-2', 'Execute', 1), makeTask('task-3', 'Verify', 2)],
          dynamicLinks: [],
        },
      ],
    });

    it('creates a lane for each phase', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('id="Lane_phase_1"');
      expect(xml).toContain('id="Lane_phase_2"');
    });

    it('connects End of phase-1 to Start of phase-2', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('sourceRef="End_phase_1" targetRef="Start_phase_2"');
    });

    it('generates taskMeta for all tasks across phases', () => {
      const { taskMeta } = generateBpmnXml(process);
      expect(taskMeta).toHaveLength(3);
      expect(taskMeta.map((m) => m.phaseId)).toEqual(['phase-1', 'phase-2', 'phase-2']);
    });
  });

  // ============================================
  // Phase with activities
  // ============================================
  describe('phase with activities', () => {
    const process = makeProcess({
      phases: [{
        id: 'phase-1',
        name: 'Deploy',
        description: '',
        order: 1,
        progress: 0,
        activities: [
          {
            id: 'act-1',
            name: 'Build',
            description: '',
            order: 1,
            progress: 0,
            tasks: [makeTask('task-build', 'Build App', 1)],
            dynamicLinks: [],
            images: [],
          },
          {
            id: 'act-2',
            name: 'Test',
            description: '',
            order: 2,
            progress: 0,
            tasks: [makeTask('task-test', 'Run Tests', 1)],
            dynamicLinks: [],
            images: [],
          },
        ],
        tasks: [],
        dynamicLinks: [],
      }],
    });

    it('flattens activity tasks into the phase lane', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('Task_task_build');
      expect(xml).toContain('Task_task_test');
    });

    it('taskMeta records activityId for activity tasks', () => {
      const { taskMeta } = generateBpmnXml(process);
      expect(taskMeta).toHaveLength(2);
      expect(taskMeta[0]).toMatchObject({ taskId: 'task-build', activityId: 'act-1' });
      expect(taskMeta[1]).toMatchObject({ taskId: 'task-test', activityId: 'act-2' });
    });

    it('connects tasks sequentially in the lane', () => {
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('sourceRef="Task_task_build" targetRef="Task_task_test"');
    });
  });

  // ============================================
  // XML special characters in names
  // ============================================
  describe('XML character escaping', () => {
    it('escapes special chars in process name', () => {
      const process = makeProcess({ name: 'Process <A> & "B"' });
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('Process &lt;A&gt; &amp; &quot;B&quot;');
    });

    it('escapes special chars in task names', () => {
      const process = makeProcess({
        phases: [{
          id: 'p1', name: 'Phase', description: '', order: 1, progress: 0,
          activities: [], tasks: [makeTask('t1', "Task <'special'>")], dynamicLinks: [],
        }],
      });
      const { xml } = generateBpmnXml(process);
      expect(xml).toContain('Task &lt;&apos;special&apos;&gt;');
    });
  });

  // ============================================
  // Task ordering
  // ============================================
  describe('task ordering', () => {
    it('sorts tasks by order property', () => {
      const process = makeProcess({
        phases: [{
          id: 'p1', name: 'Phase', description: '', order: 1, progress: 0,
          activities: [],
          tasks: [
            makeTask('task-z', 'Last', 3),
            makeTask('task-a', 'First', 1),
            makeTask('task-m', 'Middle', 2),
          ],
          dynamicLinks: [],
        }],
      });
      const { xml } = generateBpmnXml(process);
      // First connection should be Start → First
      expect(xml).toContain('sourceRef="Start_p1" targetRef="Task_task_a"');
      // Last connection should be Last → End
      expect(xml).toContain('sourceRef="Task_task_z" targetRef="End_p1"');
    });
  });

  // ============================================
  // Pool / Participant shape
  // ============================================
  describe('pool shape', () => {
    it('generates a Participant shape with isHorizontal', () => {
      const { xml } = generateBpmnXml(makeProcess({
        phases: [{
          id: 'p1', name: 'P', description: '', order: 1, progress: 0,
          activities: [], tasks: [], dynamicLinks: [],
        }],
      }));
      expect(xml).toContain('isHorizontal="true"');
      expect(xml).toContain('bpmnElement="Participant_1"');
    });
  });
});
