import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DetailListInput } from '@/app/process/_components/detail-list-input';
import { DetailItem } from '@/lib/types';

describe('DetailListInput', () => {
  const onDetailDataChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows empty source message when no source items', () => {
    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1' }}
        sourceItems={[]}
        detailData={[]}
        onDetailDataChange={onDetailDataChange}
      />
    );

    expect(screen.getByText(/No hay items disponibles/i)).toBeInTheDocument();
  });

  it('renders one input per source item and supports placeholder template', () => {
    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1', placeholder: 'Detalle para {item}' }}
        sourceItems={['repo-api', 'repo-web']}
        detailData={[]}
        onDetailDataChange={onDetailDataChange}
      />
    );

    expect(screen.getByPlaceholderText('Detalle para repo-api')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Detalle para repo-web')).toBeInTheDocument();
  });

  it('emits new detail data when typing', () => {
    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1' }}
        sourceItems={['repo-api']}
        detailData={[]}
        onDetailDataChange={onDetailDataChange}
      />
    );

    const input = screen.getByPlaceholderText('Ingrese detalle para repo-api');
    fireEvent.change(input, { target: { value: 'evidencia capturada' } });

    expect(onDetailDataChange).toHaveBeenCalledTimes(1);
    const payload = onDetailDataChange.mock.calls[0][0] as DetailItem[];
    expect(payload[0].sourceItem).toBe('repo-api');
    expect(payload[0].capturedText).toBe('evidencia capturada');
    expect(payload[0].addedAt).toBeTruthy();
  });

  it('shows max length error and does not emit when value exceeds maxLength', () => {
    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1', maxLength: 5 }}
        sourceItems={['repo-api']}
        detailData={[]}
        onDetailDataChange={onDetailDataChange}
      />
    );

    const input = screen.getByPlaceholderText('Ingrese detalle para repo-api');
    fireEvent.change(input, { target: { value: '123456' } });

    expect(screen.getByText(/Máximo 5 caracteres permitidos/i)).toBeInTheDocument();
    expect(onDetailDataChange).not.toHaveBeenCalled();
  });

  it('is read-only when disabled', () => {
    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1' }}
        sourceItems={['repo-api']}
        detailData={[]}
        onDetailDataChange={onDetailDataChange}
        disabled
      />
    );

    const input = screen.getByPlaceholderText('Ingrese detalle para repo-api');
    expect(input).toBeDisabled();
    fireEvent.change(input, { target: { value: 'blocked' } });
    expect(onDetailDataChange).not.toHaveBeenCalled();
  });

  it('shows completion status when all details are filled', () => {
    const detailData: DetailItem[] = [
      { sourceItem: 'repo-api', capturedText: 'ok', addedAt: new Date().toISOString() },
      { sourceItem: 'repo-web', capturedText: 'ok', addedAt: new Date().toISOString() },
    ];

    render(
      <DetailListInput
        config={{ sourceTaskId: 'task-1' }}
        sourceItems={['repo-api', 'repo-web']}
        detailData={detailData}
        onDetailDataChange={onDetailDataChange}
      />
    );

    expect(screen.getByText(/Todos los detalles completados/i)).toBeInTheDocument();
  });
});
