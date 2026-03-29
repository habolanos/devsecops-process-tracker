import { describe, it, expect, vi } from 'vitest';
import { 
  exportProcessToJSON, 
  importProcessFromJSON, 
  downloadJSON 
} from '@/lib/json-utils';
import { ProcessState, ProcessExportJSON } from '@/lib/types';

describe('importProcessFromJSON', () => {
  it('should import valid process JSON', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test-process',
        name: 'Test Process',
        description: 'Test description',
        version: '1.0.0',
        exportedAt: '2024-01-15T10:00:00Z',
        completedAt: '2024-01-15T12:00:00Z',
        progress: 0.5,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: 'First phase',
            order: 1,
            progress: 0.5,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                description: 'First task',
                order: 1,
                completed: true,
                completedAt: '2024-01-15T11:00:00Z',
                evidence: {
                  text: 'Some evidence',
                  images: [
                    {
                      name: 'screenshot.png',
                      data: 'base64data',
                      source: 'file' as const,
                      originalUrl: undefined
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    };

    const result = importProcessFromJSON(exportData);

    expect(result.id).toBe('test-process');
    expect(result.name).toBe('Test Process');
    expect(result.completedAt).toBe('2024-01-15T12:00:00Z');
    expect(result.phases[0].tasks[0].completed).toBe(true);
    expect(result.phases[0].tasks[0].evidence.text).toBe('Some evidence');
    expect(result.phases[0].tasks[0].evidence.images[0].url).toContain('data:image/png;base64');
  });

  it('should set loadedAt timestamp on import', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: []
      }
    };

    const before = new Date().toISOString();
    const result = importProcessFromJSON(exportData);
    const after = new Date().toISOString();

    expect(result.loadedAt).toBeGreaterThanOrEqual(before);
    expect(result.loadedAt).toBeLessThanOrEqual(after);
  });

  it('should throw error for invalid JSON structure', () => {
    const invalidData = {
      process: {
        id: '', // Missing required fields
        name: ''
      }
    } as any;

    expect(() => importProcessFromJSON(invalidData)).toThrow('Invalid JSON structure');
  });

  it('should handle missing optional fields with defaults', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 0,
            progress: 0,
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                description: '',
                order: 0,
                completed: false,
                evidence: {
                  images: []
                }
              }
            ]
          }
        ]
      }
    };

    const result = importProcessFromJSON(exportData);

    expect(result.version).toBe('1.0.0');
    expect(result.description).toBe('');
    expect(result.phases[0].description).toBe('');
    expect(result.phases[0].tasks[0].completed).toBe(false);
  });

  it('should create unique IDs for imported images', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'p1',
            name: 'P1',
            order: 1,
            progress: 0,
            tasks: [
              {
                id: 't1',
                name: 'T1',
                order: 1,
                completed: false,
                evidence: {
                  images: [
                    { name: 'img1.png', data: 'data1', source: 'file' },
                    { name: 'img2.png', data: 'data2', source: 'url', originalUrl: 'http://example.com' }
                  ]
                }
              }
            ]
          }
        ]
      }
    };

    const result = importProcessFromJSON(exportData);
    const images = result.phases[0].tasks[0].evidence.images;

    expect(images[0].id).toContain('imported-t1-0');
    expect(images[1].id).toContain('imported-t1-1');
    expect(images[0].isPublic).toBe(false);
    expect(images[0].cloudStoragePath).toBe('');
  });
});

describe('downloadJSON', () => {
  it('should create download link for JSON data', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: []
      }
    };

    downloadJSON(exportData, 'test-export.json');

    // Verify URL.createObjectURL was called
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});

// Note: exportProcessToJSON requires mocking fetch for image conversion
// This is covered in integration tests
