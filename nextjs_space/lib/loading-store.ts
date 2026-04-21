'use client';

import { create } from 'zustand';

interface LoadingStore {
  activeOperations: Set<string>;
  isLoading: boolean;
  
  // Actions
  startOperation: (operationId: string) => void;
  endOperation: (operationId: string) => void;
  clearAll: () => void;
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  activeOperations: new Set<string>(),
  isLoading: false,
  
  startOperation: (operationId: string) => {
    set((state) => {
      const newOperations = new Set(state.activeOperations);
      newOperations.add(operationId);
      return {
        activeOperations: newOperations,
        isLoading: newOperations.size > 0
      };
    });
  },
  
  endOperation: (operationId: string) => {
    set((state) => {
      const newOperations = new Set(state.activeOperations);
      newOperations.delete(operationId);
      return {
        activeOperations: newOperations,
        isLoading: newOperations.size > 0
      };
    });
  },
  
  clearAll: () => {
    set({
      activeOperations: new Set<string>(),
      isLoading: false
    });
  }
}));
