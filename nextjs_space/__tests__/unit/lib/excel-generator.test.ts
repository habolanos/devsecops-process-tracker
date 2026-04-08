import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EXCEL_CELL_MAP,
  processToReleaseReport,
  generateReleaseFilename,
  generateReleaseExcel,
  ReleaseReportData
} from '@/lib/excel-generator';
import { ProcessState } from '@/lib/types';

const {
  mockGetCell, mockWorksheet,
  mockGetWorksheet, mockWriteBuffer, mockLoad, WorkbookMock
} = vi.hoisted(() => {
  const mockGetCell = vi.fn().mockReturnValue({ value: null });
  const mockWorksheet = { getCell: mockGetCell };
  const mockGetWorksheet = vi.fn().mockReturnValue(mockWorksheet);
  const mockWriteBuffer = vi.fn().mockResolvedValue(new ArrayBuffer(8));
  const mockLoad = vi.fn().mockResolvedValue(undefined);
  const WorkbookMock = vi.fn();
  return { mockGetCell, mockWorksheet, mockGetWorksheet, mockWriteBuffer, mockLoad, WorkbookMock };
});

vi.mock('exceljs', () => ({
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock }
}));

describe('excel-generator', () => {
  describe('EXCEL_CELL_MAP', () => {
    it('should have CHECKLIST section with all required fields', () => {
      expect(EXCEL_CELL_MAP.CHECKLIST).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.INFO_GENERAL).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.VALIDACIONES).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.PR_DEUDA_TECNICA).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.PIPELINES_CD).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.ROLLBACK).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.PROCESO_REALIZADO).toBeDefined();
      expect(EXCEL_CELL_MAP.CHECKLIST.COMENTARIOS).toBeDefined();
    });

    it('should have INFO_GENERAL with all cell mappings', () => {
      const infoGeneral = EXCEL_CELL_MAP.CHECKLIST.INFO_GENERAL;
      expect(infoGeneral.TORRE).toBeDefined();
      expect(infoGeneral.FECHA_LIBERACION).toBeDefined();
      expect(infoGeneral.NOMBRE_PROYECTO).toBeDefined();
      expect(infoGeneral.API).toBeDefined();
      expect(infoGeneral.RFC).toBeDefined();
      expect(infoGeneral.LIDER).toBeDefined();
      expect(infoGeneral.DESARROLLADOR).toBeDefined();
    });

    it('should have EVIDENCIAS section', () => {
      expect(EXCEL_CELL_MAP.EVIDENCIAS).toBeDefined();
      expect(EXCEL_CELL_MAP.EVIDENCIAS.SHEET_NAME).toBe('Evidencias');
      expect(EXCEL_CELL_MAP.EVIDENCIAS.START_ROW).toBe(3);
    });
  });

  describe('processToReleaseReport', () => {
    const mockProcess = {
      id: 'test-process-123',
      name: 'Test Release Process',
      version: '1.0.0',
      description: 'Test process for release',
      loadedAt: '2026-04-06T15:00:00Z',
      completedAt: '2026-04-06T17:00:00Z',
      progress: 100,
      subprocesses: [],
      variableDefinitions: [],
      capturedVariables: {
        repository: 'api-payments',
        organization: 'myorg',
        rfcNumber: 'RFC123456',
        notaInstalacion: 'NOTA789',
        lider: 'John Doe',
        developer: 'Jane Smith',
        branch: 'main',
        releaseVersion: 'v1.2.3'
      },
      phases: [
        {
          id: 'phase-1',
          name: 'Phase 1',
          description: 'First phase',
          order: 1,
          progress: 100,
          activities: [],
          tasks: [
            {
              id: 'task-1',
              name: 'Task 1',
              description: 'First task',
              order: 1,
              type: 'standard',
              checkItems: [],
              references: [],
              evidenceConfig: { type: 'text', required: false },
              dependencies: [],
              completed: true,
              completedAt: '2026-04-06T16:00:00Z',
              evidence: { text: 'Evidence text', images: [] },
              isBlocked: false,
              dynamicLinks: []
            }
          ],
          dynamicLinks: []
        }
      ],
      timeTracking: {
        status: 'completed' as const,
        sessions: [],
        totalActiveTime: 3600000 // 1 hour
      }
    };

    it('should convert process to release report data', () => {
      const report = processToReleaseReport(mockProcess as ProcessState);

      expect(report).toBeDefined();
      expect(report.nombreProyecto).toBe('Test Release Process');
      expect(report.api).toBe('api-payments');
      expect(report.rfc).toBe('RFC123456');
      expect(report.lider).toBe('John Doe');
      expect(report.desarrollador).toBe('Jane Smith');
    });

    it('should include validaciones from tasks', () => {
      const report = processToReleaseReport(mockProcess as ProcessState);

      expect(report.validaciones).toBeDefined();
      expect(report.validaciones!.length).toBeGreaterThan(0);
      expect(report.validaciones![0].validado).toBe(true);
    });

    it('should include PR deuda tecnica data', () => {
      const report = processToReleaseReport(mockProcess as ProcessState);

      expect(report.prDeudaTecnica).toBeDefined();
      expect(report.prDeudaTecnica!.length).toBeGreaterThan(0);
      expect(report.prDeudaTecnica![0].componente).toBe('api-payments');
      expect(report.prDeudaTecnica![0].urlRepo).toContain('github.com/myorg/api-payments');
    });

    it('should include proceso realizado data', () => {
      const report = processToReleaseReport(mockProcess as ProcessState);

      expect(report.procesoRealizado).toBeDefined();
      expect(report.procesoRealizado!.idLiberacion).toBe('test-process-123');
      expect(report.procesoRealizado!.componentes).toBeDefined();
    });

    it('should include evidencias from completed tasks', () => {
      const report = processToReleaseReport(mockProcess as ProcessState);

      expect(report.evidencias).toBeDefined();
      expect(report.evidencias!.length).toBeGreaterThan(0);
      expect(report.evidencias![0].actividad).toBe('Task 1');
    });

    it('should handle process without capturedVariables', () => {
      const processWithoutVars = {
        ...mockProcess,
        capturedVariables: {}
      };

      const report = processToReleaseReport(processWithoutVars);

      expect(report).toBeDefined();
      expect(report.api).toBe('');
      expect(report.rfc).toBe('');
    });

    it('should handle process without phases', () => {
      const processWithoutPhases = {
        ...mockProcess,
        phases: []
      };

      const report = processToReleaseReport(processWithoutPhases);

      expect(report).toBeDefined();
      expect(report.validaciones).toEqual([]);
      expect(report.evidencias).toEqual([]);
    });
  });

  describe('generateReleaseFilename', () => {
    it('should generate filename with all parameters', () => {
      const filename = generateReleaseFilename(
        'My Process',
        'RFC123',
        'NOTA456'
      );

      expect(filename).toContain('Checklist_Liberacion_');
      expect(filename).toContain('RFC123');
      expect(filename).toContain('NOTA456');
      expect(filename).toContain('My_Process');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should generate filename without RFC', () => {
      const filename = generateReleaseFilename('My Process', undefined, 'NOTA456');

      expect(filename).toContain('Checklist_Liberacion_');
      expect(filename).not.toContain('RFC');
      expect(filename).toContain('NOTA456');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should generate filename without NOTA', () => {
      const filename = generateReleaseFilename('My Process', 'RFC123');

      expect(filename).toContain('Checklist_Liberacion_');
      expect(filename).toContain('RFC123');
      expect(filename).not.toContain('NOTA');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should sanitize process name for filename', () => {
      const filename = generateReleaseFilename('My Process @#$% 123');

      // Special characters are replaced with underscores
      expect(filename).toContain('My_Process');
      expect(filename).toContain('123');
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('#');
      expect(filename).not.toContain('%');
    });

    it('should include current date in filename', () => {
      const today = new Date();
      const expectedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear()}`;
      
      const filename = generateReleaseFilename('Test');

      expect(filename).toContain(expectedDate);
    });
  });

  describe('ReleaseReportData interface', () => {
    it('should accept valid release report data', () => {
      const reportData: ReleaseReportData = {
        torre: 'Tienda',
        nombreProyecto: 'API Pagos',
        api: 'api-payments',
        rfc: 'RFC123456',
        lider: 'John Doe',
        validaciones: [
          { aplica: true, validado: true, respuestaUrl: 'https://example.com' }
        ],
        prDeudaTecnica: [
          {
            componente: 'api-payments',
            integracionArq: true,
            deudaTecnica: false,
            vulnerabilidades: 'None',
            urlRepo: 'https://github.com/org/repo'
          }
        ],
        procesoRealizado: {
          idLiberacion: 'lib-001',
          fechaHoraValidacion: new Date(),
          tipoLiberacion: 'Produccion',
          fechaInicioGuardia: new Date(),
          tiempoGuardia: '2 Horas',
          fechaFinGuardia: new Date(),
          componentes: []
        }
      };

      expect(reportData.torre).toBe('Tienda');
      expect(reportData.validaciones).toHaveLength(1);
      expect(reportData.prDeudaTecnica![0].integracionArq).toBe(true);
    });
  });

  describe('processToReleaseReport with activities', () => {
    it('should collect tasks from activities (lines 290-291)', () => {
      const processWithActivities = {
        id: 'test-process',
        name: 'Test Process',
        version: '1.0.0',
        description: 'Test',
        loadedAt: '2026-01-01T00:00:00Z',
        progress: 100,
        subprocesses: [],
        variableDefinitions: [],
        capturedVariables: { repository: 'my-repo', organization: 'myorg' },
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 1,
            progress: 100,
            tasks: [],
            dynamicLinks: [],
            activities: [
              {
                id: 'activity-1',
                name: 'Activity 1',
                description: '',
                order: 1,
                progress: 100,
                dynamicLinks: [],
                images: [],
                tasks: [
                  {
                    id: 'act-task-1',
                    name: 'Activity Task 1',
                    description: '',
                    order: 1,
                    type: 'standard',
                    completed: true,
                    completedAt: '2026-01-01T10:00:00Z',
                    isBlocked: false,
                    evidenceConfig: { type: 'text', required: false },
                    evidence: { text: 'Activity evidence', images: [] },
                    dependencies: [],
                    checkItems: [],
                    dynamicLinks: [],
                    references: []
                  }
                ]
              }
            ]
          }
        ],
        timeTracking: { status: 'completed' as const, sessions: [], totalActiveTime: 0 }
      };

      const report = processToReleaseReport(processWithActivities as unknown as ProcessState);

      expect(report.evidencias).toBeDefined();
      expect(report.evidencias!.length).toBeGreaterThan(0);
      expect(report.evidencias![0].actividad).toBe('Activity Task 1');
    });

    it('should extract formData from form tasks (lines 309-312)', () => {
      const processWithFormTask = {
        id: 'test-process',
        name: 'Test Process',
        version: '1.0.0',
        description: 'Test',
        loadedAt: '2026-01-01T00:00:00Z',
        progress: 100,
        subprocesses: [],
        variableDefinitions: [],
        capturedVariables: {},
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 1,
            progress: 100,
            dynamicLinks: [],
            activities: [],
            tasks: [
              {
                id: 'form-task',
                name: 'Form Task',
                description: '',
                order: 1,
                type: 'form',
                completed: true,
                completedAt: '2026-01-01T10:00:00Z',
                isBlocked: false,
                evidenceConfig: { type: 'form', required: false },
                evidence: { text: '', images: [] },
                dependencies: [],
                checkItems: [],
                dynamicLinks: [],
                references: [],
                formData: [
                  { fieldId: 'campo1', value: 'Valor 1', filledAt: '2026-01-01T00:00:00Z' },
                  { fieldId: 'campo2', value: 'Valor 2', filledAt: '2026-01-01T00:00:00Z' }
                ],
                formConfig: { layout: { type: 'vertical' as const }, fields: [] }
              }
            ]
          }
        ],
        timeTracking: { status: 'completed' as const, sessions: [], totalActiveTime: 0 }
      };

      const report = processToReleaseReport(processWithFormTask as unknown as ProcessState);

      expect(report.formData).toBeDefined();
      expect(report.formData!['campo1']).toBe('Valor 1');
      expect(report.formData!['campo2']).toBe('Valor 2');
    });

    it('should extract listaItems from dynamic-list tasks', () => {
      const processWithListTask = {
        id: 'test-process',
        name: 'Test Process',
        version: '1.0.0',
        description: 'Test',
        loadedAt: '2026-01-01T00:00:00Z',
        progress: 100,
        subprocesses: [],
        variableDefinitions: [],
        capturedVariables: {},
        phases: [
          {
            id: 'phase-1',
            name: 'Phase 1',
            description: '',
            order: 1,
            progress: 100,
            dynamicLinks: [],
            activities: [],
            tasks: [
              {
                id: 'list-task',
                name: 'List Task',
                description: '',
                order: 1,
                type: 'dynamic-list',
                completed: true,
                completedAt: '2026-01-01T10:00:00Z',
                isBlocked: false,
                evidenceConfig: { type: 'text', required: false },
                evidence: { text: '', images: [] },
                dependencies: [],
                checkItems: [],
                dynamicLinks: [],
                references: [],
                listData: [
                  { id: 'item-1', value: 'Componente A', addedAt: '2026-01-01T00:00:00Z' },
                  { id: 'item-2', value: 'Componente B', addedAt: '2026-01-01T00:00:00Z' }
                ],
                listConfig: { label: 'Componente' }
              }
            ]
          }
        ],
        timeTracking: { status: 'completed' as const, sessions: [], totalActiveTime: 0 }
      };

      const report = processToReleaseReport(processWithListTask as unknown as ProcessState);

      expect(report.listaItems).toBeDefined();
      expect(report.listaItems).toContain('Componente A');
      expect(report.listaItems).toContain('Componente B');
    });
  });

  describe('generateReleaseExcel', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockGetCell.mockReturnValue({ value: null });
      mockWriteBuffer.mockResolvedValue(new ArrayBuffer(8));
      mockLoad.mockResolvedValue(undefined);
      mockGetWorksheet.mockReturnValue(mockWorksheet);
      WorkbookMock.mockImplementation(class {
        xlsx = { load: mockLoad, writeBuffer: mockWriteBuffer };
        worksheets = [mockWorksheet];
        getWorksheet = mockGetWorksheet;
      } as unknown as (...args: unknown[]) => unknown);
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
      }));
    });

    it('should generate Excel blob from template URL (line 411)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test Project',
        api: 'test-api',
        rfc: 'RFC001',
        lider: 'John Doe',
        desarrollador: 'Jane Smith'
      };

      const result = await generateReleaseExcel('/templates/test.xlsx', data);

      expect(result).toBeInstanceOf(Blob);
      expect(global.fetch).toHaveBeenCalledWith('/templates/test.xlsx');
    });

    it('should fill INFO_GENERAL fields in worksheet (lines 423-437)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'My Project',
        api: 'my-api',
        rfc: 'RFC123',
        notaInstalacion: 'NOTA456',
        lider: 'Leader Name',
        desarrollador: 'Dev Name',
        torre: 'Torre A',
        ventanaTiempo: '2h',
        uriMeet: 'https://meet.google.com/abc',
        scmDiurno: 'SCM User',
        sreNocturno: 'SRE Night',
        sreDiurno: 'SRE Day',
        tester: 'Tester Name',
        componentesLiberar: 'my-api',
        fechaLiberacion: new Date('2026-01-01')
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill listaItems when provided (lines 440-448)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        listaItems: ['Item 1', 'Item 2', 'Item 3']
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill detalleItems across 3 sections (lines 451-477)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        detalleItems: ['Detalle 1', 'Detalle 2', 'Detalle 3']
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill formData fields (lines 480-488)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        formData: { campo1: 'Value 1', campo2: 'Value 2' }
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill validaciones (lines 491-503)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        validaciones: [
          { aplica: true, validado: true, respuestaUrl: 'https://example.com' },
          { aplica: false, validado: false }
        ]
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill prDeudaTecnica (lines 506-518)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        prDeudaTecnica: [
          {
            componente: 'api-payments',
            integracionArq: true,
            deudaTecnica: false,
            vulnerabilidades: 'None',
            urlRepo: 'https://github.com/org/repo'
          }
        ]
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill pipelinesCD (lines 521-536)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        pipelinesCD: [
          {
            componente: 'api-payments',
            ordenTareas: 'Task 1 > Task 2',
            variables: true,
            validacionPuertos: true,
            healthCheck: true,
            numPost: 3,
            urlConfig: 'https://config.example.com',
            comentarios: 'No issues'
          }
        ]
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill rollback data (lines 539-551)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        rollback: [
          {
            componente: 'api-payments',
            numRelease: 'v1.0.0',
            rama: 'main',
            urlRollback: 'https://github.com/org/repo/releases/v0.9.0',
            propertiesCommit: 'abc123'
          }
        ]
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill procesoRealizado with componentes (lines 554-578)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        procesoRealizado: {
          idLiberacion: 'lib-001',
          fechaHoraValidacion: new Date('2026-01-01T10:00:00Z'),
          tipoLiberacion: 'Produccion',
          fechaInicioGuardia: new Date('2026-01-01T08:00:00Z'),
          tiempoGuardia: '2 Horas',
          fechaFinGuardia: new Date('2026-01-01T10:00:00Z'),
          componentes: [
            {
              componente: 'api-payments',
              numRelease: 'v1.2.3',
              rama: 'main',
              urlRelease: 'https://github.com/org/repo/releases/v1.2.3',
              ejecucionCD: true,
              despliegueCorrecto: true,
              revisionDespliegue: true,
              aplicoRollback: false,
              tiempoM: 30
            }
          ]
        }
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill comentarios (lines 581-583)', async () => {
      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        comentarios: 'Some comments here'
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should fill evidencias sheet when worksheet exists (lines 586-596)', async () => {
      mockGetWorksheet.mockReturnValue(mockWorksheet);

      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        evidencias: [
          { fechaHora: new Date('2026-01-01T10:00:00Z'), actividad: 'Task 1' },
          { fechaHora: new Date('2026-01-01T11:00:00Z'), actividad: 'Task 2' }
        ]
      };

      await generateReleaseExcel('/templates/test.xlsx', data);

      expect(mockGetWorksheet).toHaveBeenCalledWith('Evidencias');
      expect(mockGetCell).toHaveBeenCalled();
    });

    it('should skip evidencias when worksheet not found', async () => {
      mockGetWorksheet.mockReturnValue(null);

      const data: ReleaseReportData = {
        nombreProyecto: 'Test',
        evidencias: [
          { fechaHora: new Date(), actividad: 'Task 1' }
        ]
      };

      await expect(generateReleaseExcel('/templates/test.xlsx', data)).resolves.toBeInstanceOf(Blob);
    });
  });
});
