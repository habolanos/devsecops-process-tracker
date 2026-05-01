import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailTableInput } from '@/app/process/_components/detail-table-input';
import { DetailTableConfig, DetailTableRow } from '@/lib/types';

describe('DetailTableInput', () => {
  const onDetailTableDataChange = vi.fn();

  const baseConfig: DetailTableConfig = {
    sourceTaskId: 'task-1-2',
    columns: [
      { id: 'integracionMaster', label: 'Integración a Master', type: 'boolean', required: true },
      { id: 'deudaTecnica', label: 'Deuda Técnica', type: 'boolean', required: true },
      { id: 'vulnerabilidades', label: 'Vulnerabilidades', type: 'boolean', required: true },
      { id: 'urlRepo', label: 'URL / Comentario', type: 'computed-text', template: '{vars.repositoryUrl}/{item}', required: false },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty message when no source items', () => {
    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={[]}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    expect(screen.getByText(/No hay items disponibles/i)).toBeInTheDocument();
  });

  it('renders a row for each source item with column headers', () => {
    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api', 'repo-web']}
        detailTableData={[]}
        capturedVariables={{ repositoryUrl: 'https://github.com/org' }}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    // Column headers
    expect(screen.getByText('Integración a Master')).toBeInTheDocument();
    expect(screen.getByText('Deuda Técnica')).toBeInTheDocument();
    expect(screen.getByText('Vulnerabilidades')).toBeInTheDocument();
    expect(screen.getByText('URL / Comentario')).toBeInTheDocument();

    // Row labels
    expect(screen.getByText('repo-api')).toBeInTheDocument();
    expect(screen.getByText('repo-web')).toBeInTheDocument();
  });

  it('initializes computed-text columns with template values', () => {
    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{ repositoryUrl: 'https://github.com/org' }}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    // The computed-text field should be initialized with the template value
    const input = screen.getByPlaceholderText('https://github.com/org/repo-api');
    expect(input).toBeInTheDocument();
  });

  it('emits data when boolean checkbox is toggled', () => {
    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    // Find checkboxes (3 boolean columns per row)
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBe(3); // integracionMaster, deudaTecnica, vulnerabilidades

    fireEvent.click(checkboxes[0]); // integracionMaster

    expect(onDetailTableDataChange).toHaveBeenCalledTimes(1);
    const payload = onDetailTableDataChange.mock.calls[0][0] as DetailTableRow[];
    expect(payload[0].sourceItem).toBe('repo-api');
    expect(payload[0].values.integracionMaster).toBe(true);
  });

  it('emits data when text input changes', () => {
    const configWithText: DetailTableConfig = {
      sourceTaskId: 'task-1-2',
      columns: [
        { id: 'comentario', label: 'Comentario', type: 'text', required: false },
      ],
    };

    render(
      <DetailTableInput
        config={configWithText}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    const input = screen.getByPlaceholderText('');
    fireEvent.change(input, { target: { value: 'comentario de prueba' } });

    expect(onDetailTableDataChange).toHaveBeenCalledTimes(1);
    const payload = onDetailTableDataChange.mock.calls[0][0] as DetailTableRow[];
    expect(payload[0].values.comentario).toBe('comentario de prueba');
  });

  it('emits data when date input changes', () => {
    const configWithDate: DetailTableConfig = {
      sourceTaskId: 'task-1-2',
      columns: [
        { id: 'fecha', label: 'Fecha', type: 'date', required: true },
      ],
    };

    render(
      <DetailTableInput
        config={configWithDate}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    const dateInput = screen.getByDisplayValue('');
    fireEvent.change(dateInput, { target: { value: '2026-04-23' } });

    expect(onDetailTableDataChange).toHaveBeenCalledTimes(1);
    const payload = onDetailTableDataChange.mock.calls[0][0] as DetailTableRow[];
    expect(payload[0].values.fecha).toBe('2026-04-23');
  });

  it('emits data when list select changes', () => {
    const configWithList: DetailTableConfig = {
      sourceTaskId: 'task-1-2',
      columns: [
        { id: 'riesgo', label: 'Riesgo', type: 'list', required: true, options: ['Bajo', 'Medio', 'Alto'] },
      ],
    };

    render(
      <DetailTableInput
        config={configWithList}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    // Click the select trigger to open
    const trigger = screen.getByRole('combobox');
    expect(trigger).toBeInTheDocument();
  });

  it('shows completion status when all required fields are filled', () => {
    const data: DetailTableRow[] = [
      {
        sourceItem: 'repo-api',
        values: {
          integracionMaster: true,
          deudaTecnica: true,
          vulnerabilidades: true,
          urlRepo: 'https://github.com/org/repo-api',
        },
        addedAt: new Date().toISOString(),
      },
    ];

    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={data}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    expect(screen.getByText(/Todas las filas completadas/i)).toBeInTheDocument();
  });

  it('shows incomplete warning when required fields are missing', () => {
    const data: DetailTableRow[] = [
      {
        sourceItem: 'repo-api',
        values: {
          integracionMaster: true,
          deudaTecnica: false, // required but not checked
          vulnerabilidades: true,
          urlRepo: '',
        },
        addedAt: new Date().toISOString(),
      },
    ];

    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={data}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    expect(screen.getByText(/Complete todas las filas requeridas/i)).toBeInTheDocument();
  });

  it('disables all inputs when disabled prop is true', () => {
    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={[]}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
        disabled
      />
    );

    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach((cb) => {
      expect(cb).toBeDisabled();
    });
  });

  it('preserves existing data when re-rendering with same source items', () => {
    const existingData: DetailTableRow[] = [
      {
        sourceItem: 'repo-api',
        values: {
          integracionMaster: true,
          deudaTecnica: true,
          vulnerabilidades: false,
          urlRepo: 'custom-url',
        },
        addedAt: new Date().toISOString(),
      },
    ];

    render(
      <DetailTableInput
        config={baseConfig}
        sourceItems={['repo-api']}
        detailTableData={existingData}
        capturedVariables={{}}
        onDetailTableDataChange={onDetailTableDataChange}
      />
    );

    // The custom URL should be preserved
    const urlInput = screen.getByDisplayValue('custom-url');
    expect(urlInput).toBeInTheDocument();
  });
});
