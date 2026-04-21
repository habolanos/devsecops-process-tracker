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
    expect(s.confirmButtonClass).toContain('red');
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
});
