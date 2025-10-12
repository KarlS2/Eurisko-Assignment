import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  it('should render search input and button', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('searchbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit search/i })).toBeInTheDocument();
  });

  it('should show default placeholder text', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input).toHaveAttribute('placeholder', 'Search products...');
  });

  it('should accept custom placeholder text', () => {
    render(
      <SearchBar onSearch={vi.fn()} placeholder="Find items..." />
    );

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input).toHaveAttribute('placeholder', 'Find items...');
  });

  it('should have input type="search"', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    expect(input.type).toBe('search');
  });

  it('should allow user to type in search input', async () => {
    const user = userEvent.setup();
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    await user.type(input, 'wireless headphones');

    expect(input.value).toBe('wireless headphones');
  });

  it('should call onSearch when form is submitted', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'laptop');

    const button = screen.getByRole('button', { name: /submit search/i });
    await user.click(button);

    expect(handleSearch).toHaveBeenCalledWith('laptop');
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  it('should call onSearch when Enter key is pressed', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'mouse{Enter}');

    expect(handleSearch).toHaveBeenCalledWith('mouse');
  });

  it('should allow submitting empty search', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const button = screen.getByRole('button', { name: /submit search/i });
    await user.click(button);

    expect(handleSearch).toHaveBeenCalledWith('');
  });

  it('should have aria-label on search input', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const input = screen.getByLabelText('Search products');
    expect(input).toBeInTheDocument();
  });

  it('should have aria-label on submit button', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    const button = screen.getByLabelText('Submit search');
    expect(button).toBeInTheDocument();
  });

  it('should handle multiple searches in sequence', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByRole('searchbox') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /submit search/i });

    // First search
    await user.type(input, 'first');
    await user.click(button);
    expect(handleSearch).toHaveBeenCalledWith('first');

    // Clear and second search
    await user.clear(input);
    await user.type(input, 'second');
    await user.click(button);
    expect(handleSearch).toHaveBeenCalledWith('second');
    expect(handleSearch).toHaveBeenCalledTimes(2);
  });

  it('should render as a form element', () => {
    const { container } = render(<SearchBar onSearch={vi.fn()} />);

    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('should handle special characters in search', async () => {
    const handleSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={handleSearch} />);

    const input = screen.getByRole('searchbox');
    await user.type(input, 'test@#$%');

    const button = screen.getByRole('button', { name: /submit search/i });
    await user.click(button);

    expect(handleSearch).toHaveBeenCalledWith('test@#$%');
  });
});