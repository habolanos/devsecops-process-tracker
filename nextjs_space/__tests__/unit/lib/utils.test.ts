import { describe, it, expect } from 'vitest';
import { cn, formatDuration } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
    });

    it('handles conditional classes', () => {
      expect(cn('base-class', true && 'conditional', false && 'hidden')).toBe('base-class conditional');
    });

    it('handles Tailwind conflicts correctly', () => {
      expect(cn('px-4', 'px-2')).toBe('px-2');
    });

    it('handles empty input', () => {
      expect(cn()).toBe('');
    });

    it('handles arrays of classes', () => {
      expect(cn(['class1', 'class2'])).toBe('class1 class2');
    });

    it('handles objects with boolean values', () => {
      expect(cn({ 'class1': true, 'class2': false })).toBe('class1');
    });
  });

  describe('formatDuration', () => {
    it('formats zero seconds correctly', () => {
      expect(formatDuration(0)).toBe('00:00:00');
    });

    it('formats seconds only', () => {
      expect(formatDuration(45)).toBe('00:00:45');
    });

    it('formats minutes and seconds', () => {
      expect(formatDuration(125)).toBe('00:02:05');
    });

    it('formats hours, minutes, and seconds', () => {
      expect(formatDuration(3661)).toBe('01:01:01');
    });

    it('formats one hour exactly', () => {
      expect(formatDuration(3600)).toBe('01:00:00');
    });

    it('formats large duration', () => {
      expect(formatDuration(86400)).toBe('24:00:00');
    });

    it('pads numbers with zeros correctly', () => {
      expect(formatDuration(5)).toBe('00:00:05');
      expect(formatDuration(65)).toBe('00:01:05');
      expect(formatDuration(3605)).toBe('01:00:05');
    });
  });
});
