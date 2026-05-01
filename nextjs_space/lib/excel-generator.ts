'use client';

import * as ExcelJS from 'exceljs';
import type {
  ProcessExportConfig,
  ProcessExportMappings,
  ExportTaskSource,
  ExportSheetSection,
  ExportSource,
  ProcessState,
  TaskState,
  FormFieldConfig,
} from './types';

// Use flexible types to avoid strict type checking issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProcessData = any;

// Excel Cell Mapping for Release Checklist Template
export const EXCEL_CELL_MAP = {
  // Hoja 1: Checklist Principal
  CHECKLIST: {
    // INFORMACIÓN GENERAL DE LA LIBERACIÓN
    INFO_GENERAL: {
      TORRE: 'F3',
      FECHA_LIBERACION: 'W3',
      NOMBRE_PROYECTO: 'F4',
      VENTANA_TIEMPO: 'W4',
      API: 'F5',
      COMPONENTES_LIBERAR: 'F7',
      URI_MEET: 'W7',
      RFC: 'F9',
      NOTA_INSTALACION: 'W9',
      SCM_DIURNO: 'F10',
      LIDER: 'W10',
      SRE_NOCTURNO: 'F11',
      TESTER: 'W11',
      SRE_DIURNO: 'F12',
      DESARROLLADOR: 'W12',
      INICIO_GUARDIA_NOCTURNA: 'F13',
      INICIO_GUARDIA_DIURNA: 'W13',
      FIN_GUARDIA_NOCTURNA: 'F14',
      FIN_GUARDIA_DIURNA: 'W14'
    },
    
    // LISTA DE ITEMS (F5-F13)
    LISTA_ITEMS: {
      START_ROW: 5,
      END_ROW: 13,
      COLUMN: 'F',
      MAX_ITEMS: 9
    },
    
    // DETALLE DE ITEMS (3 secciones)
    DETALLE_ITEMS: {
      SECCION_1: {
        START_ROW: 47,
        END_ROW: 56,
        COLUMN: 'B',
        MAX_ITEMS: 10
      },
      SECCION_2: {
        START_ROW: 60,
        END_ROW: 69,
        COLUMN: 'B',
        MAX_ITEMS: 10
      },
      SECCION_3: {
        START_ROW: 72,
        END_ROW: 81,
        COLUMN: 'B',
        MAX_ITEMS: 10
      }
    },
    
    // FORM FIELDS (F85-F87, S85-S87)
    FORM_FIELDS: {
      'campo1': 'F85',
      'campo2': 'F86',
      'campo3': 'F87',
      'campo4': 'S85',
      'campo5': 'S86',
      'campo6': 'S87'
    },
    
    // VALIDACIÓN DE CONFIGURACIONES ANTES DE LA LIBERACIÓN
    VALIDACIONES: {
      START_ROW: 18,
      COLUMNS: {
        APLICA: 'T',
        VALIDADO: 'U',
        RESPUESTA_URL: 'V'
      }
    },
    
    // VALIDACIÓN DE PR Y DEUDA TÉCNICA
    PR_DEUDA_TECNICA: {
      START_ROW: 47,
      MAX_ROWS: 10,
      COLUMNS: {
        COMPONENTE: 'B',
        INTEGRACION_ARQ: 'H',
        DEUDA_TECNICA: 'I',
        VULNERABILIDADES: 'J',
        URL_REPO: 'K'
      }
    },
    
    // VALIDACIÓN DE PIPELINES CD
    PIPELINES_CD: {
      START_ROW: 60,
      MAX_ROWS: 10,
      COLUMNS: {
        COMPONENTE: 'B',
        ORDEN_TAREAS: 'G',
        VARIABLES: 'H',
        VALIDACION_PUERTOS: 'I',
        HEALTH_CHECK: 'J',
        NUM_POST: 'K',
        URL_CONFIG: 'L',
        COMENTARIOS: 'M'
      }
    },
    
    // COMPONENTES EN CASO DE ROLLBACK
    ROLLBACK: {
      START_ROW: 73,
      MAX_ROWS: 8,
      COLUMNS: {
        COMPONENTE: 'B',
        NUM_RELEASE: 'H',
        RAMA: 'L',
        URL_ROLLBACK: 'N',
        PROPERTIES_COMMIT: 'W'
      }
    },
    
    // INFORMACIÓN DEL PROCESO DE LIBERACIÓN REALIZADO
    PROCESO_REALIZADO: {
      HEADER: {
        ID_LIBERACION: 'F84',
        FECHA_HORA_VALIDACION: 'W84',
        TIPO_LIBERACION: 'F85',
        FECHA_INICIO_GUARDIA: 'W85',
        TIEMPO_GUARDIA: 'F86',
        FECHA_FIN_GUARDIA: 'W86'
      },
      COMPONENTES: {
        START_ROW: 89,
        MAX_ROWS: 9,
        COLUMNS: {
          COMPONENTE: 'B',
          NUM_RELEASE: 'H',
          RAMA: 'K',
          URL_RELEASE: 'N',
          EJECUCION_CD: 'X',
          DESPLIEGUE_CORRECTO: 'Y',
          REVISION_DESPLIEGUE: 'Z',
          APLICO_ROLLBACK: 'AA',
          TIEMPO_M: 'AB'
        }
      }
    },
    
    // COMENTARIOS GENERALES
    COMENTARIOS: {
      CELL: 'B100'
    }
  },
  
  // Hoja 2: Evidencias
  EVIDENCIAS: {
    SHEET_NAME: 'Evidencias',
    START_ROW: 3,
    COLUMNS: {
      FECHA_HORA: 'B',
      ACTIVIDAD: 'C'
    }
  }
};

// Interface for release report data
export interface ReleaseReportData {
  // Información General
  torre?: string;
  fechaLiberacion?: Date;
  nombreProyecto?: string;
  ventanaTiempo?: string;
  api?: string;
  componentesLiberar?: string;
  uriMeet?: string;
  rfc?: string;
  notaInstalacion?: string;
  scmDiurno?: string;
  lider?: string;
  sreNocturno?: string;
  tester?: string;
  sreDiurno?: string;
  desarrollador?: string;
  inicioGuardiaNocturna?: Date;
  inicioGuardiaDiurna?: Date;
  finGuardiaNocturna?: Date;
  finGuardiaDiurna?: Date;
  
  // Lista de Items (F5-F13)
  listaItems?: string[];
  
  // Detalle de Items (B47-B56, B60-B69, B72-B81)
  detalleItems?: string[];
  
  // Form Data (form fields)
  formData?: Record<string, any>;
  
  // Validaciones
  validaciones?: Array<{
    aplica: boolean;
    validado: boolean;
    respuestaUrl?: string;
  }>;
  
  // PR y Deuda Técnica
  prDeudaTecnica?: Array<{
    componente: string;
    integracionArq: boolean;
    deudaTecnica: boolean;
    vulnerabilidades: string;
    urlRepo: string;
  }>;
  
  // Pipelines CD
  pipelinesCD?: Array<{
    componente: string;
    ordenTareas: string;
    variables: boolean;
    validacionPuertos: boolean;
    healthCheck: boolean;
    numPost: number;
    urlConfig: string;
    comentarios: string;
  }>;
  
  // Rollback
  rollback?: Array<{
    componente: string;
    numRelease: string;
    rama: string;
    urlRollback: string;
    propertiesCommit: string;
  }>;
  
  // Proceso Realizado
  procesoRealizado?: {
    idLiberacion: string;
    fechaHoraValidacion: Date;
    tipoLiberacion: string;
    fechaInicioGuardia: Date;
    tiempoGuardia: string;
    fechaFinGuardia: Date;
    componentes: Array<{
      componente: string;
      numRelease: string;
      rama: string;
      urlRelease: string;
      ejecucionCD: boolean;
      despliegueCorrecto: boolean;
      revisionDespliegue: boolean;
      aplicoRollback: boolean;
      tiempoM: number;
    }>;
  };
  
  // Comentarios
  comentarios?: string;
  
  // Evidencias
  evidencias?: Array<{
    fechaHora: Date;
    actividad: string;
  }>;
}

// Convert process data to release report format
export function processToReleaseReport(process: ProcessData): ReleaseReportData {
  // Build variables from capturedVariables
  const variables: Record<string, string> = process.capturedVariables || {};
  
  // Extract tasks with evidence
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allTasks: any[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  process.phases?.forEach((phase: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phase.tasks?.forEach((task: any) => {
      allTasks.push(task);
    });
    // Also check activities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    phase.activities?.forEach((activity: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      activity.tasks?.forEach((task: any) => {
        allTasks.push(task);
      });
    });
  });
  
  // Extract listData from dynamic-list tasks
  // Look for the first dynamic-list task with listData
  const dynamicListTask = allTasks.find(task => task.type === 'dynamic-list' && task.listData);
  const listaItems = dynamicListTask?.listData?.map((item: any) => item.value) || [];
  
  // Extract detailData from detail-list tasks
  // Look for the first detail-list task with detailData
  const detailListTask = allTasks.find(task => task.type === 'detail-list' && task.detailData);
  const detalleItems = detailListTask?.detailData?.map((item: any) => item.capturedText) || [];
  
  // Extract formData from form tasks
  // Look for the first form task with formData
  const formTask = allTasks.find(task => task.type === 'form' && task.formData);
  const formData = formTask?.formData?.reduce((acc: Record<string, any>, item: any) => {
    acc[item.fieldId] = item.value;
    return acc;
  }, {}) || {};
  
  // Build validations from completed tasks
  const validaciones = allTasks.map(task => ({
    aplica: true,
    validado: !!task.completedAt,
    respuestaUrl: task.evidence?.url || ''
  }));
  
  // Build components from variables
  const componentes = variables.repository ? [{
    componente: variables.repository,
    numRelease: variables.releaseVersion || '',
    rama: variables.branch || 'main',
    urlRelease: `https://github.com/${variables.organization}/${variables.repository}/releases`,
    ejecucionCD: true,
    despliegueCorrecto: !!process.completedAt,
    revisionDespliegue: !!process.completedAt,
    aplicoRollback: false,
    tiempoM: process.timeTracking?.totalElapsed 
      ? Math.round(process.timeTracking.totalElapsed / 60000) 
      : 0
  }] : [];
  
  return {
    nombreProyecto: process.name,
    api: variables.repository || '',
    componentesLiberar: variables.repository || '',
    rfc: variables.rfcNumber || '',
    notaInstalacion: variables.notaInstalacion || '',
    lider: variables.lider || '',
    desarrollador: variables.developer || '',
    fechaLiberacion: process.completedAt ? new Date(process.completedAt) : new Date(),
    
    listaItems,
    detalleItems,
    formData,
    
    validaciones,
    
    prDeudaTecnica: [{
      componente: variables.repository || '',
      integracionArq: true,
      deudaTecnica: false,
      vulnerabilidades: 'None',
      urlRepo: `https://github.com/${variables.organization}/${variables.repository}`
    }],
    
    pipelinesCD: [{
      componente: variables.repository || '',
      ordenTareas: '1',
      variables: true,
      validacionPuertos: true,
      healthCheck: true,
      numPost: 0,
      urlConfig: '',
      comentarios: ''
    }],
    
    rollback: [{
      componente: variables.repository || '',
      numRelease: '',
      rama: 'main',
      urlRollback: '',
      propertiesCommit: ''
    }],
    
    procesoRealizado: {
      idLiberacion: process.id,
      fechaHoraValidacion: new Date(),
      tipoLiberacion: 'Produccion',
      fechaInicioGuardia: process.timeTracking?.startTime 
        ? new Date(process.timeTracking.startTime) 
        : new Date(),
      tiempoGuardia: process.timeTracking?.totalElapsed 
        ? `${Math.round(process.timeTracking.totalElapsed / 3600000)} Horas`
        : '1 Hora',
      fechaFinGuardia: process.completedAt 
        ? new Date(process.completedAt) 
        : new Date(),
      componentes
    },
    
    comentarios: `Proceso: ${process.name}\nVersión: ${process.version}\nCompletado: ${process.completedAt ? 'Sí' : 'No'}`,
    
    evidencias: allTasks
      .filter(t => t.completedAt)
      .map(t => ({
        fechaHora: new Date(t.completedAt!),
        actividad: t.name
      }))
  };
}

// Generate Excel from template
export async function generateReleaseExcel(
  templateUrl: string,
  data: ReleaseReportData
): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  
  // Load template
  const response = await fetch(templateUrl);
  const arrayBuffer = await response.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  
  const worksheet = workbook.worksheets[0];
  const map = EXCEL_CELL_MAP.CHECKLIST;
  
  // Fill INFO GENERAL
  const info = map.INFO_GENERAL;
  if (data.nombreProyecto) worksheet.getCell(info.NOMBRE_PROYECTO).value = data.nombreProyecto;
  if (data.api) worksheet.getCell(info.API).value = data.api;
  if (data.componentesLiberar) worksheet.getCell(info.COMPONENTES_LIBERAR).value = data.componentesLiberar;
  if (data.rfc) worksheet.getCell(info.RFC).value = data.rfc;
  if (data.notaInstalacion) worksheet.getCell(info.NOTA_INSTALACION).value = data.notaInstalacion;
  if (data.lider) worksheet.getCell(info.LIDER).value = data.lider;
  if (data.desarrollador) worksheet.getCell(info.DESARROLLADOR).value = data.desarrollador;
  if (data.fechaLiberacion) worksheet.getCell(info.FECHA_LIBERACION).value = data.fechaLiberacion;
  if (data.torre) worksheet.getCell(info.TORRE).value = data.torre;
  if (data.ventanaTiempo) worksheet.getCell(info.VENTANA_TIEMPO).value = data.ventanaTiempo;
  if (data.uriMeet) worksheet.getCell(info.URI_MEET).value = data.uriMeet;
  if (data.scmDiurno) worksheet.getCell(info.SCM_DIURNO).value = data.scmDiurno;
  if (data.sreNocturno) worksheet.getCell(info.SRE_NOCTURNO).value = data.sreNocturno;
  if (data.sreDiurno) worksheet.getCell(info.SRE_DIURNO).value = data.sreDiurno;
  if (data.tester) worksheet.getCell(info.TESTER).value = data.tester;
  
  // Fill Lista Items (F5-F13)
  if (data.listaItems && data.listaItems.length > 0) {
    const listaMap = map.LISTA_ITEMS;
    data.listaItems.forEach((item, idx) => {
      if (idx < listaMap.MAX_ITEMS) {
        const row = listaMap.START_ROW + idx;
        worksheet.getCell(`${listaMap.COLUMN}${row}`).value = item;
      }
    });
  }
  
  // Fill Detalle Items (3 secciones: B47-B56, B60-B69, B72-B81)
  if (data.detalleItems && data.detalleItems.length > 0) {
    const detalleMap = map.DETALLE_ITEMS;
    
    // Sección 1: B47-B56
    data.detalleItems.forEach((detalle, idx) => {
      if (idx < detalleMap.SECCION_1.MAX_ITEMS) {
        const row = detalleMap.SECCION_1.START_ROW + idx;
        worksheet.getCell(`${detalleMap.SECCION_1.COLUMN}${row}`).value = detalle;
      }
    });
    
    // Sección 2: B60-B69 (repetir mismos datos)
    data.detalleItems.forEach((detalle, idx) => {
      if (idx < detalleMap.SECCION_2.MAX_ITEMS) {
        const row = detalleMap.SECCION_2.START_ROW + idx;
        worksheet.getCell(`${detalleMap.SECCION_2.COLUMN}${row}`).value = detalle;
      }
    });
    
    // Sección 3: B72-B81 (repetir mismos datos)
    data.detalleItems.forEach((detalle, idx) => {
      if (idx < detalleMap.SECCION_3.MAX_ITEMS) {
        const row = detalleMap.SECCION_3.START_ROW + idx;
        worksheet.getCell(`${detalleMap.SECCION_3.COLUMN}${row}`).value = detalle;
      }
    });
  }
  
  // Fill Form Fields (F85-F87, S85-S87)
  if (data.formData) {
    const formMap = map.FORM_FIELDS;
    Object.entries(data.formData).forEach(([fieldId, value]) => {
      const cellRef = formMap[fieldId as keyof typeof formMap];
      if (cellRef && value) {
        worksheet.getCell(cellRef).value = value;
      }
    });
  }
  
  // Fill Validaciones
  if (data.validaciones) {
    const valCols = map.VALIDACIONES.COLUMNS;
    data.validaciones.forEach((val, idx) => {
      const row = map.VALIDACIONES.START_ROW + idx;
      if (row < map.VALIDACIONES.START_ROW + 20) {
        worksheet.getCell(`${valCols.APLICA}${row}`).value = val.aplica;
        worksheet.getCell(`${valCols.VALIDADO}${row}`).value = val.validado;
        if (val.respuestaUrl) {
          worksheet.getCell(`${valCols.RESPUESTA_URL}${row}`).value = val.respuestaUrl;
        }
      }
    });
  }
  
  // Fill PR y Deuda Técnica
  if (data.prDeudaTecnica) {
    const prCols = map.PR_DEUDA_TECNICA.COLUMNS;
    data.prDeudaTecnica.forEach((pr, idx) => {
      const row = map.PR_DEUDA_TECNICA.START_ROW + idx;
      if (idx < map.PR_DEUDA_TECNICA.MAX_ROWS) {
        worksheet.getCell(`${prCols.COMPONENTE}${row}`).value = pr.componente;
        worksheet.getCell(`${prCols.INTEGRACION_ARQ}${row}`).value = pr.integracionArq;
        worksheet.getCell(`${prCols.DEUDA_TECNICA}${row}`).value = pr.deudaTecnica;
        worksheet.getCell(`${prCols.VULNERABILIDADES}${row}`).value = pr.vulnerabilidades;
        worksheet.getCell(`${prCols.URL_REPO}${row}`).value = pr.urlRepo;
      }
    });
  }
  
  // Fill Pipelines CD
  if (data.pipelinesCD) {
    const pipeCols = map.PIPELINES_CD.COLUMNS;
    data.pipelinesCD.forEach((pipe, idx) => {
      const row = map.PIPELINES_CD.START_ROW + idx;
      if (idx < map.PIPELINES_CD.MAX_ROWS) {
        worksheet.getCell(`${pipeCols.COMPONENTE}${row}`).value = pipe.componente;
        worksheet.getCell(`${pipeCols.ORDEN_TAREAS}${row}`).value = pipe.ordenTareas;
        worksheet.getCell(`${pipeCols.VARIABLES}${row}`).value = pipe.variables;
        worksheet.getCell(`${pipeCols.VALIDACION_PUERTOS}${row}`).value = pipe.validacionPuertos;
        worksheet.getCell(`${pipeCols.HEALTH_CHECK}${row}`).value = pipe.healthCheck;
        worksheet.getCell(`${pipeCols.NUM_POST}${row}`).value = pipe.numPost;
        worksheet.getCell(`${pipeCols.URL_CONFIG}${row}`).value = pipe.urlConfig;
        worksheet.getCell(`${pipeCols.COMENTARIOS}${row}`).value = pipe.comentarios;
      }
    });
  }
  
  // Fill Rollback
  if (data.rollback) {
    const rbCols = map.ROLLBACK.COLUMNS;
    data.rollback.forEach((rb, idx) => {
      const row = map.ROLLBACK.START_ROW + idx;
      if (idx < map.ROLLBACK.MAX_ROWS) {
        worksheet.getCell(`${rbCols.COMPONENTE}${row}`).value = rb.componente;
        worksheet.getCell(`${rbCols.NUM_RELEASE}${row}`).value = rb.numRelease;
        worksheet.getCell(`${rbCols.RAMA}${row}`).value = rb.rama;
        worksheet.getCell(`${rbCols.URL_ROLLBACK}${row}`).value = rb.urlRollback;
        worksheet.getCell(`${rbCols.PROPERTIES_COMMIT}${row}`).value = rb.propertiesCommit;
      }
    });
  }
  
  // Fill Proceso Realizado
  if (data.procesoRealizado) {
    const procHeader = map.PROCESO_REALIZADO.HEADER;
    worksheet.getCell(procHeader.ID_LIBERACION).value = data.procesoRealizado.idLiberacion;
    worksheet.getCell(procHeader.FECHA_HORA_VALIDACION).value = data.procesoRealizado.fechaHoraValidacion;
    worksheet.getCell(procHeader.TIPO_LIBERACION).value = data.procesoRealizado.tipoLiberacion;
    worksheet.getCell(procHeader.FECHA_INICIO_GUARDIA).value = data.procesoRealizado.fechaInicioGuardia;
    worksheet.getCell(procHeader.TIEMPO_GUARDIA).value = data.procesoRealizado.tiempoGuardia;
    worksheet.getCell(procHeader.FECHA_FIN_GUARDIA).value = data.procesoRealizado.fechaFinGuardia;
    
    const compCols = map.PROCESO_REALIZADO.COMPONENTES.COLUMNS;
    data.procesoRealizado.componentes.forEach((comp, idx) => {
      const row = map.PROCESO_REALIZADO.COMPONENTES.START_ROW + idx;
      if (idx < map.PROCESO_REALIZADO.COMPONENTES.MAX_ROWS) {
        worksheet.getCell(`${compCols.COMPONENTE}${row}`).value = comp.componente;
        worksheet.getCell(`${compCols.NUM_RELEASE}${row}`).value = comp.numRelease;
        worksheet.getCell(`${compCols.RAMA}${row}`).value = comp.rama;
        worksheet.getCell(`${compCols.URL_RELEASE}${row}`).value = comp.urlRelease;
        worksheet.getCell(`${compCols.EJECUCION_CD}${row}`).value = comp.ejecucionCD;
        worksheet.getCell(`${compCols.DESPLIEGUE_CORRECTO}${row}`).value = comp.despliegueCorrecto;
        worksheet.getCell(`${compCols.REVISION_DESPLIEGUE}${row}`).value = comp.revisionDespliegue;
        worksheet.getCell(`${compCols.APLICO_ROLLBACK}${row}`).value = comp.aplicoRollback;
        worksheet.getCell(`${compCols.TIEMPO_M}${row}`).value = comp.tiempoM;
      }
    });
  }
  
  // Fill Comentarios
  if (data.comentarios) {
    worksheet.getCell(map.COMENTARIOS.CELL).value = data.comentarios;
  }
  
  // Fill Evidencias sheet
  if (data.evidencias && data.evidencias.length > 0) {
    const evSheet = workbook.getWorksheet(EXCEL_CELL_MAP.EVIDENCIAS.SHEET_NAME);
    if (evSheet) {
      const evCols = EXCEL_CELL_MAP.EVIDENCIAS.COLUMNS;
      data.evidencias.forEach((ev, idx) => {
        const row = EXCEL_CELL_MAP.EVIDENCIAS.START_ROW + idx;
        evSheet.getCell(`${evCols.FECHA_HORA}${row}`).value = ev.fechaHora;
        evSheet.getCell(`${evCols.ACTIVIDAD}${row}`).value = ev.actividad;
      });
    }
  }
  
  // Generate buffer and blob
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}

// Download Excel file
export function downloadExcel(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Generate filename for release report
export function generateReleaseFilename(
  processName: string,
  rfc?: string,
  nota?: string
): string {
  const date = new Date();
  const dateStr = `${date.getDate().toString().padStart(2, '0')}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getFullYear()}`;
  const safeName = processName.replace(/[^a-zA-Z0-9]/g, '_');
  const rfcStr = rfc ? `_RFC${rfc}` : '';
  const notaStr = nota ? `_NOTA${nota}` : '';
  
  return `Checklist_Liberacion_${dateStr}${rfcStr}${notaStr}_${safeName}.xlsx`;
}

// ============================================================================
// Declarative Export Engine
// ============================================================================
// Generic, YAML-driven Excel filler. Reads an ExportPlan (process.export merged
// with task-level exportConfig overrides) and writes cells into the template
// according to the mappings. No process-specific logic lives here.
// ============================================================================

/** Format a Date as date-like token. Supports a few common patterns. */
function formatDateToken(d: Date, fmt = 'YYYYMMDD'): string {
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  const map: Record<string, string> = {
    YYYY: String(d.getFullYear()),
    MM: pad(d.getMonth() + 1),
    DD: pad(d.getDate()),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
  return fmt.replace(/YYYY|MM|DD|HH|mm|ss/g, (t) => map[t] ?? t);
}

/** Sanitize a value so it is safe to use as a filename fragment. */
function sanitizeFilenameFragment(s: string): string {
  return s.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
}

/**
 * Interpolates a filename/comment pattern with runtime tokens.
 * Supported tokens:
 *   {today}                      -> YYYYMMDD
 *   {today:YYYY-MM-DD}           -> custom format
 *   {now:HHmm}                   -> current time with custom format
 *   {process.id|name|version}    -> process metadata
 *   {vars.<key>}                 -> capturedVariables[key]
 *   {fecha}                      -> alias for {today:DDMMYYYY} (ES legacy)
 *   {rfc}, {notaInstalacion}, …  -> alias for {vars.rfc}, {vars.notaInstalacion}
 */
export function interpolateExportTokens(
  pattern: string,
  process: ProcessState | ProcessData,
  opts: { sanitize?: boolean } = {},
): string {
  if (!pattern) return '';
  const vars: Record<string, string> = (process?.capturedVariables as Record<string, string>) || {};
  const now = new Date();

  return pattern.replace(/\{([^}]+)\}/g, (_match, rawToken: string) => {
    const token = rawToken.trim();
    let value = '';

    if (token === 'fecha') {
      value = formatDateToken(now, 'DDMMYYYY');
    } else if (token === 'today' || token.startsWith('today:')) {
      const fmt = token.includes(':') ? token.split(':').slice(1).join(':') : 'YYYYMMDD';
      value = formatDateToken(now, fmt);
    } else if (token === 'now' || token.startsWith('now:')) {
      const fmt = token.includes(':') ? token.split(':').slice(1).join(':') : 'HHmmss';
      value = formatDateToken(now, fmt);
    } else if (token.startsWith('process.')) {
      const key = token.slice('process.'.length);
      value = String((process as Record<string, unknown>)?.[key] ?? '');
    } else if (token.startsWith('vars.')) {
      const key = token.slice('vars.'.length);
      value = String(vars[key] ?? '');
    } else if (token in vars) {
      // Bare variable name shortcut: {rfc} == {vars.rfc}
      value = String(vars[token] ?? '');
    } else {
      // Unknown token -> empty string (keeps filenames clean)
      value = '';
    }

    return opts.sanitize ? sanitizeFilenameFragment(value) : value;
  });
}

/** Flattens every task in the process (phases.tasks + phases.activities.tasks). */
export function collectAllTasks(process: ProcessData): TaskState[] {
  const all: TaskState[] = [];
  for (const phase of process?.phases ?? []) {
    for (const t of phase.tasks ?? []) all.push(t);
    for (const act of phase.activities ?? []) {
      for (const t of act.tasks ?? []) all.push(t);
    }
  }
  return all;
}

/** Find a task by id, searching phases and activities. */
function findTaskById(process: ProcessData, taskId: string): TaskState | undefined {
  return collectAllTasks(process).find((t) => t.id === taskId);
}

/** Validate a cell reference like "F85" or "AA10". */
function isValidCellRef(ref: unknown): ref is string {
  return typeof ref === 'string' && /^[A-Z]+[0-9]+$/.test(ref);
}

/** Safely set a cell if the reference is valid and value is not nullish. */
function setCell(
  ws: ExcelJS.Worksheet,
  ref: string | undefined,
  value: unknown,
): void {
  if (!isValidCellRef(ref)) return;
  if (value === undefined || value === null || value === '') return;
  ws.getCell(ref).value = value as ExcelJS.CellValue;
}

/** Resolve the effective export plan from process + triggering task. */
export function resolveExportPlan(
  process: ProcessData,
  triggeringTask?: TaskState,
): ProcessExportConfig | null {
  const processExport = (process?.export as ProcessExportConfig | undefined) ?? null;
  const taskExport = triggeringTask?.exportConfig;

  // Nothing at all -> cannot build a plan
  if (!processExport && !taskExport) return null;

  // Task can override templatePath / outputFilename / autoDownload and extend mappings
  const inherit = taskExport?.inherit !== false && !!processExport;

  const base: ProcessExportConfig | null = inherit ? processExport : null;
  const templatePath = taskExport?.templatePath ?? base?.templatePath ?? '';
  if (!templatePath) return null;

  const merged: ProcessExportConfig = {
    templatePath,
    templateVersion: base?.templateVersion,
    templateSha256: base?.templateSha256,
    outputFilename: taskExport?.outputFilename ?? base?.outputFilename,
    autoDownload: taskExport?.autoDownload ?? base?.autoDownload ?? true,
    mappings: mergeMappings(base?.mappings, taskExport?.mappings),
  };
  return merged;
}

function mergeMappings(
  base?: ProcessExportMappings,
  override?: ProcessExportMappings,
): ProcessExportMappings | undefined {
  if (!base && !override) return undefined;
  if (!base) return override;
  if (!override) return base;

  // Merge sheets by sheet name: same name = merge sources; different name = concatenate
  const baseSheets = base.sheets || [];
  const overrideSheets = override.sheets || [];
  const mergedSheets: ExportSheetSection[] = [];

  // Start with base sheets
  for (const bs of baseSheets) {
    const os = overrideSheets.find(s => s.sheet === bs.sheet);
    if (os) {
      // Same sheet name: merge sources
      mergedSheets.push({
        ...bs,
        ...os,
        sources: [...(bs.sources || []), ...(os.sources || [])],
      });
    } else {
      mergedSheets.push(bs);
    }
  }

  // Add override sheets not in base
  for (const os of overrideSheets) {
    if (!baseSheets.some(bs => bs.sheet === os.sheet)) {
      mergedSheets.push(os);
    }
  }

  return { sheets: mergedSheets };
}

/**
 * Generic, declarative Excel export.
 * Fetches the template, applies all sheets[] declared in `plan`, and returns a Blob.
 */
export async function executeExportPlan(
  plan: ProcessExportConfig,
  process: ProcessData,
): Promise<Blob> {
  if (!plan?.templatePath) {
    throw new Error('executeExportPlan: missing templatePath');
  }

  const workbook = new ExcelJS.Workbook();
  const response = await fetch(plan.templatePath);
  if (!response.ok) {
    throw new Error(`Template not found at ${plan.templatePath} (HTTP ${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);

  const vars: Record<string, string> = process?.capturedVariables || {};
  const sheets = plan.mappings?.sheets || [];

  for (const sheetSection of sheets) {
    const worksheet = workbook.getWorksheet(sheetSection.sheet) ?? workbook.worksheets[0];
    if (!worksheet) continue;

    // Apply sources for this sheet
    for (const src of sheetSection.sources || []) {
      applySource(worksheet, src, process, vars);
    }

    // Apply log-mode (completed tasks with timestamps)
    if (sheetSection.timestampColumn || sheetSection.nameColumn) {
      const logTasks = collectAllTasks(process).filter((t: TaskState) => t.completedAt);
      const max = sheetSection.maxRows ?? logTasks.length;
      const startRow = sheetSection.startRow ?? 1;
      logTasks.slice(0, max).forEach((t: TaskState, idx: number) => {
        const row = startRow + idx;
        if (sheetSection.timestampColumn) {
          setCell(worksheet, `${sheetSection.timestampColumn}${row}`, new Date(t.completedAt!));
        }
        if (sheetSection.nameColumn) {
          setCell(worksheet, `${sheetSection.nameColumn}${row}`, t.name);
        }
      });
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/** Convert Excel column letter(s) to 1-based column number (A=1, B=2, ..., AA=27). */
function colLetterToNumber(col: string): number {
  let n = 0;
  for (let i = 0; i < col.length; i++) {
    n = n * 26 + (col.charCodeAt(i) - 64); // 'A' = 65 → 1
  }
  return n;
}

/**
 * Apply a single source to a worksheet.
 * Handles both sheet-level sources (variables, static, time, process, comments)
 * and task-driven sources (list, detail, form, checklist, detail-table, cell).
 */
function applySource(
  worksheet: ExcelJS.Worksheet,
  src: ExportSource,
  process: ProcessData,
  vars: Record<string, string>,
): void {
  if (src.kind === 'variables') {
    for (const [varKey, ref] of Object.entries(src.mapping)) {
      setCell(worksheet, ref, vars[varKey]);
    }
    return;
  }

  if (src.kind === 'static') {
    for (const [ref, value] of Object.entries(src.cells)) {
      setCell(worksheet, ref, value);
    }
    return;
  }

  if (src.kind === 'time') {
    const tt = process?.timeTracking || {};
    if (src.startedAt) {
      const started = tt.firstStartedAt || tt.currentSessionStart;
      setCell(worksheet, src.startedAt, started ? new Date(started) : undefined);
    }
    if (src.completedAt) {
      setCell(
        worksheet,
        src.completedAt,
        process?.completedAt ? new Date(process.completedAt) : new Date(),
      );
    }
    if (src.totalElapsedMinutes && typeof tt.totalActiveTime === 'number') {
      setCell(worksheet, src.totalElapsedMinutes, Math.round(tt.totalActiveTime / 60000));
    }
    if (src.totalElapsedHours && typeof tt.totalActiveTime === 'number') {
      setCell(worksheet, src.totalElapsedHours, Math.round(tt.totalActiveTime / 3600000));
    }
    if (src.today) {
      setCell(worksheet, src.today, new Date());
    }
    return;
  }

  if (src.kind === 'process') {
    if (src.id) setCell(worksheet, src.id, process?.id);
    if (src.name) setCell(worksheet, src.name, process?.name);
    if (src.version) setCell(worksheet, src.version, process?.version);
    return;
  }

  if (src.kind === 'comments') {
    const text = src.template
      ? interpolateExportTokens(src.template, process)
      : '';
    if (text) setCell(worksheet, src.cell, text);
    return;
  }

  if (src.kind === 'range') {
    // Read a range of cells from the worksheet and store in capturedVariables
    const rangeMatch = src.range.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/);
    if (!rangeMatch) return;
    const [, startCol, startRowStr, endCol, endRowStr] = rangeMatch;
    const startRowNum = parseInt(startRowStr, 10);
    const endRowNum = parseInt(endRowStr, 10);
    const startColNum = colLetterToNumber(startCol);
    const endColNum = colLetterToNumber(endCol);
    const flatten = src.flatten !== false; // default true

    const values: (string | string[])[] = [];
    if (flatten) {
      // Single-row or single-column range → string[]
      for (let r = startRowNum; r <= endRowNum; r++) {
        for (let c = startColNum; c <= endColNum; c++) {
          const cell = worksheet.getCell(r, c);
          const val = cell.text ?? '';
          if (val) values.push(val);
        }
      }
      process.capturedVariables = process.capturedVariables || {};
      process.capturedVariables[src.outputVar] = values as string[];
    } else {
      // Matrix → string[][]
      const matrix: string[][] = [];
      for (let r = startRowNum; r <= endRowNum; r++) {
        const row: string[] = [];
        for (let c = startColNum; c <= endColNum; c++) {
          const cell = worksheet.getCell(r, c);
          row.push(cell.text ?? '');
        }
        matrix.push(row);
      }
      process.capturedVariables = process.capturedVariables || {};
      process.capturedVariables[src.outputVar] = matrix as any;
    }
    return;
  }

  // Task-driven sources — delegate to applyTaskSource
  applyTaskSource(worksheet, src as ExportTaskSource, process);
}

/**
 * Resolves a dot-notation field path on a task object.
 * Special case: "checkItems.<id>.<prop>" looks up by checkItem id instead of array index.
 */
function resolveTaskField(task: TaskState, field: string): any {
  // Special case: checkItems.<id>.<prop> — lookup by id
  const checkMatch = field.match(/^checkItems\.([^.]+)\.(.+)/);
  if (checkMatch) {
    const itemId = checkMatch[1];
    const prop = checkMatch[2];
    const item = task.checkItems?.find(c => c.id === itemId);
    return item ? (item as any)[prop] : undefined;
  }

  // Generic dot-notation path
  return field.split('.').reduce((obj, key) => obj?.[key], task as any);
}

function applyTaskSource(
  worksheet: ExcelJS.Worksheet,
  src: ExportTaskSource,
  process: ProcessData,
): void {
  if (src.kind === 'list') {
    const task = findTaskById(process, src.sourceTaskId);
    const items = (task?.listData ?? []).map((it) => it.value);
    const capacity = src.endRow
      ? src.endRow - src.startRow + 1
      : src.maxItems ?? items.length;
    items.slice(0, capacity).forEach((val, idx) => {
      setCell(worksheet, `${src.column}${src.startRow + idx}`, val);
    });
    return;
  }

  if (src.kind === 'detail') {
    const task = findTaskById(process, src.sourceTaskId);
    const items = (task?.detailData ?? []).map((it) => it.capturedText);
    for (const sec of src.sections) {
      const capacity = sec.endRow
        ? sec.endRow - sec.startRow + 1
        : sec.maxItems ?? items.length;
      items.slice(0, capacity).forEach((val, idx) => {
        setCell(worksheet, `${sec.column}${sec.startRow + idx}`, val);
      });
    }
    return;
  }

  if (src.kind === 'form') {
    const task = findTaskById(process, src.sourceTaskId);
    const fields: FormFieldConfig[] = task?.formConfig?.fields ?? [];
    const values = new Map((task?.formData ?? []).map((f) => [f.fieldId, f.value]));
    for (const field of fields) {
      if (!field.valueCell) continue;
      if (!values.has(field.id)) continue;
      setCell(worksheet, field.valueCell, values.get(field.id));
    }
    return;
  }

  if (src.kind === 'detail-table') {
    const task = findTaskById(process, src.sourceTaskId);
    const rows = task?.detailTableData ?? [];
    const max = src.maxRows ?? rows.length;
    rows.slice(0, max).forEach((row, idx) => {
      const excelRow = src.startRow + idx;
      for (const [fieldId, colLetter] of Object.entries(src.columns)) {
        const value = row.values?.[fieldId];
        if (value !== undefined && value !== null && value !== '') {
          setCell(worksheet, `${colLetter}${excelRow}`, value);
        }
      }
    });
    return;
  }

  if (src.kind === 'cell') {
    const task = findTaskById(process, src.sourceTaskId);
    if (task) {
      for (const mapping of src.fields) {
        const value = resolveTaskField(task, mapping.field);
        if (value !== undefined && value !== null && value !== '') {
          setCell(worksheet, mapping.cell, value);
        }
      }
    }
    return;
  }

  if (src.kind === 'checklist') {
    const pool = src.sourceTaskId
      ? ([findTaskById(process, src.sourceTaskId)].filter(Boolean) as TaskState[])
      : collectAllTasks(process);
    const max = src.maxRows ?? pool.length;
    pool.slice(0, max).forEach((t, idx) => {
      const row = src.startRow + idx;
      if (src.columns.aplica) setCell(worksheet, `${src.columns.aplica}${row}`, true);
      if (src.columns.validado) setCell(worksheet, `${src.columns.validado}${row}`, !!t.completedAt);
      if (src.columns.nombre) setCell(worksheet, `${src.columns.nombre}${row}`, t.name);
      if (src.columns.url) {
        const url = (t.evidence as { url?: string } | undefined)?.url || '';
        if (url) setCell(worksheet, `${src.columns.url}${row}`, url);
      }
    });
    return;
  }
}

/**
 * Build a filename from a ProcessExportConfig pattern; falls back to
 * `${process.name}_${today:YYYYMMDD}.xlsx` when no pattern is provided.
 * Always sanitizes output and guarantees a `.xlsx` extension.
 */
export function buildExportFilename(
  pattern: string | undefined,
  process: ProcessData,
): string {
  const defaultPattern = '{process.name}_{today:YYYYMMDD}';
  const raw = interpolateExportTokens(pattern || defaultPattern, process, { sanitize: true });
  const cleaned = raw.replace(/_+/g, '_').replace(/^_+|_+$/g, '') || 'export';
  return cleaned.toLowerCase().endsWith('.xlsx') ? cleaned : `${cleaned}.xlsx`;
}
