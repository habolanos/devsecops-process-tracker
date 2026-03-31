'use client';

import { toast } from 'sonner';

// ============================================
// Centralized Error Handling System
// ============================================

export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'STORAGE_ERROR'
  | 'UPLOAD_ERROR'
  | 'PARSE_ERROR'
  | 'AUTH_ERROR'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR';

export interface AppErrorOptions {
  code: ErrorCode;
  message: string;
  userMessage?: string;
  context?: Record<string, unknown>;
  cause?: Error;
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly userMessage: string;
  readonly context?: Record<string, unknown>;
  readonly timestamp: string;
  readonly originalError?: Error;

  constructor(options: AppErrorOptions) {
    super(options.message);
    this.name = 'AppError';
    this.code = options.code;
    this.userMessage = options.userMessage || options.message;
    this.context = options.context;
    this.timestamp = new Date().toISOString();
    this.originalError = options.cause;
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      userMessage: this.userMessage,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

// Error factory functions
export const createError = {
  validation: (message: string, context?: Record<string, unknown>) =>
    new AppError({
      code: 'VALIDATION_ERROR',
      message,
      userMessage: 'Los datos ingresados no son válidos.',
      context,
    }),

  network: (message: string, cause?: Error) =>
    new AppError({
      code: 'NETWORK_ERROR',
      message,
      userMessage: 'Error de conexión. Por favor verifica tu internet.',
      cause,
    }),

  storage: (message: string, context?: Record<string, unknown>) =>
    new AppError({
      code: 'STORAGE_ERROR',
      message,
      userMessage: 'Error al guardar los datos localmente.',
      context,
    }),

  upload: (message: string, context?: Record<string, unknown>) =>
    new AppError({
      code: 'UPLOAD_ERROR',
      message,
      userMessage: 'Error al subir el archivo. Intenta de nuevo.',
      context,
    }),

  parse: (message: string, context?: Record<string, unknown>) =>
    new AppError({
      code: 'PARSE_ERROR',
      message,
      userMessage: 'Error al procesar los datos.',
      context,
    }),

  notFound: (resource: string) =>
    new AppError({
      code: 'NOT_FOUND',
      message: `${resource} not found`,
      userMessage: `No se encontró: ${resource}`,
    }),

  rateLimited: () =>
    new AppError({
      code: 'RATE_LIMITED',
      message: 'Rate limit exceeded',
      userMessage: 'Demasiadas solicitudes. Por favor espera un momento.',
    }),

  unknown: (cause?: Error) =>
    new AppError({
      code: 'UNKNOWN_ERROR',
      message: cause?.message || 'Unknown error occurred',
      userMessage: 'Ocurrió un error inesperado.',
      cause,
    }),
};

// Error handler with toast notifications
export function handleError(error: unknown, showToast = true): AppError {
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('fetch') || error.message.includes('network')) {
      appError = createError.network(error.message, error);
    } else if (error.message.includes('JSON') || error.message.includes('parse')) {
      appError = createError.parse(error.message, { originalError: error.message });
    } else {
      appError = createError.unknown(error);
    }
  } else {
    appError = createError.unknown();
  }

  // Log error for debugging
  console.error('[AppError]', appError.toJSON());

  // Show toast notification
  if (showToast) {
    toast.error(appError.userMessage, {
      description: process.env.NODE_ENV === 'development' ? appError.message : undefined,
    });
  }

  return appError;
}

// Async error wrapper for try-catch simplification
export async function tryCatch<T>(
  fn: () => Promise<T>,
  onError?: (error: AppError) => void
): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    const appError = handleError(error, !onError);
    onError?.(appError);
    return null;
  }
}

// Hook for error handling in components
export function useErrorHandler() {
  return {
    handleError,
    tryCatch,
    createError,
  };
}
