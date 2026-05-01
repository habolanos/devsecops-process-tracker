import { describe, expect, it } from 'vitest';
import type { ExportTaskDetailTableSource, DetailTableRow } from '@/lib/types';

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

// Replicate the detail-table logic from excel-generator.ts applyTaskSource
function applyDetailTableSource(
  ws: ReturnType<typeof createMockWorksheet>,
  src: ExportTaskDetailTableSource,
  rows: DetailTableRow[],
): void {
  const max = src.maxRows ?? rows.length;
  rows.slice(0, max).forEach((row, idx) => {
    const excelRow = src.startRow + idx;
    for (const [fieldId, colLetter] of Object.entries(src.columns)) {
      const value = row.values?.[fieldId];
      if (value !== undefined && value !== null && value !== '') {
        const ref = `${colLetter}${excelRow}`;
        ws.getCell(ref).value = value;
      }
    }
  });
}

describe('detail-table export logic', () => {
  it('writes boolean values to correct cells', () => {
    const ws = createMockWorksheet();
    const src: ExportTaskDetailTableSource = {
      kind: 'detail-table',
      sourceTaskId: 'task-1-2c',
      startRow: 47,
      columns: {
        integracionMaster: 'L',
        deudaTecnica: 'N',
        vulnerabilidades: 'J',
        urlRepo: 'I',
      },
    };

    const rows: DetailTableRow[] = [
      {
        sourceItem: 'repo-api',
        values: {
          integracionMaster: true,
          deudaTecnica: true,
          vulnerabilidades: false,
          urlRepo: 'https://github.com/org/repo-api',
        },
        addedAt: new Date().toISOString(),
      },
    ];

    applyDetailTableSource(ws, src, rows);

    expect(ws.cells['L47']).toBe(true);
    expect(ws.cells['N47']).toBe(true);
    expect(ws.cells['I47']).toBe('https://github.com/org/repo-api');
    // vulnerabilidades is false -> still written as boolean value
    expect(ws.cells['J47']).toBe(false);
  });

  it('writes multiple rows incrementing the row number', () => {
    const ws = createMockWorksheet();
    const src: ExportTaskDetailTableSource = {
      kind: 'detail-table',
      sourceTaskId: 'task-1-2c',
      startRow: 47,
      columns: {
        integracionMaster: 'L',
        urlRepo: 'I',
      },
    };

    const rows: DetailTableRow[] = [
      {
        sourceItem: 'repo-a',
        values: { integracionMaster: true, urlRepo: 'url-a' },
        addedAt: new Date().toISOString(),
      },
      {
        sourceItem: 'repo-b',
        values: { integracionMaster: false, urlRepo: 'url-b' },
        addedAt: new Date().toISOString(),
      },
      {
        sourceItem: 'repo-c',
        values: { integracionMaster: true, urlRepo: 'url-c' },
        addedAt: new Date().toISOString(),
      },
    ];

    applyDetailTableSource(ws, src, rows);

    expect(ws.cells['L47']).toBe(true);
    expect(ws.cells['I47']).toBe('url-a');
    expect(ws.cells['I48']).toBe('url-b');
    expect(ws.cells['L49']).toBe(true);
    expect(ws.cells['I49']).toBe('url-c');
    // L48 is false -> written as boolean false
    expect(ws.cells['L48']).toBe(false);
  });

  it('respects maxRows limit', () => {
    const ws = createMockWorksheet();
    const src: ExportTaskDetailTableSource = {
      kind: 'detail-table',
      sourceTaskId: 'task-1-2c',
      startRow: 47,
      columns: { integracionMaster: 'L' },
      maxRows: 2,
    };

    const rows: DetailTableRow[] = [
      { sourceItem: 'a', values: { integracionMaster: true }, addedAt: new Date().toISOString() },
      { sourceItem: 'b', values: { integracionMaster: true }, addedAt: new Date().toISOString() },
      { sourceItem: 'c', values: { integracionMaster: true }, addedAt: new Date().toISOString() },
    ];

    applyDetailTableSource(ws, src, rows);

    expect(ws.cells['L47']).toBe(true);
    expect(ws.cells['L48']).toBe(true);
    expect(ws.cells['L49']).toBeUndefined(); // maxRows=2, 3rd row skipped
  });

  it('skips empty and null values', () => {
    const ws = createMockWorksheet();
    const src: ExportTaskDetailTableSource = {
      kind: 'detail-table',
      sourceTaskId: 'task-1-2c',
      startRow: 47,
      columns: { urlRepo: 'I', deudaTecnica: 'N' },
    };

    const rows: DetailTableRow[] = [
      {
        sourceItem: 'repo-a',
        values: { urlRepo: '', deudaTecnica: null },
        addedAt: new Date().toISOString(),
      },
    ];

    applyDetailTableSource(ws, src, rows);

    expect(ws.cells['I47']).toBeUndefined();
    expect(ws.cells['N47']).toBeUndefined();
  });

  it('handles empty rows array gracefully', () => {
    const ws = createMockWorksheet();
    const src: ExportTaskDetailTableSource = {
      kind: 'detail-table',
      sourceTaskId: 'task-1-2c',
      startRow: 47,
      columns: { integracionMaster: 'L' },
    };

    applyDetailTableSource(ws, src, []);

    // No cells should be written
    expect(Object.keys(ws.cells).length).toBe(0);
  });
});
