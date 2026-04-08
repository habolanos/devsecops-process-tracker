'use client';

import { useState, useEffect } from 'react';
import { FormConfig, FormFieldValue, FormLayoutType } from '@/lib/types';
import { FormInput } from './form-input';
import { replaceFormConfigTokens } from '@/lib/excel-template-helper';

interface FormRendererProps {
  config: FormConfig;
  data: FormFieldValue[];
  onDataChange: (data: FormFieldValue[]) => void;
  disabled?: boolean;
  templatePath?: string;  // Path to Excel template for token replacement
}

export function FormRenderer({ config, data, onDataChange, disabled, templatePath }: FormRendererProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [processedConfig, setProcessedConfig] = useState<FormConfig>(config);

  const layout = config.layout || { type: 'vertical' as FormLayoutType };
  const isGrid = layout.type === 'grid';
  const columns = layout.columns || 2;
  const gapClass = layout.gap === 'small' ? 'gap-2' : layout.gap === 'large' ? 'gap-6' : 'gap-4';

  // Replace cell tokens in labels when templatePath is provided
  useEffect(() => {
    if (templatePath) {
      replaceFormConfigTokens(config, templatePath)
        .then(setProcessedConfig)
        .catch((err) => {
          console.error('Error replacing cell tokens:', err);
          setProcessedConfig(config); // Fallback to original config
        });
    } else {
      setProcessedConfig(config);
    }
  }, [config, templatePath]);

  const updateFieldValue = (fieldId: string, value: any) => {
    const newData = [...data];
    const existingIndex = newData.findIndex((d) => d.fieldId === fieldId);

    if (existingIndex >= 0) {
      newData[existingIndex] = {
        ...newData[existingIndex],
        value,
        filledAt: new Date().toISOString(),
      };
    } else {
      newData.push({
        fieldId,
        value,
        filledAt: new Date().toISOString(),
      });
    }

    onDataChange(newData);
    validateField(fieldId, value);
  };

  const validateField = (fieldId: string, value: any) => {
    const field = config.fields.find((f) => f.id === fieldId);
    if (!field) return;

    let error = '';

    if (field.required && (!value || (Array.isArray(value) && value.length === 0))) {
      error = 'Este campo es requerido';
    } else if (field.validation?.pattern && typeof value === 'string') {
      const regex = new RegExp(field.validation.pattern);
      if (!regex.test(value)) {
        error = 'Formato inválido';
      }
    } else if (field.maxLength && value && value.length > field.maxLength) {
      error = `Máximo ${field.maxLength} caracteres`;
    } else if (field.minLength && value && value.length < field.minLength) {
      error = `Mínimo ${field.minLength} caracteres`;
    }

    setErrors((prev) => ({ ...prev, [fieldId]: error }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors: Record<string, string> = {};

    processedConfig.fields.forEach((field) => {
      const fieldValue = data.find((d) => d.fieldId === field.id)?.value;

      if (field.required && (!fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0))) {
        newErrors[field.id] = 'Este campo es requerido';
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const isFormValid = () => {
    const requiredFields = processedConfig.fields.filter((f) => f.required);
    const filledRequired = requiredFields.filter((f) => {
      const value = data.find((d) => d.fieldId === f.id)?.value;
      return value && (!Array.isArray(value) || value.length > 0);
    });

    return filledRequired.length === requiredFields.length;
  };

  // Función para calcular la clase CSS del grid según colSpan
  const getColSpanClass = (colSpan: number = 1) => {
    const span = Math.min(colSpan, columns);
    switch (columns) {
      case 2:
        return span === 2 ? 'col-span-2' : 'col-span-1';
      case 3:
        return span === 3 ? 'col-span-3' : span === 2 ? 'col-span-2' : 'col-span-1';
      case 4:
        return `col-span-${span}`;
      default:
        return 'col-span-1';
    }
  };

  return (
    <div className="space-y-4">
      {isGrid ? (
        // Layout Grid
        <div className={`grid grid-cols-${columns} ${gapClass}`}>
          {processedConfig.fields.map((field) => {
            const fieldValue = data.find((d) => d.fieldId === field.id)?.value;
            return (
              <div key={field.id} className={getColSpanClass(field.colSpan)}>
                <FormInput
                  config={field}
                  value={fieldValue}
                  onChange={(value) => updateFieldValue(field.id, value)}
                  disabled={disabled}
                  error={errors[field.id]}
                />
              </div>
            );
          })}
        </div>
      ) : (
        // Layout Vertical
        <div className="space-y-4">
          {processedConfig.fields.map((field) => {
            const fieldValue = data.find((d) => d.fieldId === field.id)?.value;
            return (
              <FormInput
                key={field.id}
                config={field}
                value={fieldValue}
                onChange={(value) => updateFieldValue(field.id, value)}
                disabled={disabled}
                error={errors[field.id]}
              />
            );
          })}
        </div>
      )}

      {!isFormValid() && !disabled && (
        <p className="text-xs text-amber-600">
          Complete todos los campos requeridos
        </p>
      )}

      {isFormValid() && (
        <p className="text-xs text-green-600">
          ✓ Formulario completo
        </p>
      )}
    </div>
  );
}
