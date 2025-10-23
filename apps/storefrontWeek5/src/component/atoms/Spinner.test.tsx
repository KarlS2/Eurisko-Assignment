import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Spinner from './Spinner';

describe('Spinner', () => {
  // Test 1: Renders spinner element
  it('should render spinner', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toBeInTheDocument();
  });

  // Test 2: Has role="status" for accessibility
  it('should have role="status" for screen readers', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveAttribute('role', 'status');
  });

  // Test 3: Has aria-label
  it('should have aria-label for accessibility', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('[role="status"]');
    expect(spinner).toHaveAttribute('aria-label', 'Loading');
  });

  // Test 4: Contains sr-only text for screen readers
  it('should include sr-only loading text', () => {
    render(<Spinner />);
    const srOnly = screen.getByText('Loading...');
    expect(srOnly).toHaveClass('sr-only');
  });

  // Test 5: Default size (medium)
  it('should apply medium size classes by default', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-3');
  });

  // Test 6: Small size
  it('should apply small size classes', () => {
    const { container } = render(<Spinner size="sm" />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('w-4', 'h-4', 'border-2');
  });

  // Test 7: Medium size explicit
  it('should apply medium size classes when specified', () => {
    const { container } = render(<Spinner size="md" />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('w-8', 'h-8', 'border-3');
  });

  // Test 8: Large size
  it('should apply large size classes', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
  });

  // Test 9: Base spinner classes always applied
  it('should always include base spinner classes', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass(
      'inline-block',
      'rounded-full',
      'border-gray-300',
      'border-t-primary-600',
      'animate-spin'
    );
  });

  // Test 10: Custom className prop
  it('should accept and apply custom className', () => {
    const { container } = render(<Spinner className="custom-class" />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('custom-class');
  });

  // Test 11: Custom className with size
  it('should combine custom className with size classes', () => {
    const { container } = render(
      <Spinner size="lg" className="mt-4" />
    );
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4', 'mt-4');
  });

  // Test 12: Has animation classes
  it('should have animate-spin class for rotation', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('animate-spin');
  });

  // Test 13: Has border styling
  it('should have border styling', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('border-gray-300', 'border-t-primary-600');
  });

  // Test 14: Renders as div element
  it('should render as a div element', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner?.tagName).toBe('DIV');
  });

  // Test 15: Only contains sr-only span
  it('should only have sr-only span as child', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    const children = spinner?.children;
    expect(children).toHaveLength(1);
    expect(children?.[0]).toHaveClass('sr-only');
  });

  // Test 16: All size options are valid
  it('should render all size options', () => {
    const sizes = ['sm', 'md', 'lg'] as const;
    
    sizes.forEach((size) => {
      const { container } = render(<Spinner size={size} />);
      const spinner = container.querySelector('div[role="status"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  // Test 17: Is inline-block for flow with text
  it('should use inline-block display', () => {
    const { container } = render(<Spinner />);
    const spinner = container.querySelector('div[role="status"]');
    expect(spinner).toHaveClass('inline-block');
  });
});