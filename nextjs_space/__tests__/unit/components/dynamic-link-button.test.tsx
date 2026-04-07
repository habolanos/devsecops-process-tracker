import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DynamicLinkButton, { DynamicLinksList } from '@/app/process/_components/dynamic-link-button';

let mockProcess: { capturedVariables: Record<string, string> } | null = null;

vi.mock('@/lib/store', () => ({
  useProcessStore: vi.fn((selector) => {
    const state = { process: mockProcess };
    return selector ? selector(state) : state;
  }),
}));

describe('DynamicLinkButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
    mockProcess = {
      capturedVariables: {
        rfc: 'RFC123',
        app: 'tracker',
      },
    };
  });

  it('renders disabled lock button when variables are unresolved', () => {
    render(
      <DynamicLinkButton
        link={{
          label: 'Deploy',
          urlTemplate: 'https://example.com/{missingVar}',
          behavior: 'click',
        }}
      />
    );

    const btn = screen.getByRole('button', { name: /Deploy/i });
    expect(btn).toBeDisabled();
  });

  it('renders disabled lock button when required variable is missing', () => {
    render(
      <DynamicLinkButton
        link={{
          label: 'Deploy',
          urlTemplate: 'https://example.com/static',
          behavior: 'click',
          requiresVariables: ['missingVar'],
        }}
      />
    );

    const btn = screen.getByRole('button', { name: /Deploy/i });
    expect(btn).toBeDisabled();
  });

  it('renders active anchor for click behavior with interpolated URL', () => {
    render(
      <DynamicLinkButton
        link={{
          label: 'Open App',
          urlTemplate: 'https://example.com/{app}/{rfc}',
          behavior: 'click',
          newTab: true,
        }}
      />
    );

    const link = screen.getByRole('link', { name: /Open App/i });
    expect(link).toHaveAttribute('href', 'https://example.com/tracker/RFC123');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('auto-opens link for auto behavior after delay', () => {
    vi.useFakeTimers();

    render(
      <DynamicLinkButton
        link={{
          label: 'Auto Open',
          urlTemplate: 'https://example.com/{app}',
          behavior: 'auto',
          delay: 1,
          newTab: false,
        }}
      />
    );

    vi.advanceTimersByTime(1000);
    expect(window.open).toHaveBeenCalledWith('https://example.com/tracker', '_self');
  });

  it('opens link on click for auto behavior', () => {
    render(
      <DynamicLinkButton
        link={{
          label: 'Manual Auto',
          urlTemplate: 'https://example.com/{app}',
          behavior: 'auto',
          newTab: true,
        }}
      />
    );

    const btn = screen.getByRole('button', { name: /Manual Auto/i });
    fireEvent.click(btn);

    expect(window.open).toHaveBeenCalledWith('https://example.com/tracker', '_blank');
  });
});

describe('DynamicLinksList', () => {
  it('returns null when no links', () => {
    const { container } = render(<DynamicLinksList links={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders dynamic links section and items', () => {
    render(
      <DynamicLinksList
        links={[
          {
            label: 'Docs',
            urlTemplate: 'https://example.com/{app}',
            behavior: 'click',
          },
        ]}
      />
    );

    expect(screen.getByText('Links Dinámicos')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Docs/i })).toBeInTheDocument();
  });
});
