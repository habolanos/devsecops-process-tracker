import * as ExcelJS from 'exceljs';

/**
 * Replaces cell reference tokens in a string with values from an Excel template
 * 
 * Supported tokens:
 * - #OFFSET-1# : Gets value from cell one column to the left of valueCell
 * - #CELLA#    : Gets value from absolute cell reference (e.g., #D85#)
 * 
 * @param text - The text containing tokens to replace
 * @param valueCell - The reference cell for OFFSET calculations (e.g., "F85")
 * @param templatePath - Path to the Excel template file
 * @returns The text with tokens replaced by cell values
 */
export async function replaceCellTokens(
  text: string,
  valueCell: string | undefined,
  templatePath: string
): Promise<string> {
  if (!text) return text;
  
  // Read Excel template
  const workbook = new ExcelJS.Workbook();
  const response = await fetch(templatePath);
  const arrayBuffer = await response.arrayBuffer();
  await workbook.xlsx.load(arrayBuffer);
  
  const worksheet = workbook.worksheets[0];
  
  let result = text;
  
  // Replace #OFFSET-1# tokens (relative to valueCell)
  if (valueCell) {
    const offsetCell = getOffsetCell(valueCell, -1);
    if (offsetCell) {
      const offsetValue = worksheet.getCell(offsetCell).value;
      result = result.replace(/#OFFSET-1#/g, String(offsetValue || ''));
    }
  }
  
  // Replace absolute cell reference tokens (#CELLA#)
  const cellRefRegex = /#([A-Z]+[0-9]+)#/g;
  result = result.replace(cellRefRegex, (match, cellRef) => {
    const value = worksheet.getCell(cellRef).value;
    return String(value || '');
  });
  
  return result;
}

/**
 * Calculates the cell reference with column offset
 * @param cellRef - Original cell reference (e.g., "F85")
 * @param offset - Number of columns to offset (negative for left, positive for right)
 * @returns The offset cell reference or null if invalid
 */
function getOffsetCell(cellRef: string, offset: number): string | null {
  if (!cellRef || offset === 0) return cellRef;
  
  // Parse column letters and row number
  const match = cellRef.match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  
  const columnLetters = match[1];
  const rowNumber = match[2];
  
  // Convert column letters to number (A=1, B=2, ..., Z=26, AA=27, etc.)
  let columnNumber = 0;
  for (let i = 0; i < columnLetters.length; i++) {
    columnNumber = columnNumber * 26 + (columnLetters.charCodeAt(i) - 64);
  }
  
  // Apply offset
  const newColumnNumber = columnNumber + offset;
  if (newColumnNumber < 1) return null; // Invalid column
  
  // Convert back to column letters
  let newColumnLetters = '';
  let temp = newColumnNumber;
  while (temp > 0) {
    temp--;
    newColumnLetters = String.fromCharCode(65 + (temp % 26)) + newColumnLetters;
    temp = Math.floor(temp / 26);
  }
  
  return newColumnLetters + rowNumber;
}

/**
 * Replaces tokens in all field labels of a form config
 * @param formConfig - The form configuration with labels containing tokens
 * @param templatePath - Path to the Excel template file
 * @returns A new form config with tokens replaced in labels
 */
export async function replaceFormConfigTokens(
  formConfig: any,
  templatePath: string
): Promise<any> {
  if (!formConfig || !formConfig.fields) {
    return formConfig;
  }
  
  const newFields = await Promise.all(
    formConfig.fields.map(async (field: any) => {
      const newLabel = await replaceCellTokens(
        field.label || '',
        field.valueCell,
        templatePath
      );
      
      return {
        ...field,
        label: newLabel
      };
    })
  );
  
  return {
    ...formConfig,
    fields: newFields
  };
}
