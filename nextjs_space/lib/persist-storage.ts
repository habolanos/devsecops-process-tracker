'use client';

import { PersistStorage, StorageValue } from 'zustand/middleware';
import { compress, decompress } from 'lz-string';

// ============================================
// Compressed Storage with Versioning
// Reduces localStorage usage by ~60-70%
// ============================================

const STORAGE_VERSION = 1;
const SAVE_DEBOUNCE_MS = 1000; // Debounce saves by 1 second

interface DebouncedStorage {
  timeout: ReturnType<typeof setTimeout> | null;
  pendingValue: StorageValue<unknown> | null;
}

const debouncedStorages = new Map<string, DebouncedStorage>();

interface StorageWrapper {
  version: number;
  timestamp: string;
  state: unknown;
}

// Create compressed storage adapter compatible with Zustand
export function createCompressedStorage<T>(): PersistStorage<T> {
  return {
    getItem: (name: string): StorageValue<T> | null => {
      if (typeof window === 'undefined') return null;
      
      try {
        const compressed = localStorage.getItem(name);
        if (!compressed) return null;
        
        // Try to decompress
        const decompressed = decompress(compressed);
        if (!decompressed) {
          // Might be uncompressed legacy data - try parsing directly
          try {
            return JSON.parse(compressed) as StorageValue<T>;
          } catch {
            return null;
          }
        }
        
        // Parse and check version
        const wrapper: StorageWrapper = JSON.parse(decompressed);
        
        // Version migration if needed
        if (wrapper.version !== STORAGE_VERSION) {
          console.log(`Migrating storage ${name} from v${wrapper.version} to v${STORAGE_VERSION}`);
        }
        
        return { state: wrapper.state as T };
      } catch (error) {
        console.error(`Error reading storage ${name}:`, error);
        return null;
      }
    },
    
    setItem: (name: string, value: StorageValue<T>): void => {
      if (typeof window === 'undefined') return;
      
      // Get or create debounce state for this storage
      let debounceState = debouncedStorages.get(name) as DebouncedStorage | undefined;
      if (!debounceState) {
        debounceState = { timeout: null, pendingValue: null };
        debouncedStorages.set(name, debounceState);
      }
      
      // Store pending value
      debounceState.pendingValue = value as StorageValue<unknown>;
      
      // Clear existing timeout
      if (debounceState.timeout) {
        clearTimeout(debounceState.timeout);
      }
      
      // Set new timeout for actual save
      debounceState.timeout = setTimeout(() => {
        try {
          const wrapper: StorageWrapper = {
            version: STORAGE_VERSION,
            timestamp: new Date().toISOString(),
            state: debounceState!.pendingValue!.state,
          };
          
          const compressed = compress(JSON.stringify(wrapper));
          
          // Check size before saving
          const sizeInKB = compressed.length / 1024;
          if (sizeInKB > 4500) {
            console.warn(`Storage ${name} approaching localStorage limit: ${sizeInKB.toFixed(2)}KB`);
          }
          
          localStorage.setItem(name, compressed);
        } catch (error) {
          console.error(`Error writing storage ${name}:`, error);
          // Fallback to uncompressed
          localStorage.setItem(name, JSON.stringify(debounceState!.pendingValue));
        }
        
        // Clear pending
        debounceState!.pendingValue = null;
        debounceState!.timeout = null;
      }, SAVE_DEBOUNCE_MS);
    },
    
    removeItem: (name: string): void => {
      if (typeof window === 'undefined') return;
      localStorage.removeItem(name);
    },
  };
}

// Storage utility functions
export const storageUtils = {
  // Get storage size for a key
  getStorageSize(key: string): number {
    if (typeof window === 'undefined') return 0;
    const item = localStorage.getItem(key);
    return item ? item.length : 0;
  },
  
  // Get total localStorage usage
  getTotalStorageSize(): number {
    if (typeof window === 'undefined') return 0;
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage.getItem(key)?.length ?? 0;
      }
    }
    return total;
  },
  
  // Clear specific store
  clearStore(name: string): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(name);
  },
  
  // Clear all app stores
  clearAllStores(): void {
    if (typeof window === 'undefined') return;
    const appStores = ['process-storage', 'devops-config-storage'];
    appStores.forEach(store => localStorage.removeItem(store));
  },
  
  // Export store data for backup
  exportStore(name: string): string | null {
    if (typeof window === 'undefined') return null;
    const compressed = localStorage.getItem(name);
    if (!compressed) return null;
    
    try {
      const decompressed = decompress(compressed);
      return decompressed || compressed;
    } catch {
      return compressed;
    }
  },
  
  // Import store data from backup
  importStore(name: string, data: string): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      // Validate JSON
      JSON.parse(data);
      
      // Compress and save
      const compressed = compress(data);
      localStorage.setItem(name, compressed);
      return true;
    } catch (error) {
      console.error('Import failed:', error);
      return false;
    }
  },
};

