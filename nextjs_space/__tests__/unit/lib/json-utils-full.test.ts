import { describe, it, expect, vi } from 'vitest';
import { exportProcessToJSON, importProcessFromJSON, downloadJSON } from '@/lib/json-utils';
import { ProcessState } from '@/lib/types';

// Mock fetch for image export
vi.stubGlobal('fetch', vi.fn());
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'mock-url'),
  revokeObjectURL: vi.fn()
});

describe('json-utils additional coverage', () => {
  const createMockProcess = (): ProcessState => ({
    id: 'test-process',
    name: 'Test Process',
    description: 'Test Description',
    version: '1.0.0',
    phases: [
      {
        id: 'phase-1',
        name: 'Phase 1',
        description: 'Test phase',
        order: 1,
        tasks: [
          {
            id: 'task-1',
            name: 'Task 1',
            description: 'Test task',
            order: 1,
            completed: true,
            completedAt: '2024-01-01T00:00:00Z',
            type: 'standard' as const,
            checkItems: [],
            evidence: {
              text: 'Test evidence',
              images: [
                {
                  id: 'img-1',
                  name: 'test.png',
                  url: 'http://example.com/image.png',
                  source: 'file' as const,
                  originalUrl: 'http://example.com/image.png',
                  isPublic: true,
                  cloudStoragePath: '',
                  uploadedAt: '2024-01-01T00:00:00Z'
                }
              ]
            },
            references: [],
            dynamicLinks: [],
            evidenceConfig: { type: 'both', required: false },
            dependencies: [],
            isBlocked: false
          }
        ],
        progress: 50,
        dynamicLinks: [],
        activities: []
      }
    ],
    progress: 50,
    variableDefinitions: [],
    capturedVariables: {},
    loadedAt: new Date().toISOString(),
    subprocesses: [],
    timeTracking: {
      status: 'idle',
      sessions: [],
      totalActiveTime: 0
    }
  });

  describe('exportProcessToJSON', () => {
    it('should export process with tasks', async () => {
      const mockProcess = createMockProcess();
      
      // Mock successful fetch
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' }))
      } as Response);

      const result = await exportProcessToJSON(mockProcess);
      
      expect(result).toBeDefined();
      expect(result.process.id).toBe('test-process');
      expect(result.process.phases).toHaveLength(1);
      expect(result.process.phases[0].tasks).toHaveLength(1);
    });

    it('should handle image fetch errors gracefully', async () => {
      const mockProcess = createMockProcess();
      
      // Mock failed fetch
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const result = await exportProcessToJSON(mockProcess);
      
      expect(result).toBeDefined();
      expect(result.process.phases[0].tasks[0].evidence.images[0].data).toBe('');
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should export activities if present', async () => {
      const mockProcess = createMockProcess();
      mockProcess.phases[0].activities = [
        {
          id: 'activity-1',
          name: 'Activity 1',
          description: 'Test activity',
          order: 1,
          progress: 50,
          images: [],
          tasks: [mockProcess.phases[0].tasks[0]],
          dynamicLinks: []
        }
      ];
      
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        blob: () => Promise.resolve(new Blob(['test'], { type: 'image/png' }))
      } as Response);

      const result = await exportProcessToJSON(mockProcess);
      
      expect(result.process.phases[0].activities).toHaveLength(1);
      expect(result.process.phases[0].activities[0].tasks).toHaveLength(1);
    });
  });

  describe('importProcessFromJSON', () => {
    it('should import valid JSON', () => {
      const exportData = {
        process: {
          id: 'imported-process',
          name: 'Imported Process',
          description: 'Imported description',
          version: '2.0.0',
          exportedAt: '2024-01-01T00:00:00Z',
          progress: 75,
          author: undefined,
          phases: [
            {
              id: 'imported-phase',
              name: 'Imported Phase',
              description: 'Phase description',
              order: 1,
              progress: 80,
              activities: [],
              tasks: [
                {
                  id: 'imported-task',
                  name: 'Imported Task',
                  description: 'Task description',
                  order: 1,
                  completed: true,
                  completedAt: '2024-01-01T00:00:00Z',
                  type: 'standard' as const,
                  checkItems: [],
                  evidence: {
                    text: 'Evidence text',
                    images: [
                      {
                        name: 'image.png',
                        data: 'base64data',
                        source: 'file' as const,
                        type: 'standard' as const,
                        checkItems: []
                      }
                    ]
                  }
                }
              ]
            }
          ]
        }
      };

      const result = importProcessFromJSON(exportData as any);
      
      expect(result.id).toBe('imported-process');
      expect(result.name).toBe('Imported Process');
      expect(result.phases).toHaveLength(1);
      expect(result.phases[0].tasks).toHaveLength(1);
      expect(result.timeTracking.status).toBe('idle');
    });

    it('should import with activities', () => {
      const exportData = {
        process: {
          id: 'imported-process',
          name: 'Imported Process',
          description: 'Imported description',
          version: '2.0.0',
          exportedAt: '2024-01-01T00:00:00Z',
          progress: 75,
          author: undefined,
          phases: [
            {
              id: 'imported-phase',
              name: 'Imported Phase',
              description: 'Phase description',
              order: 1,
              progress: 80,
              activities: [
                {
                  id: 'activity-1',
                  name: 'Activity 1',
                  description: 'Activity desc',
                  order: 1,
                  progress: 50,
                  tasks: [
                    {
                      id: 'task-in-activity',
                      name: 'Task in Activity',
                      description: 'Task desc',
                      order: 1,
                      completed: false,
                      type: 'standard' as const,
                      checkItems: [],
                      evidence: { text: '', images: [] }
                    }
                  ]
                }
              ],
              tasks: []
            }
          ]
        }
      };

      const result = importProcessFromJSON(exportData as any);
      
      expect(result.phases[0].activities).toHaveLength(1);
      expect(result.phases[0].activities[0].tasks).toHaveLength(1);
    });

    it('should throw on invalid JSON structure', () => {
      const invalidData = {
        process: {
          id: '',
          name: '',
          phases: []
        }
      };

      expect(() => importProcessFromJSON(invalidData as any)).toThrow('Invalid JSON structure');
    });

    it('should handle missing optional fields', () => {
      const minimalData = {
        process: {
          id: 'minimal',
          name: 'Minimal Process',
          description: null,
          version: null,
          phases: [
            {
              id: 'phase-1',
              name: 'Phase 1',
              description: null,
              order: null,
              progress: null,
              activities: [],
              tasks: [
                {
                  id: 'task-1',
                  name: 'Task 1',
                  description: null,
                  order: null,
                  completed: null,
                  completedAt: null,
                  evidence: {}
                }
              ]
            }
          ]
        }
      };

      const result = importProcessFromJSON(minimalData as any);
      
      expect(result.description).toBe('');
      expect(result.version).toBe('1.0.0');
      expect(result.phases[0].description).toBe('');
      expect(result.phases[0].tasks[0].isBlocked).toBe(false);
    });
  });

  describe('downloadJSON', () => {
    it('should create download link', () => {
      const mockCreateElement = vi.fn(() => ({
        href: '',
        download: '',
        click: vi.fn()
      }));
      const mockAppendChild = vi.fn();
      const mockRemoveChild = vi.fn();
      
      vi.stubGlobal('document', {
        createElement: mockCreateElement,
        body: {
          appendChild: mockAppendChild,
          removeChild: mockRemoveChild
        }
      });

      const data = { process: { id: 'test', name: 'Test' } } as any;
      downloadJSON(data, 'test-export.json');
      
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });
  });
});
