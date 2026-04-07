import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DynamicListInput } from '@/app/process/_components/dynamic-list-input';
import { DynamicListConfig, ListItem } from '@/lib/types';

describe('DynamicListInput', () => {
  const defaultConfig: DynamicListConfig = {
    label: 'Repositorio',
    placeholder: 'Ingrese repositorios separados por coma',
    minItems: 1,
    maxItems: 10,
    allowDuplicates: false,
    separators: [',', ';', '\n'],
    trimItems: true
  };

  const mockOnItemsChange = vi.fn();

  beforeEach(() => {
    mockOnItemsChange.mockClear();
  });

  it('renders with default config', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    expect(screen.getByText('Repositorio')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ingrese repositorios/)).toBeInTheDocument();
    expect(screen.getByText('Agregar')).toBeInTheDocument();
  });

  it('adds single item when clicking Add button', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments' } });
    
    const addButton = screen.getByText('Agregar');
    fireEvent.click(addButton);

    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' })
      ])
    );
  });

  it('parses multiple items separated by comma', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments, api-orders, api-auth' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' }),
        expect.objectContaining({ value: 'api-orders' }),
        expect.objectContaining({ value: 'api-auth' })
      ])
    );
  });

  it('parses multiple items separated by semicolon', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments; api-orders; api-auth' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' }),
        expect.objectContaining({ value: 'api-orders' }),
        expect.objectContaining({ value: 'api-auth' })
      ])
    );
  });

  it('parses multiple items separated by newline', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments\napi-orders\napi-auth' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' }),
        expect.objectContaining({ value: 'api-orders' }),
        expect.objectContaining({ value: 'api-auth' })
      ])
    );
  });

  it('ignores duplicate items when allowDuplicates is false', () => {
    const existingItems: ListItem[] = [
      { id: 'item-1', value: 'api-payments', addedAt: new Date().toISOString() }
    ];

    render(
      <DynamicListInput
        config={defaultConfig}
        items={existingItems}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments, api-orders' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    // Should only add api-orders, not api-payments (duplicate)
    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' }), // existing
        expect.objectContaining({ value: 'api-orders' }) // new
      ])
    );
    
    // Should have exactly 2 items (not 3)
    const callArgs = mockOnItemsChange.mock.calls[0][0];
    expect(callArgs.length).toBe(2);
  });

  it('respects maxItems limit', () => {
    const configWithMax: DynamicListConfig = {
      ...defaultConfig,
      maxItems: 2
    };

    const existingItems: ListItem[] = [
      { id: 'item-1', value: 'api-payments', addedAt: new Date().toISOString() }
    ];

    render(
      <DynamicListInput
        config={configWithMax}
        items={existingItems}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-orders, api-auth, api-users' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    // Should only add 1 item (to reach max of 2)
    const callArgs = mockOnItemsChange.mock.calls[0][0];
    expect(callArgs.length).toBe(2);
  });

  it('displays existing items', () => {
    const existingItems: ListItem[] = [
      { id: 'item-1', value: 'api-payments', addedAt: new Date().toISOString() },
      { id: 'item-2', value: 'api-orders', addedAt: new Date().toISOString() }
    ];

    render(
      <DynamicListInput
        config={defaultConfig}
        items={existingItems}
        onItemsChange={mockOnItemsChange}
      />
    );

    expect(screen.getByText('api-payments')).toBeInTheDocument();
    expect(screen.getByText('api-orders')).toBeInTheDocument();
  });

  it('removes item when clicking delete button', () => {
    const existingItems: ListItem[] = [
      { id: 'item-1', value: 'api-payments', addedAt: new Date().toISOString() },
      { id: 'item-2', value: 'api-orders', addedAt: new Date().toISOString() }
    ];

    render(
      <DynamicListInput
        config={defaultConfig}
        items={existingItems}
        onItemsChange={mockOnItemsChange}
      />
    );

    // Find and click the delete button for the first item
    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(mockOnItemsChange).toHaveBeenCalledWith([
      expect.objectContaining({ value: 'api-orders' })
    ]);
  });

  it('shows minimum items warning when not met', () => {
    const configWithMin: DynamicListConfig = {
      ...defaultConfig,
      minItems: 2
    };

    render(
      <DynamicListInput
        config={configWithMin}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    expect(screen.getByText(/Mínimo 2 item\(s\) requerido\(s\)/)).toBeInTheDocument();
  });

  it('is disabled when disabled prop is true', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
        disabled={true}
      />
    );

    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeDisabled();
    
    const addButton = screen.getByText('Agregar');
    expect(addButton).toBeDisabled();
  });

  it('trims whitespace from items when trimItems is true', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: '  api-payments  ,  api-orders  ' } });
    
    fireEvent.click(screen.getByText('Agregar'));

    expect(mockOnItemsChange).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ value: 'api-payments' }),
        expect.objectContaining({ value: 'api-orders' })
      ])
    );
  });

  it('adds items on Enter key press', () => {
    render(
      <DynamicListInput
        config={defaultConfig}
        items={[]}
        onItemsChange={mockOnItemsChange}
      />
    );

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'api-payments' } });
    fireEvent.keyDown(textarea, { key: 'Enter' });

    expect(mockOnItemsChange).toHaveBeenCalled();
  });

  it('shows item count when maxItems is set', () => {
    const existingItems: ListItem[] = [
      { id: 'item-1', value: 'api-payments', addedAt: new Date().toISOString() }
    ];

    render(
      <DynamicListInput
        config={defaultConfig}
        items={existingItems}
        onItemsChange={mockOnItemsChange}
      />
    );

    expect(screen.getByText('(1/10)')).toBeInTheDocument();
  });
});
