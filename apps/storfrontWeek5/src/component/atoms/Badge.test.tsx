import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  // Test 1: Renders with text
  it('should render badge with children text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  // Test 2: Default variant styling
  it('should apply default variant classes', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-gray-100', 'text-gray-800');
  });

  // Test 3: Success variant
  it('should apply success variant classes', () => {
    const { container } = render(<Badge variant="success">Success</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800');
  });

  // Test 4: Warning variant
  it('should apply warning variant classes', () => {
    const { container } = render(<Badge variant="warning">Warning</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  // Test 5: Danger variant
  it('should apply danger variant classes', () => {
    const { container } = render(<Badge variant="danger">Error</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-red-100', 'text-red-800');
  });

  // Test 6: Info variant
  it('should apply info variant classes', () => {
    const { container } = render(<Badge variant="info">Info</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800');
  });

  // Test 7: Small size
  it('should apply small size classes', () => {
    const { container } = render(<Badge size="sm">Small</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
  });

  // Test 8: Medium size (default)
  it('should apply medium size classes by default', () => {
    const { container } = render(<Badge>Medium</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });

  // Test 9: Medium size explicit
  it('should apply medium size classes when specified', () => {
    const { container } = render(<Badge size="md">Medium</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('px-2.5', 'py-1', 'text-sm');
  });

  // Test 10: Base badge classes always applied
  it('should always include base badge classes', () => {
    const { container } = render(<Badge>Base</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('inline-flex', 'items-center', 'font-medium', 'rounded-full');
  });

  // Test 11: Combination of variant and size
  it('should combine variant and size classes correctly', () => {
    const { container } = render(
      <Badge variant="success" size="sm">
        Success Badge
      </Badge>
    );
    const badge = container.querySelector('span');
    expect(badge).toHaveClass('bg-green-100', 'text-green-800', 'px-2', 'py-0.5', 'text-xs');
  });

  // Test 12: Renders with complex children
  it('should render with JSX children', () => {
    render(
      <Badge>
        <span>Icon</span> Label
      </Badge>
    );
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Label')).toBeInTheDocument();
  });

  // Test 13: Renders as span element
  it('should render as a span element', () => {
    const { container } = render(<Badge>Badge</Badge>);
    const span = container.querySelector('span');
    expect(span).toBeInTheDocument();
    expect(span?.tagName).toBe('SPAN');
  });

  // Test 14: Props don't break with empty children
  it('should handle empty string children', () => {
    const { container } = render(<Badge>""</Badge>);
    const badge = container.querySelector('span');
    expect(badge).toBeInTheDocument();
  });

  // Test 15: All variant options are valid
  it('should render all variant options', () => {
    const variants = ['default', 'success', 'warning', 'danger', 'info'] as const;
    
    variants.forEach((variant) => {
      const { container } = render(
        <Badge variant={variant}>{variant}</Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });
  });
});