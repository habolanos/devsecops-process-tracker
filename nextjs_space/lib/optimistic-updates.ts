'use client';

import { ProcessState } from './types';
import { toast } from 'sonner';

// ============================================
// Optimistic Updates System
// Updates UI immediately with rollback on failure
// ============================================

export interface OptimisticOperation<T> {
  id: string;
  type: string;
  timestamp: number;
  previousState: T;
  optimisticState: T;
  status: 'pending' | 'committed' | 'rolledback';
}

// Stack to track pending operations for potential rollback
const operationStack: OptimisticOperation<unknown>[] = [];

// Max operations to keep in history
const MAX_HISTORY = 50;

export function createOptimisticOperation<T>(
  type: string,
  previousState: T,
  optimisticState: T
): OptimisticOperation<T> {
  const operation: OptimisticOperation<T> = {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    type,
    timestamp: Date.now(),
    previousState,
    optimisticState,
    status: 'pending',
  };

  operationStack.push(operation as OptimisticOperation<unknown>);

  // Cleanup old operations
  if (operationStack.length > MAX_HISTORY) {
    operationStack.splice(0, operationStack.length - MAX_HISTORY);
  }

  return operation;
}

export function commitOperation(operationId: string): void {
  const operation = operationStack.find((op) => op.id === operationId);
  if (operation) {
    operation.status = 'committed';
  }
}

export function rollbackOperation<T>(
  operationId: string,
  applyState: (state: T) => void
): T | null {
  const operation = operationStack.find((op) => op.id === operationId);
  if (operation && operation.status === 'pending') {
    operation.status = 'rolledback';
    const previousState = operation.previousState as T;
    applyState(previousState);
    
    toast.error('Error al guardar', {
      description: 'Los cambios se han revertido.',
    });
    
    return previousState;
  }
  return null;
}

// Helper for async operations with optimistic updates
export async function withOptimisticUpdate<T, R>(
  options: {
    getCurrentState: () => T;
    getOptimisticState: () => T;
    applyState: (state: T) => void;
    persistFn: () => Promise<R>;
    operationType: string;
    onSuccess?: (result: R) => void;
    onError?: (error: Error) => void;
  }
): Promise<{ success: boolean; result?: R; error?: Error }> {
  const { 
    getCurrentState, 
    getOptimisticState, 
    applyState, 
    persistFn, 
    operationType,
    onSuccess,
    onError 
  } = options;

  // Capture current state for potential rollback
  const previousState = getCurrentState();
  const optimisticState = getOptimisticState();

  // Create operation for tracking
  const operation = createOptimisticOperation(
    operationType,
    previousState,
    optimisticState
  );

  // Apply optimistic update immediately
  applyState(optimisticState);

  try {
    // Attempt to persist
    const result = await persistFn();
    
    // Mark as committed
    commitOperation(operation.id);
    onSuccess?.(result);
    
    return { success: true, result };
  } catch (error) {
    // Rollback on failure
    rollbackOperation(operation.id, applyState);
    
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
    
    return { success: false, error: err };
  }
}

// Get pending operations count (useful for UI indicators)
export function getPendingOperationsCount(): number {
  return operationStack.filter((op) => op.status === 'pending').length;
}

// Get recent operations for debugging
export function getRecentOperations(count = 10): OptimisticOperation<unknown>[] {
  return operationStack.slice(-count);
}

// Clear all operations (useful for testing or reset)
export function clearOperations(): void {
  operationStack.length = 0;
}
