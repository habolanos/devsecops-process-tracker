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
