import { describe, it, expect } from 'vitest';
import type { TaskOutputVar } from '../../../lib/types';
import { parseYAMLToProcess } from '../../../lib/yaml-parser';

// computeOutputVars is a private function in store.ts, so we duplicate the logic for unit testing.

function computeOutputVarsLocal(task: any, outputVars?: TaskOutputVar[]): Record<string, string | string[]> {
  if (!outputVars || outputVars.length === 0) return {};
  const result: Record<string, string | string[]> = {};
  for (const ov of outputVars) {
    const raw = ov.source.split('.').reduce((obj: any, key: string) => obj?.[key], task);
    if (raw === undefined || raw === null) continue;

    if (ov.type === 'text') {
      result[ov.name] = typeof raw === 'string' ? raw : String(raw);
    } else if (ov.type === 'list') {
      if (Array.isArray(raw)) {
        const mapped = ov.mapTo
          ? raw.map((item: any) => item?.[ov.mapTo!] ?? '')
          : raw.map((item: any) => String(item));
        result[ov.name] = mapped.filter((s: string) => s !== '');
      }
    } else if (ov.type === 'object') {
      result[ov.name] = JSON.stringify(raw);
    }
  }
  return result;
}

describe('computeOutputVars', () => {
  it('returns empty object when no outputVars defined', () => {
    expect(computeOutputVarsLocal({ listData: [] })).toEqual({});
  });

  it('resolves text output from evidence.text', () => {
    const task = { evidence: { text: 'my evidence text' } };
    const outputVars: TaskOutputVar[] = [
      { name: 'evidenceOutput', type: 'text', source: 'evidence.text' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      evidenceOutput: 'my evidence text',
    });
  });

  it('resolves list output from listData with mapTo', () => {
    const task = {
      listData: [
        { value: 'repo-a', addedAt: '2026-01-01' },
        { value: 'repo-b', addedAt: '2026-01-02' },
        { value: 'repo-c', addedAt: '2026-01-03' },
      ],
    };
    const outputVars: TaskOutputVar[] = [
      { name: 'repos', type: 'list', source: 'listData', mapTo: 'value' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      repos: ['repo-a', 'repo-b', 'repo-c'],
    });
  });

  it('resolves list output without mapTo (stringifies items)', () => {
    const task = { listData: [{ value: 'x' }, { value: 'y' }] };
    const outputVars: TaskOutputVar[] = [
      { name: 'items', type: 'list', source: 'listData' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      items: ['[object Object]', '[object Object]'],
    });
  });

  it('resolves object output as JSON string', () => {
    const task = { formData: [{ fieldId: 'f1', value: 'v1' }] };
    const outputVars: TaskOutputVar[] = [
      { name: 'formDump', type: 'object', source: 'formData' },
    ];
    const result = computeOutputVarsLocal(task, outputVars);
    expect(result.formDump).toBe(JSON.stringify(task.formData));
  });

  it('skips undefined/null source paths', () => {
    const task = { listData: undefined };
    const outputVars: TaskOutputVar[] = [
      { name: 'repos', type: 'list', source: 'listData', mapTo: 'value' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({});
  });

  it('handles multiple outputVars from same task', () => {
    const task = {
      evidence: { text: 'done' },
      listData: [{ value: 'a' }, { value: 'b' }],
    };
    const outputVars: TaskOutputVar[] = [
      { name: 'evText', type: 'text', source: 'evidence.text' },
      { name: 'repos', type: 'list', source: 'listData', mapTo: 'value' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      evText: 'done',
      repos: ['a', 'b'],
    });
  });

  it('filters out empty strings from list output', () => {
    const task = {
      listData: [
        { value: 'a' },
        { value: '' },
        { value: 'c' },
      ],
    };
    const outputVars: TaskOutputVar[] = [
      { name: 'repos', type: 'list', source: 'listData', mapTo: 'value' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      repos: ['a', 'c'],
    });
  });

  it('resolves nested path like completedAt', () => {
    const task = { completedAt: '2026-04-23T10:00:00Z' };
    const outputVars: TaskOutputVar[] = [
      { name: 'doneAt', type: 'text', source: 'completedAt' },
    ];
    expect(computeOutputVarsLocal(task, outputVars)).toEqual({
      doneAt: '2026-04-23T10:00:00Z',
    });
  });
});

describe('yaml-parser: outputVars validation', () => {
  it('accepts valid outputVars', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
          outputVars:
            - name: repos
              type: list
              source: listData
              mapTo: value
`;
    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];
    expect(task.outputVars).toBeDefined();
    expect(task.outputVars![0].name).toBe('repos');
    expect(task.outputVars![0].type).toBe('list');
    expect(task.outputVars![0].source).toBe('listData');
    expect(task.outputVars![0].mapTo).toBe('value');
  });

  it('rejects invalid outputVars type', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
          outputVars:
            - name: repos
              type: invalid
              source: listData
`;
    expect(() => parseYAMLToProcess(yaml)).toThrow(/type.*must be one of/);
  });

  it('rejects missing name in outputVars', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
          outputVars:
            - type: text
              source: evidence.text
`;
    expect(() => parseYAMLToProcess(yaml)).toThrow(/name.*must be a string/);
  });
});

describe('yaml-parser: optionsFrom validation', () => {
  it('accepts optionsFrom on select variable', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  variables:
    - key: "repo"
      label: "Repository"
      type: "select"
      required: true
      optionsFrom: "repos"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
`;
    const result = parseYAMLToProcess(yaml);
    expect(result.variableDefinitions[0].optionsFrom).toBe('repos');
  });

  it('rejects optionsFrom on non-select variable', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  variables:
    - key: "repo"
      label: "Repository"
      type: "text"
      required: true
      optionsFrom: "repos"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
`;
    expect(() => parseYAMLToProcess(yaml)).toThrow(/optionsFrom is only valid for type: select/);
  });
});

describe('yaml-parser: sourceVar validation in detailTableConfig', () => {
  it('accepts sourceVar in detailTableConfig', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Table Task
          order: 1
          type: detail-table
          evidence:
            type: text
            required: false
          detailTableConfig:
            sourceVar: "repos"
            columns:
              - id: col1
                label: Column 1
                type: text
`;
    const result = parseYAMLToProcess(yaml);
    const task = result.phases[0].tasks[0];
    expect(task.detailTableConfig!.sourceVar).toBe('repos');
    expect(task.detailTableConfig!.sourceTaskId).toBeUndefined();
  });
});

describe('yaml-parser: kind:range validation', () => {
  it('accepts valid kind:range source', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  export:
    templatePath: "/templates/test.xlsx"
    mappings:
      sheets:
        - sheet: "Sheet1"
          sources:
            - kind: range
              range: "H46:L46"
              outputVar: "headers"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
`;
    const result = parseYAMLToProcess(yaml);
    expect(result.export).toBeDefined();
    expect(result.export!.mappings!.sheets[0].sources![0].kind).toBe('range');
  });

  it('rejects kind:range without range', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  export:
    templatePath: "/templates/test.xlsx"
    mappings:
      sheets:
        - sheet: "Sheet1"
          sources:
            - kind: range
              outputVar: "headers"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
`;
    expect(() => parseYAMLToProcess(yaml)).toThrow(/range.*required/);
  });

  it('rejects kind:range without outputVar', () => {
    const yaml = `
process:
  id: test
  name: Test
  description: desc
  version: "1.0"
  export:
    templatePath: "/templates/test.xlsx"
    mappings:
      sheets:
        - sheet: "Sheet1"
          sources:
            - kind: range
              range: "A1:A10"
  phases:
    - id: p1
      name: Phase 1
      description: desc
      order: 1
      tasks:
        - id: t1
          name: Task 1
          order: 1
          evidence:
            type: text
            required: false
`;
    expect(() => parseYAMLToProcess(yaml)).toThrow(/outputVar.*required/);
  });
});

describe('colLetterToNumber', () => {
  // We test the logic inline since the function is private
  function colLetterToNumber(col: string): number {
    let n = 0;
    for (let i = 0; i < col.length; i++) {
      n = n * 26 + (col.charCodeAt(i) - 64);
    }
    return n;
  }

  it('converts A to 1', () => expect(colLetterToNumber('A')).toBe(1));
  it('converts Z to 26', () => expect(colLetterToNumber('Z')).toBe(26));
  it('converts AA to 27', () => expect(colLetterToNumber('AA')).toBe(27));
  it('converts AZ to 52', () => expect(colLetterToNumber('AZ')).toBe(52));
  it('converts L to 12', () => expect(colLetterToNumber('L')).toBe(12));
});
