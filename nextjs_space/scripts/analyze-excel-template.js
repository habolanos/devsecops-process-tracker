const ExcelJS = require('exceljs');
const path = require('path');

async function analyzeTemplate() {
  const templatePath = path.join(__dirname, '../../docs/templates-reports/TEMPLATE_Checklist_Liberacion_ddmmaaaa_RFCxxxxxx_NOTAxxxxxxx_ID.xlsx');
  
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);
  
  console.log('='.repeat(80));
  console.log('ANÁLISIS DEL TEMPLATE EXCEL DE LIBERACIÓN');
  console.log('='.repeat(80));
  console.log(`\nArchivo: ${templatePath}`);
  console.log(`Hojas encontradas: ${workbook.worksheets.length}`);
  
  workbook.worksheets.forEach((worksheet, sheetIndex) => {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`HOJA ${sheetIndex + 1}: "${worksheet.name}"`);
    console.log(`Filas: ${worksheet.rowCount}, Columnas: ${worksheet.columnCount}`);
    console.log('='.repeat(80));
    
    // Analyze merged cells
    const mergedCells = [];
    worksheet.model.merges?.forEach(merge => {
      mergedCells.push(merge);
    });
    
    if (mergedCells.length > 0) {
      console.log(`\nCeldas combinadas: ${mergedCells.length}`);
    }
    
    // Analyze rows with content
    console.log('\n--- CONTENIDO POR FILAS ---\n');
    
    let currentSection = '';
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const values = [];
      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        let value = cell.value;
        
        // Handle rich text
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
          const colLetter = String.fromCharCode(64 + colNumber);
          values.push({ cell: `${colLetter}${rowNumber}`, col: colNumber, value: String(value).substring(0, 50) });
        }
      });
      
      if (values.length > 0) {
        // Detect section headers (usually in blue background or bold)
        const firstValue = values[0]?.value || '';
        if (firstValue.includes('INFORMACIÓN') || 
            firstValue.includes('VALIDACIÓN') || 
            firstValue.includes('COMPONENTES') ||
            firstValue.includes('COMENTARIO')) {
          currentSection = firstValue;
          console.log(`\n>>> SECCIÓN: ${firstValue}`);
        }
        
        // Print row data
        const rowData = values.map(v => `[${v.cell}] ${v.value}`).join(' | ');
        console.log(`Fila ${rowNumber}: ${rowData}`);
      }
    });
    
    // Identify key input cells (empty cells that need data)
    console.log('\n--- CELDAS DE ENTRADA (vacías con formato) ---\n');
    
    const inputCells = [];
    worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        // Check if cell has border/format but no value (likely an input field)
        if (!cell.value && cell.style && (cell.style.border || cell.style.fill)) {
          const colLetter = String.fromCharCode(64 + colNumber);
          inputCells.push(`${colLetter}${rowNumber}`);
        }
      });
    });
    
    if (inputCells.length > 0) {
      console.log(`Total celdas de entrada: ${inputCells.length}`);
      console.log(`Primeras 20: ${inputCells.slice(0, 20).join(', ')}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('FIN DEL ANÁLISIS');
  console.log('='.repeat(80));
}

analyzeTemplate().catch(console.error);
