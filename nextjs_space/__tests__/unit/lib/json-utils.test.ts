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
            activities: [],
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                description: 'First task',
                order: 1,
                type: 'standard',
                completed: true,
                completedAt: '2024-01-15T11:00:00Z',
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'text', required: false },
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
        description: 'Test',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: []
      }
    };

    const before = new Date();
    const result = importProcessFromJSON(exportData);
    const after = new Date();

    expect(result.loadedAt).toBeDefined();
    const loadedAt = new Date(result.loadedAt!);
    expect(loadedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(loadedAt.getTime()).toBeLessThanOrEqual(after.getTime());
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
        description: '',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 0,
            progress: 0,
            activities: [],
            tasks: [
              {
                id: 'task-1',
                name: 'Task 1',
                description: '',
                order: 0,
                type: 'standard',
                completed: false,
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'text', required: false },
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
        description: 'Test',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'p1',
            name: 'P1',
            description: 'Phase 1',
            order: 1,
            progress: 0,
            activities: [],
            tasks: [
              {
                id: 't1',
                name: 'T1',
                description: '',
                order: 1,
                type: 'standard',
                completed: false,
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'text', required: false },
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

  it('should import dynamic-list task with listData', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'p1',
            name: 'P1',
            description: 'Phase 1',
            order: 1,
            progress: 0,
            activities: [],
            tasks: [
              {
                id: 't1',
                name: 'Dynamic List Task',
                description: '',
                order: 1,
                type: 'dynamic-list',
                completed: true,
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'form', required: true },
                listConfig: {
                  label: 'Repository',
                  minItems: 1,
                  maxItems: 10
                },
                listData: [
                  { id: 'item-1', value: 'repo1', addedAt: '2024-01-01T00:00:00Z' },
                  { id: 'item-2', value: 'repo2', addedAt: '2024-01-01T00:00:00Z' }
                ],
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
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('dynamic-list');
    expect(task.listConfig?.label).toBe('Repository');
    expect(task.listData?.length).toBe(2);
    expect(task.listData?.[0].value).toBe('repo1');
  });

  it('should import detail-list task with detailData', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'p1',
            name: 'P1',
            description: 'Phase 1',
            order: 1,
            progress: 0,
            activities: [],
            tasks: [
              {
                id: 't1',
                name: 'Detail List Task',
                description: '',
                order: 1,
                type: 'detail-list',
                completed: true,
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'form', required: true },
                detailConfig: {
                  sourceTaskId: 'source-task'
                },
                detailData: [
                  { sourceItem: 'repo1', capturedText: 'Detail for repo1', addedAt: '2024-01-01T00:00:00Z' },
                  { sourceItem: 'repo2', capturedText: 'Detail for repo2', addedAt: '2024-01-01T00:00:00Z' }
                ],
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
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('detail-list');
    expect(task.detailConfig?.sourceTaskId).toBe('source-task');
    expect(task.detailData?.length).toBe(2);
    expect(task.detailData?.[0].sourceItem).toBe('repo1');
    expect(task.detailData?.[0].capturedText).toBe('Detail for repo1');
  });

  it('should import form task with formData', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
        exportedAt: '2024-01-01T00:00:00Z',
        progress: 0,
        phases: [
          {
            id: 'p1',
            name: 'P1',
            description: 'Phase 1',
            order: 1,
            progress: 0,
            activities: [],
            tasks: [
              {
                id: 't1',
                name: 'Form Task',
                description: '',
                order: 1,
                type: 'form',
                completed: true,
                checkItems: [],
                references: [],
                dependencies: [],
                dynamicLinks: [],
                evidenceConfig: { type: 'form', required: true },
                formConfig: {
                  layout: {
                    type: 'grid',
                    columns: 2,
                    gap: 'medium'
                  },
                  fields: [
                    { id: 'field1', label: 'Field 1', type: 'text', required: true },
                    { id: 'field2', label: 'Field 2', type: 'number', required: false }
                  ]
                },
                formData: [
                  { fieldId: 'field1', value: 'Test value', filledAt: '2024-01-01T00:00:00Z' },
                  { fieldId: 'field2', value: 123, filledAt: '2024-01-01T00:00:00Z' }
                ],
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
    const task = result.phases[0].tasks[0];

    expect(task.type).toBe('form');
    expect(task.formConfig?.layout.type).toBe('grid');
    expect(task.formConfig?.fields.length).toBe(2);
    expect(task.formData?.length).toBe(2);
    expect(task.formData?.[0].fieldId).toBe('field1');
    expect(task.formData?.[0].value).toBe('Test value');
  });
});

describe('downloadJSON', () => {
  it('should create download link for JSON data', () => {
    const exportData: ProcessExportJSON = {
      process: {
        id: 'test',
        name: 'Test',
        description: 'Test',
        version: '1.0.0',
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
