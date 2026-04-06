import { describe, it, expect, vi } from 'vitest';
import {
  EXCEL_CELL_MAP,
  processToReleaseReport,
  generateReleaseFilename,
  ReleaseReportData
} from '@/lib/excel-generator';
import { ProcessState } from '@/lib/types';

// Mock ExcelJS
vi.mock('exceljs', () => ({
  default: {
    Workbook: vi.fn().mockImplementation(() => ({
      xlsx: {
        load: vi.fn(),
        writeBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8))
      },
      worksheets: [
        {
          getCell: vi.fn().mockReturnValue({ value: null }),
          getRow: vi.fn().mockReturnValue({
            getCell: vi.fn().mockReturnValue({ value: null })
          })
        }
      ],
      getWorksheet: vi.fn().mockReturnValue({
        getCell: vi.fn().mockReturnValue({ value: null })
      })
    }))
  }
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
        rfc: 'RFC123456',
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
      expect(filename).toContain('_RFC123');
      expect(filename).toContain('_NOTA456');
      expect(filename).toContain('My_Process');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should generate filename without RFC', () => {
      const filename = generateReleaseFilename('My Process', undefined, 'NOTA456');

      expect(filename).toContain('Checklist_Liberacion_');
      expect(filename).not.toContain('_RFC');
      expect(filename).toContain('_NOTA456');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should generate filename without NOTA', () => {
      const filename = generateReleaseFilename('My Process', 'RFC123');

      expect(filename).toContain('Checklist_Liberacion_');
      expect(filename).toContain('_RFC123');
      expect(filename).not.toContain('_NOTA');
      expect(filename).toMatch(/\.xlsx$/);
    });

    it('should sanitize process name for filename', () => {
      const filename = generateReleaseFilename('My Process @#$% 123');

      expect(filename).toContain('My_Process_____123');
      expect(filename).not.toContain('@');
      expect(filename).not.toContain('#');
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
});
