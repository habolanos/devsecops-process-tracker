import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCompressedStorage, storageUtils } from '@/lib/persist-storage';

// Mock lz-string
vi.mock('lz-string', () => ({
  compress: vi.fn((data: string) => `compressed:${data}`),
  decompress: vi.fn((data: string) => {
    if (data.startsWith('compressed:')) {
      return data.replace('compressed:', '');
    }
    return null;
  }),
}));

describe('persist-storage', () => {
  let storage: ReturnType<typeof createCompressedStorage>;
  let localStorageMock: Record<string, string>;

  beforeEach(() => {
    storage = createCompressedStorage();
    localStorageMock = {};
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageMock[key] || null),
        setItem: vi.fn((key: string, value: string) => {
          localStorageMock[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
          delete localStorageMock[key];
        }),
        hasOwnProperty: vi.fn((key: string) => key in localStorageMock),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('createCompressedStorage', () => {
    describe('getItem', () => {
      it('should return null for non-existent key', () => {
        const result = storage.getItem('non-existent');
        expect(result).toBeNull();
      });

      it('should handle server-side rendering (window undefined)', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const result = storage.getItem('test-key');
        expect(result).toBeNull();
        
        global.window = originalWindow;
      });

      it('should handle legacy uncompressed data', () => {
        const legacyData = JSON.stringify({ state: { test: 'data' } });
        localStorageMock['legacy-key'] = legacyData;
        
        const result = storage.getItem('legacy-key');
        expect(result).toEqual({ state: { test: 'data' } });
      });

      it('should return null on invalid JSON', () => {
        localStorageMock['invalid-key'] = 'not-valid-json';
        
        const result = storage.getItem('invalid-key');
        expect(result).toBeNull();
      });

      it('should handle storage errors gracefully', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        // Data that causes decompression to return null
        localStorageMock['error-key'] = 'invalid-data-that-cannot-be-decompressed';
        
        const result = storage.getItem('error-key');
        expect(result).toBeNull();
        
        consoleSpy.mockRestore();
      });
    });

    describe('setItem', () => {
      it('should store compressed data', () => {
        vi.useFakeTimers();
        const data = { state: { test: 'value' } };
        storage.setItem('test-key', data);

        vi.runAllTimers();

        expect(localStorageMock['test-key']).toContain('compressed:');
        vi.useRealTimers();
      });

      it('should handle server-side rendering (window undefined)', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const data = { state: { test: 'value' } };
        // Should not throw
        expect(() => storage.setItem('test-key', data)).not.toThrow();
        
        global.window = originalWindow;
      });

      it('should store data without errors', () => {
        const data = { state: { data: 'x'.repeat(100) } };
        expect(() => storage.setItem('large-key', data)).not.toThrow();
      });

      it('should fallback to uncompressed on error', () => {
        vi.useFakeTimers();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock setItem to throw once
        let callCount = 0;
        const originalSetItem = window.localStorage.setItem;
        window.localStorage.setItem = vi.fn((key: string, value: string) => {
          callCount++;
          if (callCount === 1) {
            throw new Error('Quota exceeded');
          }
          localStorageMock[key] = value;
        });
        
        const data = { state: { test: 'value' } };
        storage.setItem('test-key', data);

        vi.runAllTimers();
        
        // Verify it was called twice (compressed failed, then uncompressed)
        expect(window.localStorage.setItem).toHaveBeenCalledTimes(2);
        expect(consoleSpy).toHaveBeenCalled();
        
        window.localStorage.setItem = originalSetItem;
        consoleSpy.mockRestore();
        vi.useRealTimers();
      });
    });

    describe('removeItem', () => {
      it('should remove item from storage', () => {
        localStorageMock['remove-test'] = 'data';
        storage.removeItem('remove-test');
        
        expect(localStorageMock['remove-test']).toBeUndefined();
      });

      it('should handle server-side rendering (window undefined)', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        // Should not throw
        expect(() => storage.removeItem('test-key')).not.toThrow();
        
        global.window = originalWindow;
      });
    });
  });

  describe('storageUtils', () => {
    describe('getStorageSize', () => {
      it('should return size of storage item', () => {
        localStorageMock['size-test'] = '12345';
        const size = storageUtils.getStorageSize('size-test');
        expect(size).toBe(5);
      });

      it('should return 0 for non-existent key', () => {
        const size = storageUtils.getStorageSize('non-existent');
        expect(size).toBe(0);
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const size = storageUtils.getStorageSize('test-key');
        expect(size).toBe(0);
        
        global.window = originalWindow;
      });
    });

    describe('getTotalStorageSize', () => {
      it('should calculate total storage size', () => {
        localStorageMock['key1'] = '123';
        localStorageMock['key2'] = '45678';
        
        const total = storageUtils.getTotalStorageSize();
        // Mock returns actual length
        expect(total).toBeGreaterThan(0);
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const total = storageUtils.getTotalStorageSize();
        expect(total).toBe(0);
        
        global.window = originalWindow;
      });
    });

    describe('clearStore', () => {
      it('should remove specific store', () => {
        localStorageMock['clear-me'] = 'data';
        storageUtils.clearStore('clear-me');
        expect(localStorageMock['clear-me']).toBeUndefined();
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        expect(() => storageUtils.clearStore('test')).not.toThrow();
        
        global.window = originalWindow;
      });
    });

    describe('clearAllStores', () => {
      it('should remove all app stores', () => {
        localStorageMock['process-storage'] = 'data1';
        localStorageMock['devops-config-storage'] = 'data2';
        localStorageMock['other-key'] = 'keep-me';
        
        storageUtils.clearAllStores();
        
        expect(localStorageMock['process-storage']).toBeUndefined();
        expect(localStorageMock['devops-config-storage']).toBeUndefined();
        expect(localStorageMock['other-key']).toBe('keep-me');
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        expect(() => storageUtils.clearAllStores()).not.toThrow();
        
        global.window = originalWindow;
      });
    });

    describe('exportStore', () => {
      it('should export compressed data decompressed', () => {
        const wrapper = JSON.stringify({ version: 1, state: { test: 'data' } });
        localStorageMock['export-test'] = `compressed:${wrapper}`;
        
        const result = storageUtils.exportStore('export-test');
        expect(result).toBe(wrapper);
      });

      it('should return null for non-existent key', () => {
        const result = storageUtils.exportStore('non-existent');
        expect(result).toBeNull();
      });

      it('should handle uncompressed data', () => {
        localStorageMock['uncompressed'] = 'raw-data';
        const result = storageUtils.exportStore('uncompressed');
        expect(result).toBe('raw-data');
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const result = storageUtils.exportStore('test');
        expect(result).toBeNull();
        
        global.window = originalWindow;
      });
    });

    describe('importStore', () => {
      it('should import and compress valid JSON', () => {
        const data = JSON.stringify({ version: 1, state: { test: 'imported' } });
        const result = storageUtils.importStore('import-test', data);
        
        expect(result).toBe(true);
        expect(localStorageMock['import-test']).toContain('compressed:');
      });

      it('should return false for invalid JSON', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = storageUtils.importStore('import-test', 'not-valid-json');
        
        expect(result).toBe(false);
        consoleSpy.mockRestore();
      });

      it('should handle server-side rendering', () => {
        const originalWindow = global.window;
        // @ts-expect-error - Testing window undefined
        delete global.window;
        
        const data = JSON.stringify({ test: 'data' });
        const result = storageUtils.importStore('test', data);
        expect(result).toBe(false);
        
        global.window = originalWindow;
      });
    });
  });
});
