import { describe, it, expect } from 'vitest';
import { parseYAMLToProcess, validateYAML } from '@/lib/yaml-parser';
import { ProcessState } from '@/lib/types';

describe('parseYAMLToProcess', () => {
  it('should parse valid YAML with minimal fields', () => {
    const yaml = `
process:
  id: test-process
  name: Test Process
  phases:
    - id: phase-1
      name: Phase 1
      tasks:
        - id: task-1
          name: Task 1
          evidence:
            type: text
            required: false
`;

    const result = parseYAMLToProcess(yaml);

    expect(result.id).toBe('test-process');
    expect(result.name).toBe('Test Process');
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].tasks).toHaveLength(1);
    expect(result.phases[0].tasks[0].name).toBe('Task 1');
  });

  it('should parse YAML with all fields', () => {
    const yaml = `
process:
  id: audit-process
  name: Security Audit
  description: Complete security audit process
  version: "2.0.0"
  variables:
    - key: organization
      label: Organization
      type: text
      required: true
      placeholder: Enter org name
      defaultValue: default-org
  phases:
    - id: phase-1
      name: Preparation
      description: Prepare for audit
      order: 1
      dynamicLinks:
        - label: Dashboard
          urlTemplate: https://{organization}.com/dashboard
          behavior: click
          requiresVariables: ["organization"]
      tasks:
        - id: task-1
          name: Review policies
          description: Review all security policies
          order: 1
          references:
            - label: Policy Doc
              url: https://docs.example.com
          dynamicLinks:
            - label: GitHub
              urlTemplate: https://github.com/{organization}
              behavior: click
              newTab: true
              requiresVariables: ["organization"]
          evidence:
            type: both
            required: true
            description: Provide text and screenshots
          dependencies: []
`;

    const result = parseYAMLToProcess(yaml);

    expect(result.version).toBe('2.0.0');
    expect(result.description).toBe('Complete security audit process');
    expect(result.variableDefinitions).toHaveLength(1);
    expect(result.variableDefinitions[0].key).toBe('organization');
    expect(result.capturedVariables).toEqual({ organization: 'default-org' });
    expect(result.phases[0].dynamicLinks).toHaveLength(1);
    expect(result.phases[0].tasks[0].evidenceConfig.type).toBe('both');
    expect(result.phases[0].tasks[0].references).toHaveLength(1);
  });

  it('should throw error for invalid YAML structure', () => {
    const invalidYaml = `
notAProcess:
  id: test
`;

    expect(() => parseYAMLToProcess(invalidYaml)).toThrow('Invalid YAML structure: missing "process" key');
  });

  it('should throw error for missing required fields', () => {
    const yamlNoId = `
process:
  name: Test
  phases: []
`;

    expect(() => parseYAMLToProcess(yamlNoId)).toThrow('Invalid YAML: process must have id, name, and phases array');
  });

  it('should throw error for missing phase fields', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: phase-1
      tasks: []
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow('Invalid phase structure');
  });

  it('should throw error for missing task fields', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: phase-1
      name: Phase 1
      tasks:
        - id: task-1
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow('Invalid task structure');
  });

  it('should use default version when not specified', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task 1
          evidence:
            type: text
            required: false
`;

    const result = parseYAMLToProcess(yaml);
    expect(result.version).toBe('1.0.0');
  });

  it('should handle select type variables with options', () => {
    const yaml = `
process:
  id: test
  name: Test
  variables:
    - key: environment
      label: Environment
      type: select
      required: true
      options: ["dev", "staging", "prod"]
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task 1
          evidence:
            type: text
            required: false
`;

    const result = parseYAMLToProcess(yaml);
    expect(result.variableDefinitions[0].type).toBe('select');
    expect(result.variableDefinitions[0].options).toEqual(['dev', 'staging', 'prod']);
  });

  it('should parse task dependencies', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: task-1
          name: Task 1
          evidence:
            type: text
            required: false
        - id: task-2
          name: Task 2
          evidence:
            type: text
            required: false
          dependencies: ["task-1"]
`;

    const result = parseYAMLToProcess(yaml);
    expect(result.phases[0].tasks[1].dependencies).toEqual(['task-1']);
  });

  it('should set loadedAt timestamp', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task 1
          evidence:
            type: text
            required: false
`;

    const before = new Date();
    const result = parseYAMLToProcess(yaml);
    const after = new Date();

    expect(result.loadedAt).toBeDefined();
    const loadedAt = new Date(result.loadedAt!);
    expect(loadedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(loadedAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  // ===== TASK TYPES TESTS =====

  it('should parse task with type standard (explicit)', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task Standard
          type: standard
          evidence:
            type: text
            required: true
`;

    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('standard');
    expect(task.checkItems).toEqual([]);
  });

  it('should default to standard type when type is not specified', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task Without Type
          evidence:
            type: text
            required: false
`;

    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('standard');
    expect(task.checkItems).toEqual([]);
  });

  it('should parse task with type check and single checkItem', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Security Check
          type: check
          checkItem:
            description: "I have verified there are no critical vulnerabilities"
            required: true
          evidence:
            type: text
            required: false
`;

    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('check');
    expect(task.checkItems).toHaveLength(1);
    expect(task.checkItems[0].description).toBe('I have verified there are no critical vulnerabilities');
    expect(task.checkItems[0].required).toBe(true);
    expect(task.checkItems[0].checked).toBe(false);
    expect(task.checkItems[0].id).toBeDefined();
  });

  it('should parse task with type multicheck and multiple checkItems', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Deploy Checklist
          type: multicheck
          checkItems:
            - description: "Code reviewed by 2 people"
              required: true
            - description: "Unit tests passing"
              required: true
            - description: "Documentation updated"
              required: false
          evidence:
            type: image
            required: true
`;

    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('multicheck');
    expect(task.checkItems).toHaveLength(3);
    
    expect(task.checkItems[0].description).toBe('Code reviewed by 2 people');
    expect(task.checkItems[0].required).toBe(true);
    expect(task.checkItems[0].checked).toBe(false);
    
    expect(task.checkItems[1].description).toBe('Unit tests passing');
    expect(task.checkItems[1].required).toBe(true);
    
    expect(task.checkItems[2].description).toBe('Documentation updated');
    expect(task.checkItems[2].required).toBe(false);
  });

  it('should throw error for check task without checkItem', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Invalid Check Task
          type: check
          evidence:
            type: text
            required: false
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow();
  });

  it('should throw error for multicheck task without checkItems', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Invalid Multicheck Task
          type: multicheck
          evidence:
            type: text
            required: false
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow();
  });

  it('should throw error for multicheck task with empty checkItems array', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Empty Multicheck
          type: multicheck
          checkItems: []
          evidence:
            type: text
            required: false
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow();
  });

  it('should throw error for invalid task type', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Invalid Type Task
          type: invalidtype
          evidence:
            type: text
            required: false
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow();
  });

  it('should parse activities with tasks of different types', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      activities:
        - id: a1
          name: Activity 1
          tasks:
            - id: t1
              name: Standard in Activity
              type: standard
              evidence:
                type: text
                required: true
            - id: t2
              name: Check in Activity
              type: check
              checkItem:
                description: "Verified"
                required: true
`;

    const result = parseYAMLToProcess(yaml);
    const activity = result.phases[0].activities![0];

    expect(activity.tasks).toHaveLength(2);
    expect(activity.tasks[0].type).toBe('standard');
    expect(activity.tasks[1].type).toBe('check');
    expect(activity.tasks[1].checkItems).toHaveLength(1);
  });

  it('should parse activity with images', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      activities:
        - id: a1
          name: Activity with Images
          images:
            - id: "img-1"
              name: "Architecture Diagram"
              url: "https://example.com/diagram.png"
              caption: "System architecture"
          tasks:
            - id: t1
              name: Task 1
              evidence:
                type: text
                required: false
`;

    const result = parseYAMLToProcess(yaml);
    const activity = result.phases[0].activities![0];

    expect(activity.images).toHaveLength(1);
    expect(activity.images![0].url).toBe('https://example.com/diagram.png');
    expect(activity.images![0].name).toBe('Architecture Diagram');
    expect(activity.images![0].caption).toBe('System architecture');
  });

  it('should throw error for activity without tasks', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      activities:
        - id: a1
          name: Activity without Tasks
          tasks: []
`;

    expect(() => parseYAMLToProcess(yaml)).toThrow();
  });
});

describe('validateYAML', () => {
  it('should return valid for correct YAML', () => {
    const yaml = `
process:
  id: test
  name: Test
  phases:
    - id: p1
      name: Phase 1
      tasks:
        - id: t1
          name: Task 1
          evidence:
            type: text
            required: false
`;

    const result = validateYAML(yaml);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('should return invalid for malformed YAML', () => {
    const yaml = `
process:
  id: test
  name: Test
`;

    const result = validateYAML(yaml);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('phases');
  });

  it('should return invalid for YAML with syntax errors', () => {
    const yaml = `
process:
  id: test
  name: [unclosed bracket
  phases: []
`;

    const result = validateYAML(yaml);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should return invalid for non-YAML content', () => {
    const result = validateYAML('not yaml at all');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});

describe('parseYAMLToProcess - completionAlert', () => {
  const wrap = (taskBlock: string) => `
process:
  id: p
  name: P
  phases:
    - id: ph1
      name: Ph1
      tasks:
${taskBlock}
`;

  it('parses a completionAlert block with all fields', () => {
    const result = parseYAMLToProcess(
      wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            severity: critical
            title: Confirm deploy
            description: This will deploy to prod.
            confirmLabel: Deploy
            cancelLabel: Abort
`),
    );
    const alert = result.phases[0].tasks[0].completionAlert;
    expect(alert).toEqual({
      severity: 'critical',
      title: 'Confirm deploy',
      description: 'This will deploy to prod.',
      confirmLabel: 'Deploy',
      cancelLabel: 'Abort',
    });
  });

  it('defaults severity to info when omitted', () => {
    const result = parseYAMLToProcess(
      wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            description: Just confirm.
`),
    );
    const alert = result.phases[0].tasks[0].completionAlert;
    expect(alert?.severity).toBe('info');
    expect(alert?.description).toBe('Just confirm.');
    expect(alert?.title).toBeUndefined();
  });

  it('leaves completionAlert undefined when the block is absent', () => {
    const result = parseYAMLToProcess(
      wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
`),
    );
    expect(result.phases[0].tasks[0].completionAlert).toBeUndefined();
  });

  it('rejects an invalid severity value', () => {
    expect(() =>
      parseYAMLToProcess(
        wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            severity: loud
            description: X
`),
      ),
    ).toThrow(/severity.*info\|warning\|critical/);
  });

  it('rejects a missing or empty description', () => {
    expect(() =>
      parseYAMLToProcess(
        wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            severity: warning
`),
      ),
    ).toThrow(/description.*required/);

    expect(() =>
      parseYAMLToProcess(
        wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            severity: warning
            description: "   "
`),
      ),
    ).toThrow(/description.*required/);
  });

  it('rejects non-string optional fields when provided', () => {
    expect(() =>
      parseYAMLToProcess(
        wrap(`        - id: t1
          name: T1
          evidence:
            type: text
            required: false
          completionAlert:
            description: X
            title: 42
`),
      ),
    ).toThrow(/completionAlert.title.*string/);
  });
});
