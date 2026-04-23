import { describe, expect, it } from 'vitest';
import type { ExportTaskCellSource, TaskState, CheckItemState } from '@/lib/types';

// Minimal mock for ExcelJS worksheet
function createMockWorksheet() {
  const cells: Record<string, any> = {};
  return {
    getCell: (ref: string) => ({
      get value() { return cells[ref]; },
      set value(v: any) { cells[ref] = v; },
    }),
    cells,
  };
}

// Replicate resolveTaskField from excel-generator.ts
function resolveTaskField(task: TaskState, field: string): any {
  const checkMatch = field.match(/^checkItems\.([^.]+)\.(.+)/);
  if (checkMatch) {
    const itemId = checkMatch[1];
    const prop = checkMatch[2];
    const item = task.checkItems?.find(c => c.id === itemId);
    return item ? (item as any)[prop] : undefined;
  }
  return field.split('.').reduce((obj, key) => obj?.[key], task as any);
}

// Replicate setCell from excel-generator.ts
function setCell(ws: ReturnType<typeof createMockWorksheet>, ref: string, value: any) {
  if (value === undefined || value === null || value === '') return;
  ws.getCell(ref).value = value;
}

// Replicate the cell kind logic from applyTaskSource
function applyCellSource(
  ws: ReturnType<typeof createMockWorksheet>,
  src: ExportTaskCellSource,
  task: TaskState,
) {
  if (!task) return;
  for (const mapping of src.fields) {
    const value = resolveTaskField(task, mapping.field);
    if (value !== undefined && value !== null && value !== '') {
      setCell(ws, mapping.cell, value);
    }
  }
}

function createBaseTask(overrides: Partial<TaskState> = {}): TaskState {
  return {
    id: 'task-7-1',
    name: 'Test Task',
    description: '',
    order: 1,
    type: 'standard',
    checkItems: [],
    references: [],
    evidenceConfig: { type: 'text', required: false },
    dependencies: [],
    completed: true,
    completedAt: '2025-01-15T10:00:00Z',
    evidence: { text: '', images: [] },
    isBlocked: false,
    dynamicLinks: [],
    ...overrides,
  };
}

describe('kind:cell export', () => {
  it('should write evidence.text to a target cell', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask({
      evidence: { text: 'Comentarios generales de la liberación', images: [] },
    });
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-7-1',
      fields: [{ field: 'evidence.text', cell: 'B100' }],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['B100']).toBe('Comentarios generales de la liberación');
  });

  it('should write completedAt to a target cell', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask();
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-7-1',
      fields: [{ field: 'completedAt', cell: 'F84' }],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['F84']).toBe('2025-01-15T10:00:00Z');
  });

  it('should write checkItems by id with .checked', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask({
      type: 'multicheck',
      checkItems: [
        { id: 'check-vuln-none', description: 'Sin vulnerabilidades críticas', required: true, checked: true },
        { id: 'check-vuln-low', description: 'Vulnerabilidades bajas documentadas', required: false, checked: false },
        { id: 'check-vuln-medium', description: 'Vulnerabilidades medias', required: false, checked: true, checkedAt: '2025-01-15T10:05:00Z' },
      ] as CheckItemState[],
    });
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-3-3',
      fields: [
        { field: 'checkItems.check-vuln-none.checked', cell: 'J50' },
        { field: 'checkItems.check-vuln-low.checked', cell: 'J51' },
        { field: 'checkItems.check-vuln-medium.checked', cell: 'J52' },
        { field: 'checkItems.check-vuln-medium.checkedAt', cell: 'K52' },
      ],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['J50']).toBe(true);
    expect(ws.cells['J51']).toBe(false);
    expect(ws.cells['J52']).toBe(true);
    expect(ws.cells['K52']).toBe('2025-01-15T10:05:00Z');
  });

  it('should write multiple fields from the same task', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask({
      type: 'multicheck',
      evidence: { text: 'Notas sobre disponibilidad', images: [] },
      checkItems: [
        { id: 'check-scm', description: 'SCM asignado', required: true, checked: true },
      ] as CheckItemState[],
    });
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-1-3',
      fields: [
        { field: 'evidence.text', cell: 'D50' },
        { field: 'checkItems.check-scm.checked', cell: 'E50' },
        { field: 'completedAt', cell: 'F50' },
      ],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['D50']).toBe('Notas sobre disponibilidad');
    expect(ws.cells['E50']).toBe(true);
    expect(ws.cells['F50']).toBe('2025-01-15T10:00:00Z');
  });

  it('should skip undefined/null/empty values', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask({
      evidence: { text: '', images: [] },
    });
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-7-1',
      fields: [
        { field: 'evidence.text', cell: 'B100' },
        { field: 'nonexistent.prop', cell: 'C100' },
      ],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['B100']).toBeUndefined();
    expect(ws.cells['C100']).toBeUndefined();
  });

  it('should handle checkItem id not found gracefully', () => {
    const ws = createMockWorksheet();
    const task = createBaseTask({
      type: 'multicheck',
      checkItems: [
        { id: 'check-a', description: 'Item A', required: true, checked: true },
      ] as CheckItemState[],
    });
    const src: ExportTaskCellSource = {
      kind: 'cell',
      sourceTaskId: 'task-x',
      fields: [{ field: 'checkItems.check-nonexistent.checked', cell: 'Z1' }],
    };

    applyCellSource(ws, src, task);
    expect(ws.cells['Z1']).toBeUndefined();
  });
});
