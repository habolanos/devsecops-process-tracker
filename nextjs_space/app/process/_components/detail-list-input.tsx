'use client';

import { useState, useCallback } from 'react';
import { List } from 'lucide-react';
import { DetailListConfig, DetailItem } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DetailListInputProps {
  config: DetailListConfig;
  sourceItems: string[];              // Items from the source task
  detailData: DetailItem[];           // Captured detail data
  onDetailDataChange: (detailData: DetailItem[]) => void;
  disabled?: boolean;
}

export function DetailListInput({ 
  config, 
  sourceItems, 
  detailData, 
  onDetailDataChange, 
  disabled = false 
}: DetailListInputProps) {
  const [error, setError] = useState<string | null>(null);
  const maxLength = config.maxLength;

  const handleDetailChange = useCallback((index: number, value: string) => {
    if (disabled) return;

    if (maxLength && value.length > maxLength) {
      setError(`Máximo ${maxLength} caracteres permitidos`);
      return;
    }

    const newData = [...detailData];
    
    // Ensure we have an entry for this index
    if (!newData[index]) {
      newData[index] = {
        sourceItem: sourceItems[index],
        capturedText: value,
        addedAt: new Date().toISOString()
      };
    } else {
      newData[index].capturedText = value;
    }

    onDetailDataChange(newData);
    setError(null);
  }, [detailData, sourceItems, maxLength, onDetailDataChange, disabled]);

  const getPlaceholder = (sourceItem: string): string => {
    if (config.placeholder) {
      return config.placeholder.replace('{item}', sourceItem);
    }
    return `Ingrese detalle para ${sourceItem}`;
  };

  const allFilled = sourceItems.length > 0 && 
    detailData.length === sourceItems.length && 
    detailData.every(d => d.capturedText.trim().length > 0);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <List className="w-4 h-4" />
        <span className="font-medium">Detalle de Items</span>
        <span className="text-xs text-gray-400">
          ({detailData.filter(d => d.capturedText.trim().length > 0).length}/{sourceItems.length})
        </span>
      </div>

      {/* Items with Detail Inputs */}
      {sourceItems.length === 0 ? (
        <p className="text-sm text-gray-400 italic">
          No hay items disponibles. Complete primero la tarea de lista.
        </p>
      ) : (
        <div className="space-y-3">
          {sourceItems.map((sourceItem, index) => (
            <div key={index} className="space-y-1">
              <Label htmlFor={`detail-${index}`} className="text-sm font-medium text-gray-700">
                <span className="text-xs text-gray-400 font-mono mr-2">
                  {index + 1}.
                </span>
                {sourceItem}
              </Label>
              <Input
                id={`detail-${index}`}
                value={detailData[index]?.capturedText || ''}
                onChange={(e) => handleDetailChange(index, e.target.value)}
                placeholder={getPlaceholder(sourceItem)}
                disabled={disabled}
                maxLength={maxLength}
                className={`text-sm ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                }`}
              />
              {maxLength && (
                <p className="text-xs text-gray-400 text-right">
                  {(detailData[index]?.capturedText?.length || 0)}/{maxLength}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          {error}
        </p>
      )}

      {/* Validation Status */}
      {sourceItems.length > 0 && !allFilled && !disabled && (
        <p className="text-xs text-amber-600">
          Complete todos los detalles ({detailData.filter(d => d.capturedText.trim().length > 0).length}/{sourceItems.length} completados).
        </p>
      )}
      
      {allFilled && (
        <p className="text-xs text-green-600">
          ✓ Todos los detalles completados
        </p>
      )}
    </div>
  );
}
