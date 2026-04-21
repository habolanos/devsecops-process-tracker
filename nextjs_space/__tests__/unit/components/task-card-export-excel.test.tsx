import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaskCard from '@/app/process/_components/task-card';
import { TaskState } from '@/lib/types';

// Mock the stores and utilities
const mockProcessState = {
  process: {
    id: 'test-process',
    name: 'Test Process',
    capturedVariables: { rfc: 'RFC123', notaInstalacion: 'NOTA456' },
    phases: [
      {
        id: 'phase-1',
        tasks: [],
        activities: [],
      },
    ],
  },
  completeTask: vi.fn(),
  uncompleteTask: vi.fn(),
  toggleCheckItem: vi.fn(),
  canCompleteCheckTask: vi.fn().mockReturnValue(true)
};

vi.mock('@/lib/store', () => {
  const mockedUseProcessStore = vi.fn((selector) => {
    return selector ? selector(mockProcessState) : mockProcessState;
  });
  Object.assign(mockedUseProcessStore, {
    getState: () => mockProcessState,
  });

  return {
    useProcessStore: mockedUseProcessStore,
  };
});

vi.mock('@/lib/i18n-context', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    language: 'es'
  })
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock Excel generator (legacy + v2.1.0 declarative API)
vi.mock('@/lib/excel-generator', () => ({
  generateReleaseExcel: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/xlsx' })),
  processToReleaseReport: vi.fn().mockReturnValue({}),
  downloadExcel: vi.fn(),
  generateReleaseFilename: vi.fn().mockReturnValue('test-report.xlsx'),
  // Declarative engine (process.export) — null plan forces fallback to the legacy path.
  resolveExportPlan: vi.fn().mockReturnValue(null),
  executeExportPlan: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/xlsx' })),
  buildExportFilename: vi.fn().mockReturnValue('test-report.xlsx'),
}));

describe('TaskCard - Export Excel Type', () => {
  const mockOnViewEvidence = vi.fn();

  const createExportExcelTask = (overrides = {}): TaskState => ({
    id: 'task-export-excel',
    name: 'Generar Reporte Excel',
    description: 'Genera automáticamente el checklist de liberación',
    order: 1,
    type: 'export-excel',
    checkItems: [],
    references: [],
    evidenceConfig: { type: 'text', required: false },
    dependencies: [],
    completed: false,
    evidence: { text: '', images: [] },
    isBlocked: false,
    dynamicLinks: [],
    exportConfig: {
      templatePath: '/templates/TEMPLATE_Checklist_Liberacion.xlsx',
      outputFilename: 'Checklist_{fecha}_{rfc}',
      autoDownload: true
    },
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render export-excel task with Excel badge', () => {
    const task = createExportExcelTask();
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('Generar Reporte Excel')).toBeInTheDocument();
    expect(screen.getByText('Excel')).toBeInTheDocument();
  });

  it('should show pending status for incomplete export-excel task', () => {
    const task = createExportExcelTask({ completed: false });
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('task.pending')).toBeInTheDocument();
  });

  it('should show completed status after task completion', () => {
    const task = createExportExcelTask({ 
      completed: true,
      completedAt: '2026-04-06T17:00:00Z'
    });
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('task.completed')).toBeInTheDocument();
  });

  it('should trigger Excel generation when completing task', async () => {
    const { generateReleaseExcel, downloadExcel } = await import('@/lib/excel-generator');
    const task = createExportExcelTask();
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    const checkbox = screen.getByTestId('task-checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(generateReleaseExcel).toHaveBeenCalled();
      expect(downloadExcel).toHaveBeenCalled();
    });
  });

  it('should show error toast when Excel generation fails', async () => {
    const { generateReleaseExcel } = await import('@/lib/excel-generator');
    const { toast } = await import('sonner');
    
    vi.mocked(generateReleaseExcel).mockRejectedValueOnce(new Error('Generation failed'));
    
    const task = createExportExcelTask();
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    const checkbox = screen.getByTestId('task-checkbox');
    fireEvent.click(checkbox);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Error al generar el reporte Excel',
        { description: 'Generation failed' }
      );
    });
  });

  it('should be blocked when dependencies are not met', () => {
    const task = createExportExcelTask({ isBlocked: true });
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('task.blocked')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('should not allow completion when blocked', () => {
    const task = createExportExcelTask({ isBlocked: true });
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    const checkbox = screen.getByTestId('task-checkbox');
    expect(checkbox).toBeDisabled();
  });

  it('should render with exportConfig from task', () => {
    const task = createExportExcelTask({
      exportConfig: {
        templatePath: '/custom/template.xlsx',
        outputFilename: 'CustomReport_{rfc}',
        autoDownload: true
      }
    });
    
    render(
      <TaskCard
        task={task}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('Generar Reporte Excel')).toBeInTheDocument();
  });
});

describe('TaskCard - Standard vs Export Excel comparison', () => {
  const mockOnViewEvidence = vi.fn();

  it('should render standard task without Excel badge', () => {
    const standardTask: TaskState = {
      id: 'task-standard',
      name: 'Standard Task',
      description: 'A regular task',
      order: 1,
      type: 'standard',
      checkItems: [],
      references: [],
      evidenceConfig: { type: 'text', required: false },
      dependencies: [],
      completed: false,
      evidence: { text: '', images: [] },
      isBlocked: false,
      dynamicLinks: []
    };
    
    render(
      <TaskCard
        task={standardTask}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('Standard Task')).toBeInTheDocument();
    expect(screen.queryByText('Excel')).not.toBeInTheDocument();
  });

  it('should render check task with check badge', () => {
    const checkTask: TaskState = {
      id: 'task-check',
      name: 'Check Task',
      description: 'A check task',
      order: 1,
      type: 'check',
      checkItems: [
        { id: 'check-1', description: 'Check item', required: true, checked: false }
      ],
      references: [],
      evidenceConfig: { type: 'text', required: false },
      dependencies: [],
      completed: false,
      evidence: { text: '', images: [] },
      isBlocked: false,
      dynamicLinks: []
    };
    
    render(
      <TaskCard
        task={checkTask}
        phaseId="phase-1"
        onViewEvidence={mockOnViewEvidence}
      />
    );

    expect(screen.getByText('Check Task')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument(); // Check items count
    expect(screen.queryByText('Excel')).not.toBeInTheDocument();
  });
});
