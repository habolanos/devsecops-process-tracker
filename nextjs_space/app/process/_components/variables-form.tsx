'use client';

import { useState, useEffect } from 'react';
import { useProcessStore } from '@/lib/store';
import { useConfigStore } from '@/lib/config-store';
import { ProcessVariableYAML, CapturedVariables } from '@/lib/types';
import { useI18n } from '@/lib/i18n-context';
import { Settings, Check, AlertCircle, Zap, FileJson } from 'lucide-react';

interface VariablesFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VariablesForm({ isOpen, onClose }: VariablesFormProps) {
  const { t } = useI18n();
  const process = useProcessStore((state) => state?.process);
  const updateCapturedVariables = useProcessStore((state) => state?.updateCapturedVariables);
  const areRequiredVariablesFilled = useProcessStore((state) => state?.areRequiredVariablesFilled);
  
  // Config store para auto-fill
  const configIsLoaded = useConfigStore((state) => state.isLoaded);
  const getValueForVariable = useConfigStore((state) => state.getValueForVariable);
  const getOptionsForVariable = useConfigStore((state) => state.getOptionsForVariable);
  const configFileName = useConfigStore((state) => state.fileName);
  
  const [localVariables, setLocalVariables] = useState<CapturedVariables>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [autoFilledKeys, setAutoFilledKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (process?.capturedVariables) {
      setLocalVariables({ ...process.capturedVariables });
    }
  }, [process?.capturedVariables]);

  // Auto-fill desde configuración DevOps cuando se abre el formulario
  const handleAutoFill = () => {
    if (!configIsLoaded || !process?.variableDefinitions) return;
    
    const newVariables: CapturedVariables = { ...localVariables };
    const filledKeys = new Set<string>();
    
    process.variableDefinitions.forEach((variable) => {
      // Solo auto-llenar si el campo está vacío
      if (!newVariables[variable.key] || newVariables[variable.key].trim() === '') {
        const configValue = getValueForVariable(variable.key);
        if (configValue) {
          newVariables[variable.key] = configValue;
          filledKeys.add(variable.key);
        }
      }
    });
    
    if (filledKeys.size > 0) {
      setLocalVariables(newVariables);
      setAutoFilledKeys(filledKeys);
      setHasChanges(true);
    }
  };

  if (!isOpen || !process?.variableDefinitions || process.variableDefinitions.length === 0) {
    return null;
  }

  const handleChange = (key: string, value: string) => {
    setLocalVariables((prev) => ({
      ...prev,
      [key]: value
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateCapturedVariables?.(localVariables);
    setHasChanges(false);
    onClose();
  };

  const handleCancel = () => {
    if (process?.capturedVariables) {
      setLocalVariables({ ...process.capturedVariables });
    }
    setHasChanges(false);
    onClose();
  };

  const isFormValid = () => {
    return process.variableDefinitions
      .filter((v) => v.required)
      .every((v) => localVariables[v.key] && localVariables[v.key].trim() !== '');
  };

  const renderInput = (variable: ProcessVariableYAML) => {
    const value = localVariables[variable.key] || '';
    const isEmpty = variable.required && !value.trim();
    const wasAutoFilled = autoFilledKeys.has(variable.key);
    
    // Obtener opciones desde config si están disponibles
    const configOptions = getOptionsForVariable(variable.key);
    const options = variable.options || configOptions;

    // Si hay opciones (del YAML o de la config), mostrar select
    if (options && options.length > 0) {
      return (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => handleChange(variable.key, e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              isEmpty ? 'border-red-300 bg-red-50' : wasAutoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300'
            }`}
          >
            <option value="">{variable.placeholder || 'Seleccionar...'}</option>
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {wasAutoFilled && (
            <span className="absolute right-8 top-1/2 -translate-y-1/2 text-green-500">
              <Zap className="w-4 h-4" />
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="relative">
        <input
          type={variable.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => handleChange(variable.key, e.target.value)}
          placeholder={variable.placeholder}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            isEmpty ? 'border-red-300 bg-red-50' : wasAutoFilled ? 'border-green-300 bg-green-50' : 'border-gray-300'
          }`}
        />
        {wasAutoFilled && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <Zap className="w-4 h-4" />
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-white" />
              <h2 className="text-xl font-semibold text-white">
                {t('variables.title') || 'Configuración de Variables'}
              </h2>
            </div>
            {configIsLoaded && (
              <button
                onClick={handleAutoFill}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg transition-colors"
                title={`Auto-llenar desde ${configFileName}`}
              >
                <Zap className="w-4 h-4" />
                Auto-fill
              </button>
            )}
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {t('variables.description') || 'Complete las variables para activar los links dinámicos'}
          </p>
          {configIsLoaded && (
            <div className="flex items-center gap-2 mt-2 text-xs text-blue-200">
              <FileJson className="w-3 h-3" />
              <span>Config: {configFileName}</span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-4">
            {process.variableDefinitions.map((variable) => (
              <div key={variable.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {variable.label}
                  {variable.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderInput(variable)}
              </div>
            ))}
          </div>

          {/* Status indicator */}
          <div className="mt-6 p-3 rounded-lg bg-gray-50 border">
            {isFormValid() ? (
              <div className="flex items-center gap-2 text-green-600">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {t('variables.complete') || 'Variables completas - Links dinámicos activados'}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {t('variables.incomplete') || 'Complete las variables requeridas para activar los links'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel') || 'Cancelar'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isFormValid()}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isFormValid()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            {t('common.save') || 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}
