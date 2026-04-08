const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeTemplateDetailed() {
  const templatePath = path.join(__dirname, '../../docs/templates-reports/TEMPLATE_Checklist_Liberacion_ddmmaaaa_RFCxxxxxx_NOTAxxxxxxx_ID.xlsx');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  const worksheet = workbook.worksheets[0]; // Main sheet
  
  console.log('='.repeat(100));
  console.log('MAPEO DE CELDAS DEL TEMPLATE DE LIBERACIÓN');
  console.log('='.repeat(100));
  
  // Define the structure we need to map
  const cellMapping = {
    // INFORMACIÓN GENERAL DE LA LIBERACIÓN
    'INFO_GENERAL': {
      section: 'INFORMACIÓN GENERAL DE LA LIBERACIÓN',
      fields: []
    }
  };
  
  // Scan first 100 rows for structure
  const structure = [];
  let currentSection = null;
  
  for (let rowNum = 1; rowNum <= 100; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const rowData = { row: rowNum, cells: [] };
    
    for (let colNum = 1; colNum <= 32; colNum++) {
      const cell = row.getCell(colNum);
      let value = cell.value;
      
      // Extract text value
      if (value && typeof value === 'object') {
        if (value.richText) {
          value = value.richText.map(rt => rt.text).join('');
        } else if (value.result !== undefined) {
          value = value.result;
        } else if (value.text) {
          value = value.text;
        }
      }
      
      if (value !== null && value !== undefined && value !== '') {
        const colLetter = getColumnLetter(colNum);
        rowData.cells.push({
          cell: `${colLetter}${rowNum}`,
          col: colNum,
          colLetter,
          value: String(value).trim()
        });
      }
    }
    
    if (rowData.cells.length > 0) {
      // Detect sections
      const firstVal = rowData.cells[0]?.value || '';
      if (firstVal.includes('INFORMACIÓN GENERAL') ||
          firstVal.includes('VALIDACIÓN DE CONFIGURACIONES') ||
          firstVal.includes('VALIDACIÓN DE PULLREQUEST') ||
          firstVal.includes('VALIDACIÓN DE PIPELINES') ||
          firstVal.includes('COMPONENTES EN CASO') ||
          firstVal.includes('INFORMACIÓN DEL PROCESO') ||
          firstVal.includes('COMENTARIO GENERALES')) {
        currentSection = firstVal.substring(0, 60);
        console.log(`\n${'='.repeat(100)}`);
        console.log(`SECCIÓN: ${currentSection}`);
        console.log('='.repeat(100));
      }
      
      structure.push({ ...rowData, section: currentSection });
      
      // Print meaningful rows
      if (rowData.cells.length > 0 && rowData.cells.length < 10) {
        const cells = rowData.cells.map(c => `${c.cell}="${c.value.substring(0, 40)}"`).join(' | ');
        console.log(`Row ${rowNum}: ${cells}`);
      }
    }
  }
  
  // Generate the cell map for code
  console.log('\n\n' + '='.repeat(100));
  console.log('MAPA DE CELDAS PARA IMPLEMENTACIÓN');
  console.log('='.repeat(100));
  
  const cellMap = `
// Excel Cell Mapping for Release Checklist Template
export const EXCEL_CELL_MAP = {
  // Hoja 1: Checklist Principal
  CHECKLIST: {
    // INFORMACIÓN GENERAL DE LA LIBERACIÓN (Filas 2-14)
    INFO_GENERAL: {
      TORRE: 'C3',
      FECHA_LIBERACION: 'X3',
      NOMBRE_PROYECTO: 'C4',
      VENTANA_TIEMPO: 'X4',
      API: 'G4',
      COMPONENTES_LIBERAR: 'C6',
      URI_MEET: 'X6',
      RFC: 'C8',
      NOTA_INSTALACION: 'X8',
      SCM_DIURNO: 'C9',
      LIDER: 'X9',
      SRE_NOCTURNO: 'C10',
      TESTER: 'X10',
      SRE_DIURNO: 'C11',
      DESARROLLADOR: 'X11',
      INICIO_GUARDIA_NOCTURNA: 'C12',
      INICIO_GUARDIA_DIURNA: 'X12',
      FIN_GUARDIA_NOCTURNA: 'C13',
      FIN_GUARDIA_DIURNA: 'X13'
    },
    
    // VALIDACIÓN DE CONFIGURACIONES (Filas 16-38)
    VALIDACIONES: {
      START_ROW: 18,
      COLUMNS: {
        VALIDACION: 'C',
        APLICA: 'T',
        VALIDADO: 'U',
        RESPUESTA_URL: 'V'
      },
      ITEMS: [
        { row: 18, key: 'ROLLBACK_HARBOR' },
        { row: 19, key: 'IMAGEN_LIBERAR_HARBOR' },
        { row: 20, key: 'FECHA_IMAGEN' },
        { row: 21, key: 'REQUISITOS_DESARROLLO' },
        { row: 22, key: 'CORREO_APOYO_GUARDIA' },
        { row: 23, key: 'IRC_OBSERVADOR' },
        { row: 24, key: 'CONFIG_PROPERTIES' },
        { row: 25, key: 'CONFIG_YAML' },
        { row: 26, key: 'CONFIG_JSON' },
        { row: 27, key: 'CONFIG_SERVIDOR' },
        { row: 28, key: 'CONFIG_CONFIG' },
        { row: 29, key: 'CONFIG_API' },
        { row: 30, key: 'CONFIG_XSLT' },
        { row: 31, key: 'CREDENCIALES_TOKEN' },
        { row: 32, key: 'TIMEOUT_PIPELINE' },
        { row: 33, key: 'MANIFEST_BD' },
        { row: 34, key: 'CREDENCIALES_CENTRO' },
        { row: 35, key: 'MANIFEST_DOCKER' },
        { row: 36, key: 'MANIFEST_YAML' },
        { row: 37, key: 'ACTUALIZACIONES_IMAGEN' }
      ]
    },
    
    // VALIDACIÓN DE PR Y DEUDA TÉCNICA (Filas 40-52)
    PR_DEUDA_TECNICA: {
      START_ROW: 42,
      END_ROW: 52,
      COLUMNS: {
        COMPONENTE: 'B',
        INTEGRACION_ARQ: 'I',
        DEUDA_TECNICA: 'L',
        VULNERABILIDADES: 'P',
        URL_REPO: 'T'
      }
    },
    
    // VALIDACIÓN DE PIPELINES CD (Filas 55-67)
    PIPELINES_CD: {
      START_ROW: 57,
      END_ROW: 67,
      COLUMNS: {
        COMPONENTE: 'B',
        ORDEN_TAREAS: 'G',
        VARIABLES: 'I',
        VALIDACION_PUERTOS: 'L',
        HEALTH_CHECK: 'O',
        NUM_POST: 'Q',
        URL_CONFIG_VARIABLES: 'R',
        COMENTARIOS: 'Z'
      }
    },
    
    // COMPONENTES EN CASO DE ROLLBACK (Filas 70-80)
    ROLLBACK: {
      START_ROW: 72,
      END_ROW: 80,
      COLUMNS: {
        COMPONENTE: 'B',
        NUM_RELEASE: 'H',
        RAMA: 'L',
        URL_ROLLBACK: 'N',
        PROPERTIES_COMMIT: 'W'
      }
    },
    
    // INFORMACIÓN DEL PROCESO REALIZADO (Filas 83-97)
    PROCESO_REALIZADO: {
      HEADER: {
        ID_LIBERACION: 'C85',
        FECHA_HORA_VALIDACION: 'X85',
        TIPO_LIBERACION: 'C86',
        FECHA_INICIO_GUARDIA: 'X86',
        TIEMPO_GUARDIA: 'C87',
        FECHA_FIN_GUARDIA: 'X87'
      },
      COMPONENTES: {
        START_ROW: 90,
        END_ROW: 97,
        COLUMNS: {
          COMPONENTE: 'B',
          NUM_RELEASE: 'H',
          RAMA: 'K',
          URL_RELEASE: 'N',
          EJECUCION_CD: 'U',
          DESPLIEGUE_CORRECTO: 'W',
          REVISION_DESPLIEGUE: 'Y',
          APLICO_ROLLBACK: 'Z',
          TIEMPO_M: '['
        }
      }
    },
    
    // COMENTARIOS GENERALES (Fila 99+)
    COMENTARIOS: {
      START_ROW: 100,
      CELL: 'B100'
    }
  },
  
  // Hoja 2: Evidencias
  EVIDENCIAS: {
    SHEET_INDEX: 1,
    START_ROW: 3,
    COLUMNS: {
      FECHA_HORA: 'B',
      ACTIVIDAD: 'C'
    }
  },
  
  // Hoja 3: Defectos
  DEFECTOS: {
    SHEET_INDEX: 2,
    START_ROW: 3,
    COLUMNS: {
      FECHA_INICIAL: 'A',
      FECHA_CIERRE: 'B',
      ESTATUS: 'C',
      AMBIENTE: 'D',
      SEVERIDAD: 'E',
      TIPO_DEFECTO: 'F',
      DESCRIPCION: 'G',
      QUIEN_REPORTA: 'H',
      QUIEN_CORRIGE: 'I',
      QUIEN_VALIDA: 'J',
      LIDER_TECNICO: 'K'
    }
  }
};
`;

  console.log(cellMap);
}

function getColumnLetter(col) {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

analyzeTemplateDetailed().catch(console.error);
