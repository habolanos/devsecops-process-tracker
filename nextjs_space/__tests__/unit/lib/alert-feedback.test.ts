import { describe, it, expect } from 'vitest';
import { getSeverityStyles } from '@/lib/alert-feedback';
import { Info, AlertTriangle, AlertOctagon } from 'lucide-react';

describe('getSeverityStyles', () => {
  it('returns Info icon and blue palette for info severity', () => {
    const s = getSeverityStyles('info');
    expect(s.Icon).toBe(Info);
    expect(s.iconClass).toContain('blue');
    expect(s.flashAnimationClass).toBe('');
  });

  it('returns AlertTriangle icon and amber palette for warning', () => {
    const s = getSeverityStyles('warning');
    expect(s.Icon).toBe(AlertTriangle);
    expect(s.iconClass).toContain('amber');
    expect(s.flashAnimationClass).toBe('animate-pulse-once');
  });

  it('returns AlertOctagon icon and red palette for critical', () => {
    const s = getSeverityStyles('critical');
    expect(s.Icon).toBe(AlertOctagon);
    expect(s.iconClass).toContain('red');
    expect(s.flashAnimationClass).toBe('animate-pulse-strong');
  });

  it('falls back to info when severity is undefined', () => {
    const fallback = getSeverityStyles(undefined);
    const info = getSeverityStyles('info');
    expect(fallback).toEqual(info);
  });

  it('includes alertdialog role for all severities', () => {
    for (const sev of ['info', 'warning', 'critical'] as const) {
      expect(getSeverityStyles(sev).ariaRole).toBe('alertdialog');
      expect(getSeverityStyles(sev).ariaLabel.length).toBeGreaterThan(0);
    }
  });

  describe('confirmButtonClass', () => {
    it('uses green color matching the complete-task button for all severities', () => {
      for (const sev of ['info', 'warning', 'critical'] as const) {
        const s = getSeverityStyles(sev);
        expect(s.confirmButtonClass).toContain('bg-green-500');
        expect(s.confirmButtonClass).toContain('text-white');
        expect(s.confirmButtonClass).toContain('hover:bg-green-600');
      }
    });

    it('includes layout classes for proper button rendering', () => {
      for (const sev of ['info', 'warning', 'critical'] as const) {
        const s = getSeverityStyles(sev);
        expect(s.confirmButtonClass).toContain('px-4');
        expect(s.confirmButtonClass).toContain('py-2');
        expect(s.confirmButtonClass).toContain('rounded-lg');
        expect(s.confirmButtonClass).toContain('font-medium');
      }
    });
  });

  describe('cancelButtonClass', () => {
    it('uses gray background for all severities', () => {
      for (const sev of ['info', 'warning', 'critical'] as const) {
        const s = getSeverityStyles(sev);
        expect(s.cancelButtonClass).toContain('bg-gray');
        expect(s.cancelButtonClass).toContain('text-gray');
      }
    });

    it('includes layout classes for proper button rendering', () => {
      for (const sev of ['info', 'warning', 'critical'] as const) {
        const s = getSeverityStyles(sev);
        expect(s.cancelButtonClass).toContain('px-4');
        expect(s.cancelButtonClass).toContain('py-2');
        expect(s.cancelButtonClass).toContain('rounded-md');
        expect(s.cancelButtonClass).toContain('font-medium');
      }
    });

    it('critical cancel button uses slightly darker gray than info/warning', () => {
      const critical = getSeverityStyles('critical');
      const info = getSeverityStyles('info');
      expect(critical.cancelButtonClass).toContain('bg-gray-200');
      expect(info.cancelButtonClass).toContain('bg-gray-100');
    });
  });

  describe('containerClass', () => {
    it('critical uses solid red-50 background (no transparency)', () => {
      const s = getSeverityStyles('critical');
      expect(s.containerClass).toContain('bg-red-50');
      expect(s.containerClass).toContain('border-red-500');
      expect(s.containerClass).toContain('border-2');
      // Should NOT contain opacity modifier
      expect(s.containerClass).not.toContain('/60');
      expect(s.containerClass).not.toContain('/50');
    });

    it('warning uses semi-transparent amber background', () => {
      const s = getSeverityStyles('warning');
      expect(s.containerClass).toContain('bg-amber-50/60');
      expect(s.containerClass).toContain('border-amber-300');
    });

    it('info uses semi-transparent blue background', () => {
      const s = getSeverityStyles('info');
      expect(s.containerClass).toContain('bg-blue-50/50');
      expect(s.containerClass).toContain('border-blue-200');
    });
  });
});
