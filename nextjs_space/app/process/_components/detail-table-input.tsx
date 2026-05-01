'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table2 } from 'lucide-react';
import { DetailTableConfig, DetailTableColumn, DetailTableRow } from '@/lib/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { replaceCellTokens } from '@/lib/excel-template-helper';

interface DetailTableInputProps {
  config: DetailTableConfig;
  sourceItems: string[];
  detailTableData: DetailTableRow[];
  capturedVariables: Record<string, string | string[]>;
  onDetailTableDataChange: (data: DetailTableRow[]) => void;
  disabled?: boolean;
  templatePath?: string;  // Path to Excel template for #CELL# token replacement in labels
  sheet?: string;         // Sheet name in template (default: first sheet)
}

/** Extract only string-valued entries from CapturedVariables (for template interpolation). */
function stringOnlyVars(vars: Record<string, string | string[]>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(vars)) {
    if (typeof v === 'string') result[k] = v;
  }
  return result;
}

function computeTemplateValue(
  template: string,
  item: string,
  vars: Record<string, string>,
): string {
  return template
    .replace(/\{item\}/g, item)
    .replace(/\{vars\.([a-zA-Z0-9_]+)\}/g, (_, key) => vars[key] ?? '')
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => vars[key] ?? '');
}

export function DetailTableInput({
  config,
  sourceItems,
  detailTableData,
  capturedVariables,
  onDetailTableDataChange,
  disabled = false,
  templatePath,
  sheet,
}: DetailTableInputProps) {
  // Resolve #CELL# tokens in column labels (same pattern as FormRenderer)
  const [processedConfig, setProcessedConfig] = useState<DetailTableConfig>(config);

  // Track deps to reset processedConfig when config/templatePath/sheet change
  const [trackedDeps, setTrackedDeps] = useState<{ config: DetailTableConfig; templatePath?: string; sheet?: string }>({
    config,
    templatePath,
    sheet,
  });
  if (trackedDeps.config !== config || trackedDeps.templatePath !== templatePath || trackedDeps.sheet !== sheet) {
    setTrackedDeps({ config, templatePath, sheet });
    setProcessedConfig(config);
  }

  useEffect(() => {
    if (!templatePath) return;
    // Replace #CELL# tokens in column labels
    const resolveLabels = async () => {
      const newColumns = await Promise.all(
        config.columns.map(async (col) => {
          if (!col.label || !col.label.includes('#')) return col;
          const newLabel = await replaceCellTokens(col.label, undefined, templatePath, sheet);
          return { ...col, label: newLabel };
        })
      );
      setProcessedConfig({ ...config, columns: newColumns });
    };
    resolveLabels().catch((err) => {
      console.error('Error replacing cell tokens in detail-table:', err);
    });
  }, [config, templatePath, sheet]);

  const columns = processedConfig.columns;

  // Ensure rows match source items
  const rows = useMemo(() => {
    const result: DetailTableRow[] = sourceItems.map((item, idx) => {
      const existing = detailTableData.find((r) => r.sourceItem === item);
      if (existing) return existing;

      // Initialize computed-text columns with template values
      const initialValues: Record<string, any> = {};
      for (const col of columns) {
        if (col.type === 'computed-text' && col.template) {
          initialValues[col.id] = computeTemplateValue(col.template, item, stringOnlyVars(capturedVariables));
        } else if (col.type === 'boolean') {
          initialValues[col.id] = false;
        } else {
          initialValues[col.id] = '';
        }
      }

      return {
        sourceItem: item,
        values: initialValues,
        addedAt: new Date().toISOString(),
      };
    });
    return result;
  }, [sourceItems, detailTableData, columns, capturedVariables]);

  const handleCellChange = useCallback(
    (rowIndex: number, columnId: string, value: any) => {
      if (disabled) return;
      const newRows = [...rows];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        values: { ...newRows[rowIndex].values, [columnId]: value },
      };
      onDetailTableDataChange(newRows);
    },
    [rows, disabled, onDetailTableDataChange],
  );

  const filledCount = rows.filter((row) => {
    const requiredCols = columns.filter((c) => c.required);
    return requiredCols.every((col) => {
      const val = row.values[col.id];
      if (col.type === 'boolean') return val === true;
      return val !== '' && val !== undefined && val !== null;
    });
  }).length;

  const allFilled = sourceItems.length > 0 && filledCount === sourceItems.length;

  const renderCell = (row: DetailTableRow, col: DetailTableColumn, rowIdx: number) => {
    const value = row.values[col.id];
    const cellDisabled = disabled;

    switch (col.type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleCellChange(rowIdx, col.id, !!checked)}
              disabled={cellDisabled}
            />
          </div>
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => handleCellChange(rowIdx, col.id, e.target.value)}
            disabled={cellDisabled}
            className="h-8 text-xs"
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => handleCellChange(rowIdx, col.id, e.target.value)}
            disabled={cellDisabled}
            placeholder={col.placeholder || '0'}
            className="h-8 text-xs"
          />
        );

      case 'list':
        return (
          <Select
            value={value || ''}
            onValueChange={(v) => handleCellChange(rowIdx, col.id, v)}
            disabled={cellDisabled}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={col.placeholder || 'Seleccionar'} />
            </SelectTrigger>
            <SelectContent>
              {(col.options || []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'computed-text': {
        const computedVal = col.template
          ? computeTemplateValue(col.template, row.sourceItem, stringOnlyVars(capturedVariables))
          : '';
        const displayVal = value || computedVal;
        return (
          <Input
            type="text"
            value={displayVal}
            onChange={(e) => handleCellChange(rowIdx, col.id, e.target.value)}
            placeholder={col.placeholder || computedVal}
            disabled={cellDisabled}
            maxLength={col.maxLength}
            className="h-8 text-xs"
          />
        );
      }

      case 'text':
      default:
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => handleCellChange(rowIdx, col.id, e.target.value)}
            placeholder={col.placeholder || ''}
            disabled={cellDisabled}
            maxLength={col.maxLength}
            className="h-8 text-xs"
          />
        );
    }
  };

  if (sourceItems.length === 0) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Table2 className="w-4 h-4" />
          <span className="font-medium">Tabla de Validación</span>
        </div>
        <p className="text-sm text-gray-400 italic">
          No hay items disponibles. Complete primero la tarea de lista.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Table2 className="w-4 h-4" />
        <span className="font-medium">Tabla de Validación</span>
        <span className="text-xs text-gray-400">
          ({filledCount}/{sourceItems.length} filas completadas)
        </span>
      </div>

      {/* Responsive table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm" data-testid="detail-table">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2 text-left font-medium text-gray-700 text-xs whitespace-nowrap">
                #
              </th>
              <th className="px-3 py-2 text-left font-medium text-gray-700 text-xs whitespace-nowrap">
                Repositorio
              </th>
              {columns.map((col) => (
                <th
                  key={col.id}
                  className="px-3 py-2 text-left font-medium text-gray-700 text-xs whitespace-nowrap"
                >
                  {col.label}
                  {col.required && <span className="text-red-500 ml-0.5">*</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={row.sourceItem}
                className="border-b last:border-b-0 hover:bg-gray-50/50"
              >
                <td className="px-3 py-2 text-xs text-gray-400 font-mono">
                  {rowIdx + 1}
                </td>
                <td className="px-3 py-2 text-xs font-medium text-gray-700 whitespace-nowrap">
                  {row.sourceItem}
                </td>
                {columns.map((col) => (
                  <td key={col.id} className="px-2 py-1.5">
                    {renderCell(row, col, rowIdx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Validation Status */}
      {!allFilled && !disabled && (
        <p className="text-xs text-amber-600">
          Complete todas las filas requeridas ({filledCount}/{sourceItems.length} completadas).
        </p>
      )}
      {allFilled && (
        <p className="text-xs text-green-600">✓ Todas las filas completadas</p>
      )}
    </div>
  );
}
