import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SupportPanel from './SupportPanel';

// Mock the engine
vi.mock('../../assistant/engine', () => ({
  processQuery: vi.fn(async (query: string) => {
    if (query.includes('shipping')) {
      return {
        answer: 'Standard shipping takes 5-7 business days.',
        citation: 'Q02',
        confidence: 'high',
      };
    }
    return {
      answer: 'I can help you with that.',
      citation: 'Q01',
      confidence: 'medium',
    };
  }),
}));

describe('SupportPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <SupportPanel isOpen={false} onClose={vi.fn()} />
    );
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should display header with "Ask Support" title', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Ask Support')).toBeInTheDocument();
  });

  it('should call onClose when close button clicked', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={handleClose} />);

    const closeBtn = screen.getByLabelText('Close support panel');
    await user.click(closeBtn);

    expect(handleClose).toHaveBeenCalled();
  });

  it('should call onClose when Escape key pressed', async () => {
    const handleClose = vi.fn();
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={handleClose} />);

    await user.keyboard('{Escape}');

    expect(handleClose).toHaveBeenCalled();
  });

  it('should show welcome message when no messages', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('How can I help you?')).toBeInTheDocument();
    expect(
      screen.getByText(/Ask about shipping, returns, orders/i)
    ).toBeInTheDocument();
  });

  it('should allow typing in input', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...') as HTMLInputElement;
    await user.type(input, 'How long is shipping?');

    expect(input.value).toBe('How long is shipping?');
  });

  it('should disable send button when input is empty', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const button = screen.getByLabelText('Send question') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable send button when input has text', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'question');

    const button = screen.getByLabelText('Send question') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should add user message when submitted', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'How long is shipping?');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('How long is shipping?')).toBeInTheDocument();
    });
  });

  it('should clear input after submit', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(
      'Type your question...'
    ) as HTMLInputElement;
    await user.type(input, 'test question');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should display assistant response', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'How long is shipping?');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText('Standard shipping takes 5-7 business days.')
      ).toBeInTheDocument();
    });
  });

  it('should display citation with response', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'How long is shipping?');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Source: Q02/)).toBeInTheDocument();
    });
  });

  it('should display conversation history', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    // First question
    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'First question');

    let button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('First question')).toBeInTheDocument();
    });

    // Second question
    await user.type(input, 'Second question');
    button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Second question')).toBeInTheDocument();
    });
  });

  it('should have proper dialog ARIA attributes', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'support-panel-title');
  });

  it('should have aria-label on input', () => {
    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByLabelText('Support question input');
    expect(input).toBeInTheDocument();
  });

  it('should disable send button while loading', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText('Type your question...');
    await user.type(input, 'test');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    expect(button).toBeDisabled();
  });

    it('should disable input while loading', async () => {
    const user = userEvent.setup();

    render(<SupportPanel isOpen={true} onClose={vi.fn()} />);

    const input = screen.getByPlaceholderText(
        'Type your question...'
    ) as HTMLInputElement;
    await user.type(input, 'test');

    const button = screen.getByRole('button', { name: /send question/i });
    await user.click(button);

    await waitFor(() => {
        expect(input.disabled).toBe(true);
    });
    });
});