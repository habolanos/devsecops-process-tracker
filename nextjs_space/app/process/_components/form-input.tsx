'use client';

import { FormFieldConfig } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormInputProps {
  config: FormFieldConfig;
  value: any;
  onChange: (value: any) => void;
  disabled?: boolean;
  error?: string;
}

export function FormInput({ config, value, onChange, disabled, error }: FormInputProps) {
  const renderField = () => {
    switch (config.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={config.type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            maxLength={config.maxLength}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'time':
        return (
          <Input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={config.id}
              checked={value || false}
              onCheckedChange={onChange}
              disabled={disabled}
            />
            <label
              htmlFor={config.id}
              className="text-sm text-gray-600 cursor-pointer"
            >
              {value ? 'Sí' : 'No'}
            </label>
          </div>
        );

      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder}
            disabled={disabled}
            maxLength={config.maxLength}
            rows={3}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'image':
        // Para imágenes, usamos un input file simple por ahora
        return (
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="URL de imagen o descripción"
            disabled={disabled}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select
            value={value || ''}
            onValueChange={onChange}
            disabled={disabled}
          >
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={config.placeholder || 'Seleccione...'} />
            </SelectTrigger>
            <SelectContent>
              {config.options?.map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-1">
      <Label htmlFor={config.id} className="text-sm font-medium text-gray-700">
        {config.label}
        {config.required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {config.description && (
        <p className="text-xs text-gray-500">{config.description}</p>
      )}
      {renderField()}
      {error && <p className="text-xs text-red-500">{error}</p>}
      {config.maxLength && typeof value === 'string' && (
        <p className="text-xs text-gray-400 text-right">
          {value.length}/{config.maxLength}
        </p>
      )}
    </div>
  );
}
