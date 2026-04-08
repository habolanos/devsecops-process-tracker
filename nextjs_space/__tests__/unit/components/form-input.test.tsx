import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormInput } from '@/app/process/_components/form-input';
import { FormFieldConfig, FieldType } from '@/lib/types';

describe('FormInput', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders text input with label', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders email input', () => {
    const config: FormFieldConfig = {
      id: 'email',
      label: 'Email',
      type: 'email',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('renders number input', () => {
    const config: FormFieldConfig = {
      id: 'age',
      label: 'Edad',
      type: 'number',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByRole('spinbutton');
    expect(input).toBeInTheDocument();
  });

  it('renders date input', () => {
    const config: FormFieldConfig = {
      id: 'birthdate',
      label: 'Fecha de Nacimiento',
      type: 'date',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = document.querySelector('input[type="date"]');
    expect(input).toBeInTheDocument();
  });

  it('renders time input', () => {
    const config: FormFieldConfig = {
      id: 'time',
      label: 'Hora',
      type: 'time',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = document.querySelector('input[type="time"]');
    expect(input).toBeInTheDocument();
  });

  it('renders datetime-local input', () => {
    const config: FormFieldConfig = {
      id: 'datetime',
      label: 'Fecha y Hora',
      type: 'datetime',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = document.querySelector('input[type="datetime-local"]');
    expect(input).toBeInTheDocument();
  });

  it('renders boolean checkbox', () => {
    const config: FormFieldConfig = {
      id: 'accepted',
      label: 'Acepto términos',
      type: 'boolean',
      required: true,
    };

    render(<FormInput config={config} value={false} onChange={mockOnChange} />);

    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('shows "Sí" when boolean is checked', () => {
    const config: FormFieldConfig = {
      id: 'accepted',
      label: 'Acepto términos',
      type: 'boolean',
      required: true,
    };

    render(<FormInput config={config} value={true} onChange={mockOnChange} />);

    expect(screen.getByText('Sí')).toBeInTheDocument();
  });

  it('renders textarea', () => {
    const config: FormFieldConfig = {
      id: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const textarea = screen.getByRole('textbox');
    expect(textarea.tagName).toBe('TEXTAREA');
  });

  it('renders image input as text placeholder', () => {
    const config: FormFieldConfig = {
      id: 'image',
      label: 'Imagen',
      type: 'image',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('URL de imagen o descripción');
    expect(input).toBeInTheDocument();
  });

  it('renders select with options', () => {
    const config: FormFieldConfig = {
      id: 'country',
      label: 'País',
      type: 'select',
      required: true,
      options: ['Colombia', 'México', 'Argentina'],
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    expect(screen.getByText('Seleccione...')).toBeInTheDocument();
  });

  it('calls onChange when text input changes', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Juan' } });

    expect(mockOnChange).toHaveBeenCalledWith('Juan');
  });

  it('shows required asterisk when field is required', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows description when provided', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: false,
      description: 'Ingrese su nombre completo',
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    expect(screen.getByText('Ingrese su nombre completo')).toBeInTheDocument();
  });

  it('shows error message when error prop is provided', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} error="Campo inválido" />);

    expect(screen.getByText('Campo inválido')).toBeInTheDocument();
  });

  it('shows character count when maxLength is set', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      maxLength: 10,
    };

    render(<FormInput config={config} value="Juan" onChange={mockOnChange} />);

    expect(screen.getByText('4/10')).toBeInTheDocument();
  });

  it('disables input when disabled prop is true', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} disabled />);

    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('applies maxLength to text input', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      maxLength: 5,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '5');
  });

  it('shows character count for textarea with maxLength', () => {
    const config: FormFieldConfig = {
      id: 'description',
      label: 'Descripción',
      type: 'textarea',
      required: true,
      maxLength: 100,
    };

    render(<FormInput config={config} value="Test text" onChange={mockOnChange} />);

    expect(screen.getByText('9/100')).toBeInTheDocument();
  });

  it('shows character count for text input with maxLength', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
      maxLength: 10,
    };

    render(<FormInput config={config} value="Juan" onChange={mockOnChange} />);

    expect(screen.getByText('4/10')).toBeInTheDocument();
  });

  it('does not show character count when value is not a string', () => {
    const config: FormFieldConfig = {
      id: 'accepted',
      label: 'Acepto',
      type: 'boolean',
      required: true,
      maxLength: 10,
    };

    render(<FormInput config={config} value={true} onChange={mockOnChange} />);

    expect(screen.queryByText(/\d+\/\d+/)).not.toBeInTheDocument();
  });

  it('shows placeholder for text input when provided', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: false,
      placeholder: 'Ingrese su nombre',
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} />);

    const input = screen.getByPlaceholderText('Ingrese su nombre');
    expect(input).toBeInTheDocument();
  });

  it('applies error class when error prop is provided', () => {
    const config: FormFieldConfig = {
      id: 'name',
      label: 'Nombre',
      type: 'text',
      required: true,
    };

    render(<FormInput config={config} value="" onChange={mockOnChange} error="Campo inválido" />);

    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
  });

  it('returns null for unknown field type', () => {
    const config: FormFieldConfig = {
      id: 'unknown',
      label: 'Unknown',
      type: 'text',
      required: true,
    };

    // Override type to simulate unknown type
    const modifiedConfig = { ...config, type: 'unknown' as FieldType };

    render(<FormInput config={modifiedConfig} value="" onChange={mockOnChange} />);

    // Should render label but no input
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});
