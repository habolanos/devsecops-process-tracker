import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import GlobalProgressIndicator from '@/components/global-progress-indicator';
import { useLoadingStore } from '@/lib/loading-store';

describe('GlobalProgressIndicator', () => {
  beforeEach(() => {
    // Reset store before each test
    useLoadingStore.setState({
      activeOperations: new Set<string>(),
      isLoading: false,
    });
  });

  it('should not render when isLoading is false', () => {
    const { container } = render(<GlobalProgressIndicator />);
    
    expect(container.firstChild).toBeNull();
  });

  it('should render progress bar when isLoading is true', () => {
    useLoadingStore.setState({ isLoading: true });
    
    const { container } = render(<GlobalProgressIndicator />);
    
    expect(container.firstChild).not.toBeNull();
    expect(container.querySelector('.bg-blue-500')).toBeInTheDocument();
  });

  it('should have correct CSS classes for GitHub-style progress', () => {
    useLoadingStore.setState({ isLoading: true });
    
    const { container } = render(<GlobalProgressIndicator />);
    
    const progressBar = container.querySelector('.bg-blue-500');
    
    expect(progressBar).toHaveClass('h-1');
    expect(progressBar).toHaveClass('fixed');
    expect(progressBar).toHaveClass('top-0');
    expect(progressBar).toHaveClass('left-0');
    expect(progressBar).toHaveClass('right-0');
    expect(progressBar).toHaveClass('z-[9999]');
  });

  it('should have pointer-events-none to not block interactions', () => {
    useLoadingStore.setState({ isLoading: true });
    
    const { container } = render(<GlobalProgressIndicator />);
    
    const progressBar = container.querySelector('.bg-blue-500');
    expect(progressBar).toHaveClass('pointer-events-none');
  });
});
