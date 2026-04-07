'use client';

import { useState, useCallback } from 'react';
import { X, Plus, List } from 'lucide-react';
import { DynamicListConfig, ListItem } from '@/lib/types';

interface DynamicListInputProps {
  config: DynamicListConfig;
  items: ListItem[];
  onItemsChange: (items: ListItem[]) => void;
  disabled?: boolean;
}

export function DynamicListInput({ 
  config, 
  items, 
  onItemsChange, 
  disabled = false 
}: DynamicListInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const defaultSeparators = [',', ';', '\n'];
  const separators = config.separators || defaultSeparators;
  const minItems = config.minItems ?? 1;
  const maxItems = config.maxItems;
  const allowDuplicates = config.allowDuplicates ?? false;
  const trimItems = config.trimItems ?? true;

  const parseInput = useCallback((input: string): string[] => {
    let result = [input];
    
    for (const sep of separators) {
      result = result.flatMap(str => str.split(sep));
    }
    
    if (trimItems) {
      result = result.map(s => s.trim());
    }
    
    return result.filter(s => s.length > 0);
  }, [separators, trimItems]);

  const handleAddItems = useCallback(() => {
    if (!inputValue.trim() || disabled) return;
    
    const newValues = parseInput(inputValue);
    
    if (newValues.length === 0) {
      setError('Ingrese al menos un valor');
      return;
    }

    let valuesToAdd = newValues;
    
    if (!allowDuplicates) {
      const existingValues = new Set(items.map(item => item.value.toLowerCase()));
      valuesToAdd = newValues.filter(v => !existingValues.has(v.toLowerCase()));
      
      if (valuesToAdd.length < newValues.length) {
        const duplicates = newValues.length - valuesToAdd.length;
        setError(`${duplicates} valor(es) duplicado(s) ignorado(s)`);
        setTimeout(() => setError(null), 3000);
      }
    }

    if (maxItems && items.length + valuesToAdd.length > maxItems) {
      const available = maxItems - items.length;
      valuesToAdd = valuesToAdd.slice(0, available);
      setError(`Máximo ${maxItems} items permitidos`);
      setTimeout(() => setError(null), 3000);
    }

    if (valuesToAdd.length === 0) {
      return;
    }

    const newItems: ListItem[] = valuesToAdd.map(value => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      value,
      addedAt: new Date().toISOString()
    }));

    onItemsChange([...items, ...newItems]);
    setInputValue('');
    setError(null);
  }, [inputValue, items, parseInput, allowDuplicates, maxItems, onItemsChange, disabled]);

  const handleRemoveItem = useCallback((itemId: string) => {
    if (disabled) return;
    onItemsChange(items.filter(item => item.id !== itemId));
  }, [items, onItemsChange, disabled]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddItems();
    }
  };

  const isMinMet = items.length >= minItems;
  const separatorHint = separators
    .map(s => s === '\n' ? 'salto de línea' : `"${s}"`)
    .join(', ');

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <List className="w-4 h-4" />
        <span className="font-medium">{config.label}</span>
        {maxItems && (
          <span className="text-xs text-gray-400">
            ({items.length}/{maxItems})
          </span>
        )}
      </div>

      {/* Input Area */}
      <div className="space-y-2">
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={config.placeholder || `Ingrese ${config.label.toLowerCase()}s separados por ${separatorHint}`}
          disabled={disabled || (maxItems !== undefined && items.length >= maxItems)}
          className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
          }`}
          rows={3}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            Separadores: {separatorHint}
          </span>
          <button
            onClick={handleAddItems}
            disabled={disabled || !inputValue.trim() || (maxItems !== undefined && items.length >= maxItems)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              disabled || !inputValue.trim() || (maxItems !== undefined && items.length >= maxItems)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            <Plus className="w-4 h-4" />
            Agregar
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          {error}
        </p>
      )}

      {/* Items List */}
      {items.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-gray-500 font-medium">
            Items agregados:
          </span>
          <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
              <div
                key={item.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm ${
                  disabled 
                    ? 'bg-gray-100 text-gray-600' 
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                <span className="text-xs text-gray-400 font-mono">
                  {index + 1}.
                </span>
                <span className="max-w-[200px] truncate" title={item.value}>
                  {item.value}
                </span>
                {!disabled && (
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-0.5 hover:bg-blue-100 rounded-full transition-colors"
                    title="Eliminar"
                  >
                    <X className="w-3.5 h-3.5 text-blue-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {!isMinMet && (
        <p className="text-xs text-red-500">
          Mínimo {minItems} item(s) requerido(s). Faltan {minItems - items.length}.
        </p>
      )}
    </div>
  );
}
