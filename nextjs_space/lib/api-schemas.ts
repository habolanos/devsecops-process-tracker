import { z } from 'zod';

// ============================================
// Upload API Schemas
// ============================================

export const presignedUploadSchema = z.object({
  fileName: z
    .string()
    .min(1, 'fileName is required')
    .max(255, 'fileName must be less than 255 characters')
    .regex(/^[\w\-. ()]+$/, 'fileName contains invalid characters'),
  contentType: z
    .string()
    .regex(
      /^(image\/(jpeg|jpg|png|gif|webp|svg\+xml)|application\/(pdf|json|yaml|x-yaml)|text\/(plain|yaml))$/,
      'Invalid content type'
    ),
  isPublic: z.boolean().optional().default(false),
});

export const completeUploadSchema = z.object({
  cloudStoragePath: z
    .string()
    .min(1, 'cloudStoragePath is required')
    .max(1024, 'cloudStoragePath too long'),
  isPublic: z.boolean().optional().default(false),
});

export const deleteUploadSchema = z.object({
  cloudStoragePath: z
    .string()
    .min(1, 'cloudStoragePath is required')
    .max(1024, 'cloudStoragePath too long'),
});

// ============================================
// Process API Schemas
// ============================================

export const processIdSchema = z.object({
  id: z
    .string()
    .min(1, 'Process ID is required')
    .max(100, 'Process ID too long')
    .regex(/^[\w\-]+$/, 'Process ID contains invalid characters'),
});

// ============================================
// Type exports
// ============================================

export type PresignedUploadInput = z.infer<typeof presignedUploadSchema>;
export type CompleteUploadInput = z.infer<typeof completeUploadSchema>;
export type DeleteUploadInput = z.infer<typeof deleteUploadSchema>;
export type ProcessIdInput = z.infer<typeof processIdSchema>;

// ============================================
// Validation helper
// ============================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
      return { success: false, error: messages.join('; ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}
