import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CartItem from './CartItem';
import { CartItem as CartItemType } from '../../lib/store';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('CartItem', () => {
  const mockProduct = {
    id: 'PROD-001',
    title: 'Test Product',
    price: 99.99,
    image: 'https://example.com/image.jpg',
    tags: ['test'],
    stockQty: 10,
    description: 'A test product',
  };

  const mockCartItem: CartItemType = {
    product: mockProduct,
    quantity: 2,
  };

  it('should render product title and price', () => {
    const mockHandlers = {
      onUpdateQuantity: vi.fn(),
      onRemove: vi.fn(),
    };

    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={mockHandlers.onUpdateQuantity}
        onRemove={mockHandlers.onRemove}
      />
    );

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText(/\$99.99/)).toBeInTheDocument();
  });

  it('should display the current quantity', () => {
    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // Quantity is in a span, not an input
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should calculate and display subtotal', () => {
    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    // 99.99 * 2 = 199.98
    expect(screen.getByText('$199.98')).toBeInTheDocument();
  });

  it('should call onUpdateQuantity when increase button is clicked', async () => {
    const handleUpdateQuantity = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={vi.fn()}
      />
    );

    const increaseBtn = screen.getByLabelText('Increase quantity');
    await user.click(increaseBtn);

    expect(handleUpdateQuantity).toHaveBeenCalledWith('PROD-001', 3);
  });

  it('should call onUpdateQuantity when decrease button is clicked', async () => {
    const handleUpdateQuantity = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={vi.fn()}
      />
    );

    const decreaseBtn = screen.getByLabelText('Decrease quantity');
    await user.click(decreaseBtn);

    expect(handleUpdateQuantity).toHaveBeenCalledWith('PROD-001', 1);
  });

  it('should call onRemove when remove button is clicked', async () => {
    const handleRemove = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={handleRemove}
      />
    );

    const removeBtn = screen.getByRole('button', { name: /remove test product/i });
    await user.click(removeBtn);

    expect(handleRemove).toHaveBeenCalledWith('PROD-001');
  });

  it('should disable decrease button when quantity is 1', () => {
    renderWithRouter(
      <CartItem
        item={{ ...mockCartItem, quantity: 1 }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const decreaseBtn = screen.getByLabelText('Decrease quantity') as HTMLButtonElement;
    expect(decreaseBtn.disabled).toBe(true);
  });

  it('should disable increase button when at max stock quantity', () => {
    renderWithRouter(
      <CartItem
        item={{ ...mockCartItem, quantity: 10 }}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const increaseBtn = screen.getByLabelText('Increase quantity') as HTMLButtonElement;
    expect(increaseBtn.disabled).toBe(true);
  });

  it('should render product image with correct alt text', () => {
    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const img = screen.getByAltText('Test Product') as HTMLImageElement;
    expect(img.src).toContain('example.com/image.jpg');
  });

  it('should link to product detail page', () => {
    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const links = screen.getAllByRole('link');
    const productLink = links.find(link => link.getAttribute('href') === '/p/PROD-001');
    expect(productLink).toBeInTheDocument();
  });

  it('should have proper aria labels for accessibility', () => {
    renderWithRouter(
      <CartItem
        item={mockCartItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Increase quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Decrease quantity')).toBeInTheDocument();
    expect(screen.getByLabelText(/remove test product/i)).toBeInTheDocument();
  });
});