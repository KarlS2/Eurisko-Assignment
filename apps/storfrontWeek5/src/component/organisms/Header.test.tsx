import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Header from './Header';
import { useCartStore } from '../../lib/store';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

vi.mock('../../lib/store', () => ({
  useCartStore: vi.fn(),
}));

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render logo and site title', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    expect(screen.getByText('Karl Storefront')).toBeInTheDocument();
  });

  it('should have home link on logo', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const link = screen.getByRole('link', { name: /storefront/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should render Catalog navigation link', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const link = screen.getByRole('link', { name: /catalog/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('should render Cart navigation link', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const link = screen.getByRole('link', { name: /cart/i });
    expect(link).toHaveAttribute('href', '/cart');
  });

  it('should render Ask Support button', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const button = screen.getByLabelText('Open support panel');
    expect(button).toBeInTheDocument();
  });

  it('should call onOpenSupport when Ask Support clicked', async () => {
    const handleOpenSupport = vi.fn();
    const user = userEvent.setup();

    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={handleOpenSupport} />);

    const button = screen.getByLabelText('Open support panel');
    await user.click(button);

    expect(handleOpenSupport).toHaveBeenCalled();
  });

  it('should not show cart badge when cart is empty', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const badges = container.querySelectorAll('span');
    const cartBadges = Array.from(badges).filter(b => b.textContent === '0');
    expect(cartBadges).toHaveLength(0);
  });

  it('should show cart badge with item count', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 3, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should have aria-label with item count on cart link', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 5, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const link = screen.getByLabelText(/cart with 5 items/i);
    expect(link).toBeInTheDocument();
  });

  it('should use danger variant for cart badge', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 2, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const badge = container.querySelector('span[class*="bg-red"]');
    expect(badge).toBeInTheDocument();
  });

  it('should have sticky positioning', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('sticky', 'top-0');
  });

  it('should have z-index for layering', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('z-40');
  });

  it('should have navigation element', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('should render all navigation links', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThanOrEqual(3);
  });

  it('should have border styling', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('border-b', 'border-gray-200');
  });

  it('should have shadow styling', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    const { container } = renderWithRouter(
      <Header onOpenSupport={vi.fn()} />
    );

    const header = container.querySelector('header');
    expect(header).toHaveClass('shadow-sm');
  });

  it('should have aria-label on Ask Support button', () => {
    (useCartStore as any).mockImplementation((selector:any) => selector({ getItemCount: () => 0, items: [] }));

    renderWithRouter(<Header onOpenSupport={vi.fn()} />);

    const button = screen.getByLabelText('Open support panel');
    expect(button).toBeInTheDocument();
  });
});