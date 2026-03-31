'use client';

// ============================================
// XSS Sanitization Utilities
// Lightweight sanitizer for user-generated content
// For production, consider using DOMPurify for more robust sanitization
// ============================================

// HTML entities map for escaping
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

// Escape HTML special characters
export function escapeHtml(str: string): string {
  if (!str || typeof str !== 'string') return '';
  return str.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

// Sanitize text content - removes HTML tags and escapes entities
export function sanitizeText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML tags
  const withoutTags = input.replace(/<[^>]*>/g, '');
  
  // Escape remaining HTML entities
  return escapeHtml(withoutTags);
}

// Sanitize URL - only allow safe protocols
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // Allow only safe protocols
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  
  try {
    const parsed = new URL(trimmed);
    if (!safeProtocols.includes(parsed.protocol)) {
      return '';
    }
    return trimmed;
  } catch {
    // If not a valid URL, check if it's a relative path
    if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
      // Relative paths are allowed
      return escapeHtml(trimmed);
    }
    // Invalid URL
    return '';
  }
}

// Sanitize filename - remove path traversal and special chars
export function sanitizeFilename(filename: string | undefined | null): string {
  if (!filename || typeof filename !== 'string') return 'file';
  
  return filename
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '') // Remove invalid chars
    .replace(/\.\./g, '')                   // Remove path traversal
    .replace(/^\.+/, '')                    // Remove leading dots
    .slice(0, 255)                          // Limit length
    .trim() || 'file';
}

// Sanitize for rendering in DOM with allowed formatting
export function sanitizeRichText(input: string | undefined | null): string {
  if (!input || typeof input !== 'string') return '';
  
  // List of allowed tags (basic formatting only)
  const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'br', 'p', 'span'];
  
  // Remove script tags and event handlers first
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*(['"])[^'"]*\1/gi, '')
    .replace(/javascript:/gi, '');
  
  // Keep only allowed tags
  sanitized = sanitized.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag) => {
    if (allowedTags.includes(tag.toLowerCase())) {
      // Only keep the tag itself, strip attributes
      const isClosing = match.startsWith('</');
      return isClosing ? `</${tag.toLowerCase()}>` : `<${tag.toLowerCase()}>`;
    }
    return '';
  });
  
  return sanitized;
}

// Hook for sanitized display values
export function useSanitizedValue(value: string | undefined | null): string {
  return sanitizeText(value);
}
