import { describe, it, expect } from 'vitest';
import { getOffsetCell } from '@/lib/excel-template-helper';

describe('excel-template-helper', () => {
  describe('getOffsetCell', () => {
    it('should return same cell when offset is 0', () => {
      expect(getOffsetCell('A1', 0)).toBe('A1');
      expect(getOffsetCell('F85', 0)).toBe('F85');
    });

    it('should move left by 1 column with offset -1', () => {
      expect(getOffsetCell('B1', -1)).toBe('A1');
      expect(getOffsetCell('F85', -1)).toBe('E85');
      expect(getOffsetCell('Z10', -1)).toBe('Y10');
    });

    it('should move right by 1 column with offset 1', () => {
      expect(getOffsetCell('A1', 1)).toBe('B1');
      expect(getOffsetCell('F85', 1)).toBe('G85');
      expect(getOffsetCell('Y10', 1)).toBe('Z10');
    });

    it('should handle multi-letter column names', () => {
      expect(getOffsetCell('AA1', -1)).toBe('Z1');
      expect(getOffsetCell('AB1', -1)).toBe('AA1');
      expect(getOffsetCell('AZ1', -1)).toBe('AY1');
      expect(getOffsetCell('BA1', -1)).toBe('AZ1');
    });

    it('should handle larger offsets', () => {
      expect(getOffsetCell('D1', -3)).toBe('A1');
      expect(getOffsetCell('A1', 5)).toBe('F1');
      expect(getOffsetCell('AA1', 2)).toBe('AC1');
    });

    it('should return null when offset goes before column A', () => {
      expect(getOffsetCell('A1', -1)).toBe(null);
      expect(getOffsetCell('B1', -3)).toBe(null);
    });

    it('should preserve row number', () => {
      expect(getOffsetCell('F85', -1)).toBe('E85');
      expect(getOffsetCell('F100', -1)).toBe('E100');
      expect(getOffsetCell('AA999', 1)).toBe('AB999');
    });

    it('should handle invalid cell references', () => {
      expect(getOffsetCell('', 1)).toBe(null);
      expect(getOffsetCell('123', -1)).toBe(null);
      expect(getOffsetCell('A', 1)).toBe(null);
    });
  });
});
