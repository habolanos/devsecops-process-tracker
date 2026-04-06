'use client';

import * as ExcelJS from 'exceljs';

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
