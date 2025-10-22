import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import ProductCard from './ProductCard';
import { Product } from '../../lib/api';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ProductCard', () => {
  const mockProduct: Product = {
    id: 'PROD-001',
    title: 'Premium Wireless Headphones',
    price: 99.99,
    image: 'https://example.com/image.jpg',
    tags: ['audio', 'electronics'],
    stockQty: 15,
    description: 'High-quality wireless headphones',
  };

  it('should render product title and price', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('Premium Wireless Headphones')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should render product image with correct alt text', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const img = screen.getByAltText('Premium Wireless Headphones') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('example.com/image.jpg');
  });

  it('should have lazy loading on image', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const img = screen.getByAltText('Premium Wireless Headphones') as HTMLImageElement;
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('should render up to 2 tags', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('audio')).toBeInTheDocument();
    expect(screen.getByText('electronics')).toBeInTheDocument();
  });

  it('should only show first 2 tags when more than 2 exist', () => {
    const productWithManyTags: Product = {
      ...mockProduct,
      tags: ['tag1', 'tag2', 'tag3', 'tag4'],
    };

    renderWithRouter(
      <ProductCard product={productWithManyTags} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.queryByText('tag3')).not.toBeInTheDocument();
  });

  it('should call onAddToCart when button clicked', async () => {
    const handleAddToCart = vi.fn();
    const user = userEvent.setup();

    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={handleAddToCart} />
    );

    const button = screen.getByRole('button', { name: /add premium wireless headphones to cart/i });
    await user.click(button);

    expect(handleAddToCart).toHaveBeenCalledWith(mockProduct);
  });

  it('should show "Low stock" badge when stockQty < 10', () => {
    const lowStockProduct: Product = {
      ...mockProduct,
      stockQty: 5,
    };

    renderWithRouter(
      <ProductCard product={lowStockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });

  it('should not show "Low stock" badge when stockQty >= 10', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });

  it('should show "Out of stock" badge when stockQty === 0', () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      stockQty: 0,
    };

    renderWithRouter(
      <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
  });

  it('should disable "Add to Cart" button when out of stock', () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      stockQty: 0,
    };

    renderWithRouter(
      <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
    );

    const button = screen.getByRole('button', { name: /add premium wireless headphones to cart/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('should enable "Add to Cart" button when in stock', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const button = screen.getByRole('button', { name: /add premium wireless headphones to cart/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('should have links to product detail page', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const links = screen.getAllByRole('link');
    expect(links.some(link => link.getAttribute('href') === '/p/PROD-001')).toBe(true);
  });

  it('should have aria-label on add to cart button', () => {
    renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const button = screen.getByRole('button', { name: /add premium wireless headphones to cart/i });
    expect(button).toBeInTheDocument();
  });

  it('should have card container with proper styling classes', () => {
    const { container } = renderWithRouter(
      <ProductCard product={mockProduct} onAddToCart={vi.fn()} />
    );

    const card = container.querySelector('.group');
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'border');
  });

  it('should show out of stock badge but not low stock badge', () => {
    const outOfStockProduct: Product = {
      ...mockProduct,
      stockQty: 0,
    };

    renderWithRouter(
      <ProductCard product={outOfStockProduct} onAddToCart={vi.fn()} />
    );

    expect(screen.getByText('Out of stock')).toBeInTheDocument();
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });
});