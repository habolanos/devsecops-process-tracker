import { describe, it, expect, beforeEach } from 'vitest';
import { useLoadingStore } from '@/lib/loading-store';

describe('useLoadingStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useLoadingStore.setState({
      activeOperations: new Set<string>(),
      isLoading: false,
    });
  });

  describe('initial state', () => {
    it('should initialize with empty operations and isLoading false', () => {
      const state = useLoadingStore.getState();
      expect(state.activeOperations.size).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('startOperation', () => {
    it('should add operation and set isLoading to true', () => {
      const { startOperation } = useLoadingStore.getState();
      
      startOperation('test-operation');
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.has('test-operation')).toBe(true);
      expect(state.isLoading).toBe(true);
    });

    it('should handle multiple concurrent operations', () => {
      const { startOperation } = useLoadingStore.getState();
      
      startOperation('op-1');
      startOperation('op-2');
      startOperation('op-3');
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.size).toBe(3);
      expect(state.isLoading).toBe(true);
    });

    it('should not add duplicate operations', () => {
      const { startOperation } = useLoadingStore.getState();
      
      startOperation('op-1');
      startOperation('op-1'); // Duplicate
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.size).toBe(1);
    });
  });

  describe('endOperation', () => {
    it('should remove operation and set isLoading to false when no operations remain', () => {
      const { startOperation, endOperation } = useLoadingStore.getState();
      
      startOperation('test-operation');
      endOperation('test-operation');
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.has('test-operation')).toBe(false);
      expect(state.isLoading).toBe(false);
    });

    it('should keep isLoading true when other operations remain', () => {
      const { startOperation, endOperation } = useLoadingStore.getState();
      
      startOperation('op-1');
      startOperation('op-2');
      endOperation('op-1');
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.has('op-1')).toBe(false);
      expect(state.activeOperations.has('op-2')).toBe(true);
      expect(state.isLoading).toBe(true);
    });

    it('should handle ending non-existent operation gracefully', () => {
      const { endOperation } = useLoadingStore.getState();
      
      expect(() => endOperation('non-existent')).not.toThrow();
      
      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('clearAll', () => {
    it('should clear all operations and set isLoading to false', () => {
      const { startOperation, clearAll } = useLoadingStore.getState();
      
      startOperation('op-1');
      startOperation('op-2');
      
      clearAll();
      
      const state = useLoadingStore.getState();
      expect(state.activeOperations.size).toBe(0);
      expect(state.isLoading).toBe(false);
    });
  });

  describe('isLoading calculation', () => {
    it('should be true when at least one operation is active', () => {
      const { startOperation } = useLoadingStore.getState();
      
      startOperation('op-1');
      
      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(true);
    });

    it('should be false when no operations are active', () => {
      const { startOperation, endOperation } = useLoadingStore.getState();
      
      startOperation('op-1');
      endOperation('op-1');
      
      const state = useLoadingStore.getState();
      expect(state.isLoading).toBe(false);
    });
  });
});
