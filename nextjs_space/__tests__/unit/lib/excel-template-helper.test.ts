import { describe, it, expect } from 'vitest';
import { getOffsetCell } from '@/lib/excel-template-helper';

describe('getOffsetCell', () => {
  it('returns same cell when offset is 0', () => {
    expect(getOffsetCell('A1', 0)).toBe('A1');
  });

  it('returns null for empty cell reference', () => {
    expect(getOffsetCell('', 1)).toBeNull();
  });

  it('returns null for null cell reference', () => {
    expect(getOffsetCell(null as unknown as string, 1)).toBeNull();
  });

  it('returns null for invalid cell reference', () => {
    expect(getOffsetCell('INVALID', 1)).toBeNull();
  });

  it('returns null when offset results in invalid column', () => {
    expect(getOffsetCell('A1', -1)).toBeNull();
  });

  it('offsets column to the right by 1', () => {
    expect(getOffsetCell('A1', 1)).toBe('B1');
  });

  it('offsets column to the left by 1', () => {
    expect(getOffsetCell('B1', -1)).toBe('A1');
  });

  it('offsets column to the right by multiple positions', () => {
    expect(getOffsetCell('A1', 5)).toBe('F1');
  });

  it('handles multi-letter columns correctly', () => {
    expect(getOffsetCell('Z1', 1)).toBe('AA1');
  });

  it('handles offset from multi-letter columns', () => {
    expect(getOffsetCell('AA1', -1)).toBe('Z1');
  });

  it('preserves row number when offsetting', () => {
    expect(getOffsetCell('C15', 2)).toBe('E15');
  });

  it('handles large column offsets', () => {
    expect(getOffsetCell('A1', 25)).toBe('Z1');
  });

  it('handles offset beyond Z to AA', () => {
    expect(getOffsetCell('Z1', 1)).toBe('AA1');
  });

  it('handles offset from AA to AB', () => {
    expect(getOffsetCell('AA1', 1)).toBe('AB1');
  });
});

