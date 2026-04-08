import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeFilename,
  sanitizeRichText,
  useSanitizedValue,
} from '@/lib/sanitize';

describe('sanitize utilities', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;'
    );
  });

  it('sanitizes plain text removing tags', () => {
    expect(sanitizeText('<b>Hello</b> <i>World</i>')).toBe('Hello World');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('sanitizes URLs allowing only safe protocols', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
    expect(sanitizeUrl('mailto:test@example.com')).toBe('mailto:test@example.com');
    expect(sanitizeUrl('javascript:alert(1)')).toBe('');
  });

  it('sanitizes URLs allowing relative paths', () => {
    expect(sanitizeUrl('/api/test')).toBe('&#x2F;api&#x2F;test');
    expect(sanitizeUrl('./local/path')).toBe('.&#x2F;local&#x2F;path');
    expect(sanitizeUrl('../up/path')).toBe('..&#x2F;up&#x2F;path');
  });

  it('sanitizes filenames', () => {
    expect(sanitizeFilename('../secret?.txt')).toBe('secret.txt');
    expect(sanitizeFilename('normal-file.txt')).toBe('normal-file.txt');
    expect(sanitizeFilename('')).toBe('file');
  });

  it('sanitizes rich text preserving allowed tags only', () => {
    const input = '<p onclick="x()">ok</p><script>alert(1)</script><strong>safe</strong><img src=x />';
    expect(sanitizeRichText(input)).toBe('<p>ok</p><strong>safe</strong>');
  });

  it('uses sanitized value hook helper', () => {
    expect(useSanitizedValue('<span>safe</span><script>x</script>')).toBe('safex');
  });
});
