import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompletionAlertDialog } from '@/app/process/_components/completion-alert-dialog';
import type { CompletionAlertConfig } from '@/lib/types';

vi.mock('@/lib/i18n-context', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const map: Record<string, string> = {
        'alert.completion.defaultTitle': 'Confirmar completación',
        'common.confirm': 'Confirmar',
        'common.cancel': 'Cancelar',
      };
      return map[key] ?? key;
    },
    language: 'es',
  }),
}));

vi.mock('@/lib/alert-feedback', () => ({
  getSeverityStyles: (severity: string) => {
    const styles: Record<string, Record<string, string>> = {
      info: {
        iconClass: 'text-blue-500',
        containerClass: 'border-blue-200 bg-blue-50/50',
        confirmButtonClass: 'bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium',
        cancelButtonClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium',
        flashAnimationClass: '',
        ariaLabel: 'Confirmación informativa',
      },
      warning: {
        iconClass: 'text-amber-500',
        containerClass: 'border-amber-300 border-2 bg-amber-50/60',
        confirmButtonClass: 'bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium',
        cancelButtonClass: 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-md font-medium',
        flashAnimationClass: 'animate-pulse-once',
        ariaLabel: 'Advertencia de confirmación',
      },
      critical: {
        iconClass: 'text-red-600',
        containerClass: 'border-red-500 border-2 bg-red-50',
        confirmButtonClass: 'bg-green-500 text-white hover:bg-green-600 px-4 py-2 rounded-lg text-sm font-medium',
        cancelButtonClass: 'bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-md font-medium',
        flashAnimationClass: 'animate-pulse-strong',
        ariaLabel: 'Acción crítica: confirmación requerida',
      },
    };
    const result = styles[severity] ?? styles['info'];
    return {
      Icon: () => <svg data-testid={`mock-icon-${severity}`} />,
      ...result,
      ariaRole: 'alertdialog',
    };
  },
  useReducedMotion: () => false,
}));

describe('CompletionAlertDialog', () => {
  const mockOnOpenChange = vi.fn();
  const mockOnConfirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const baseAlert: CompletionAlertConfig = {
    severity: 'critical',
    title: '¿Estás seguro?',
    description: 'Esta acción no se puede deshacer.',
    confirmLabel: 'Sí, lo tengo',
    cancelLabel: 'Cancelar',
  };

  it('renders the dialog when open', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('completion-alert-dialog')).toBeInTheDocument();
    expect(screen.getByText('¿Estás seguro?')).toBeInTheDocument();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeInTheDocument();
  });

  it('does not render dialog content when closed', () => {
    render(
      <CompletionAlertDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.queryByTestId('completion-alert-dialog')).not.toBeInTheDocument();
  });

  it('uses custom confirm and cancel labels', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('completion-alert-confirm')).toHaveTextContent('Sí, lo tengo');
    expect(screen.getByTestId('completion-alert-cancel')).toHaveTextContent('Cancelar');
  });

  it('falls back to default labels when not provided', () => {
    const alertNoLabels: CompletionAlertConfig = {
      severity: 'info',
      description: 'Please confirm.',
    };

    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={alertNoLabels}
        taskName="My Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('completion-alert-confirm')).toHaveTextContent('Confirmar');
    expect(screen.getByTestId('completion-alert-cancel')).toHaveTextContent('Cancelar');
  });

  it('uses default title with task name when title is omitted', () => {
    const alertNoTitle: CompletionAlertConfig = {
      severity: 'info',
      description: 'Please confirm.',
    };

    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={alertNoTitle}
        taskName="My Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByText('Confirmar completación: My Task')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    fireEvent.click(screen.getByTestId('completion-alert-confirm'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('sets data-severity attribute on the dialog content', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    expect(screen.getByTestId('completion-alert-dialog')).toHaveAttribute('data-severity', 'critical');
  });

  it('applies severity container classes to the dialog content', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    const dialog = screen.getByTestId('completion-alert-dialog');
    expect(dialog.className).toContain('border-red-500');
    expect(dialog.className).toContain('bg-red-50');
  });

  it('applies severity confirm button classes', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    const confirmBtn = screen.getByTestId('completion-alert-confirm');
    expect(confirmBtn.className).toContain('bg-green-500');
    expect(confirmBtn.className).toContain('text-white');
  });

  it('applies severity cancel button classes', () => {
    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={baseAlert}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    const cancelBtn = screen.getByTestId('completion-alert-cancel');
    expect(cancelBtn.className).toContain('bg-gray-200');
    expect(cancelBtn.className).toContain('text-gray-700');
  });

  it('renders description with whitespace-pre-line support', () => {
    const alertWithNewlines: CompletionAlertConfig = {
      severity: 'critical',
      description: 'Line 1\nLine 2\nLine 3',
    };

    render(
      <CompletionAlertDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        alert={alertWithNewlines}
        taskName="Test Task"
        onConfirm={mockOnConfirm}
      />
    );

    // The description element contains the text with preserved newlines
    const desc = screen.getByText(/Line 1.*Line 2.*Line 3/s);
    expect(desc).toBeInTheDocument();
    expect(desc.className).toContain('whitespace-pre-line');
  });
});
