import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies primary variant styles by default', () => {
    render(<Button>Button</Button>);
    const button = screen.getByText('Button');
    expect(button).toHaveClass('bg-primary-600');
  });

  it('applies secondary variant styles when specified', () => {
    render(<Button variant="secondary">Button</Button>);
    const button = screen.getByText('Button');
    expect(button).toHaveClass('bg-gray-200');
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Button</Button>);
    expect(screen.getByText('Button')).toBeDisabled();
  });

  it('does not call onClick when disabled', async () => {
    const handleClick = vi.fn();
    render(<Button disabled onClick={handleClick}>Button</Button>);
    
    await userEvent.click(screen.getByText('Button'));
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('applies fullWidth class when specified', () => {
    render(<Button fullWidth>Button</Button>);
    expect(screen.getByText('Button')).toHaveClass('w-full');
  });
});