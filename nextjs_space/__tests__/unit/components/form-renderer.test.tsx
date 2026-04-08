import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormRenderer } from '@/app/process/_components/form-renderer';
import { FormConfig, FormFieldValue } from '@/lib/types';

vi.mock('@/lib/excel-template-helper', () => ({
  replaceFormConfigTokens: vi.fn((config) => Promise.resolve(config)),
}));

describe('FormRenderer', () => {
  const mockOnDataChange = vi.fn();

  const basicConfig: FormConfig = {
    layout: { type: 'vertical' },
    fields: [
      {
        id: 'name',
        label: 'Nombre',
        type: 'text',
        required: true,
      },
      {
        id: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validation: { pattern: '^[^@]+@[^@]+$' },
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders vertical layout with fields', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText('Nombre')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders grid layout with 2 columns', () => {
    const gridConfig: FormConfig = {
      layout: { type: 'grid', columns: 2, gap: 'medium' },
      fields: [
        {
          id: 'field1',
          label: 'Campo 1',
          type: 'text',
          required: true,
        },
        {
          id: 'field2',
          label: 'Campo 2',
          type: 'text',
          required: true,
        },
      ],
    };

    render(
      <FormRenderer
        config={gridConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText('Campo 1')).toBeInTheDocument();
    expect(screen.getByText('Campo 2')).toBeInTheDocument();
  });

  it('updates field value on change', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    const input = inputs[0]; // First input is 'name'
    fireEvent.change(input, { target: { value: 'Juan' } });

    expect(mockOnDataChange).toHaveBeenCalledWith([
      expect.objectContaining({
        fieldId: 'name',
        value: 'Juan',
      }),
    ]);
  });

  it('shows required asterisk for required fields', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getAllByText('*')).toHaveLength(2);
  });

  it('shows validation error for required empty field', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    // Trigger validation by changing value then clearing
    const inputs = screen.getAllByRole('textbox');
    const input = inputs[0]; // First input is 'name'
    fireEvent.change(input, { target: { value: 'Juan' } });
    fireEvent.change(input, { target: { value: '' } });

    // Error should appear after validation
    expect(screen.getByText('Complete todos los campos requeridos')).toBeInTheDocument();
  });

  it('shows pattern validation error', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    const emailInput = screen.getAllByRole('textbox')[1];
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    // Should show error for invalid pattern
    expect(screen.getByText('Formato inválido')).toBeInTheDocument();
  });

  it('shows maxLength validation error', () => {
    const maxLengthConfig: FormConfig = {
      layout: { type: 'vertical' },
      fields: [
        {
          id: 'short',
          label: 'Corto',
          type: 'text',
          required: true,
          maxLength: 5,
        },
      ],
    };

    render(
      <FormRenderer
        config={maxLengthConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'toolong' } });

    expect(screen.getByText('Máximo 5 caracteres')).toBeInTheDocument();
  });

  it('shows minLength validation error', () => {
    const minLengthConfig: FormConfig = {
      layout: { type: 'vertical' },
      fields: [
        {
          id: 'long',
          label: 'Largo',
          type: 'text',
          required: true,
          minLength: 5,
        },
      ],
    };

    render(
      <FormRenderer
        config={minLengthConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'abc' } });

    expect(screen.getByText('Mínimo 5 caracteres')).toBeInTheDocument();
  });

  it('disables all inputs when disabled prop is true', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
        disabled
      />
    );

    const inputs = screen.getAllByRole('textbox');
    inputs.forEach((input) => {
      expect(input).toBeDisabled();
    });
  });

  it('shows "Formulario completo" when all required fields are filled', () => {
    const filledData: FormFieldValue[] = [
      { fieldId: 'name', value: 'Juan', filledAt: new Date().toISOString() },
      { fieldId: 'email', value: 'juan@test.com', filledAt: new Date().toISOString() },
    ];

    render(
      <FormRenderer
        config={basicConfig}
        data={filledData}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText('✓ Formulario completo')).toBeInTheDocument();
  });

  it('shows incomplete message when required fields are missing', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText('Complete todos los campos requeridos')).toBeInTheDocument();
  });

  it('handles colSpan in grid layout', () => {
    const colSpanConfig: FormConfig = {
      layout: { type: 'grid', columns: 3 },
      fields: [
        {
          id: 'full-width',
          label: 'Ancho completo',
          type: 'text',
          required: true,
          colSpan: 3,
        },
        {
          id: 'half-width',
          label: 'Mitad',
          type: 'text',
          required: true,
          colSpan: 2,
        },
      ],
    };

    render(
      <FormRenderer
        config={colSpanConfig}
        data={[]}
        onDataChange={mockOnDataChange}
      />
    );

    expect(screen.getByText('Ancho completo')).toBeInTheDocument();
    expect(screen.getByText('Mitad')).toBeInTheDocument();
  });

  it('updates existing field value instead of creating new entry', () => {
    const existingData: FormFieldValue[] = [
      { fieldId: 'name', value: 'Old', filledAt: new Date().toISOString() },
    ];

    render(
      <FormRenderer
        config={basicConfig}
        data={existingData}
        onDataChange={mockOnDataChange}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    const input = inputs[0]; // First input is 'name'
    fireEvent.change(input, { target: { value: 'New' } });

    expect(mockOnDataChange).toHaveBeenCalledWith([
      expect.objectContaining({
        fieldId: 'name',
        value: 'New',
      }),
    ]);
  });

  it('does not show incomplete message when disabled', () => {
    render(
      <FormRenderer
        config={basicConfig}
        data={[]}
        onDataChange={mockOnDataChange}
        disabled
      />
    );

    expect(screen.queryByText('Complete todos los campos requeridos')).not.toBeInTheDocument();
  });
});
