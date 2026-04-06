import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
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
    expect(container.querySelector('.bg-blue-400')).toBeInTheDocument();
  });

  it('should have correct CSS classes for GitHub-style progress', () => {
    useLoadingStore.setState({ isLoading: true });
    
    const { container } = render(<GlobalProgressIndicator />);
    
    const containerDiv = container.querySelector('.fixed');
    
    expect(containerDiv).toHaveClass('h-0.5');
    expect(containerDiv).toHaveClass('fixed');
    expect(containerDiv).toHaveClass('top-0');
    expect(containerDiv).toHaveClass('left-0');
    expect(containerDiv).toHaveClass('right-0');
    expect(containerDiv).toHaveClass('z-[9999]');
  });

  it('should have pointer-events-none to not block interactions', () => {
    useLoadingStore.setState({ isLoading: true });
    
    const { container } = render(<GlobalProgressIndicator />);
    
    const containerDiv = container.querySelector('.fixed');
    expect(containerDiv).toHaveClass('pointer-events-none');
  });
});
