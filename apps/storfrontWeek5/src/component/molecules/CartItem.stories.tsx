import type { Meta, StoryObj } from '@storybook/react';
import { BrowserRouter } from 'react-router-dom';
import CartItem from './CartItem';
import { CartItem as CartItemType } from '../../lib/store';

const meta: Meta<typeof CartItem> = {
  title: 'molecules/CartItem',
  component: CartItem,
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-full max-w-2xl bg-white">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CartItem>;

// Mock product data
const mockProduct = {
  id: 'PROD-001',
  title: 'Premium Wireless Headphones',
  price: 149.99,
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&h=200&fit=crop',
  tags: ['audio', 'electronics'],
  stockQty: 10,
  description: 'High-quality wireless headphones with noise cancellation',
};

// Default story - single item in cart
export const Default: Story = {
  args: {
    item: {
      product: mockProduct,
      quantity: 1,
    } as CartItemType,
    onUpdateQuantity: (id, qty) => console.log(`Update ${id} to qty: ${qty}`),
    onRemove: (id) => console.log(`Remove ${id}`),
  },
};

// Multiple quantity
export const MultipleQuantity: Story = {
  args: {
    item: {
      product: mockProduct,
      quantity: 3,
    } as CartItemType,
    onUpdateQuantity: (id, qty) => console.log(`Update ${id} to qty: ${qty}`),
    onRemove: (id) => console.log(`Remove ${id}`),
  },
};

// Max quantity (at stock limit)
export const MaxQuantity: Story = {
  args: {
    item: {
      product: mockProduct,
      quantity: 10,
    } as CartItemType,
    onUpdateQuantity: (id, qty) => console.log(`Update ${id} to qty: ${qty}`),
    onRemove: (id) => console.log(`Remove ${id}`),
  },
};

// Different product - budget item
export const BudgetProduct: Story = {
  args: {
    item: {
      product: {
        ...mockProduct,
        id: 'PROD-002',
        title: 'USB-C Cable',
        price: 9.99,
        image: 'https://images.unsplash.com/photo-1625948515291-69613efd103f?w=200&h=200&fit=crop',
      },
      quantity: 2,
    } as CartItemType,
    onUpdateQuantity: (id, qty) => console.log(`Update ${id} to qty: ${qty}`),
    onRemove: (id) => console.log(`Remove ${id}`),
  },
};

// Long product title
export const LongTitle: Story = {
  args: {
    item: {
      product: {
        ...mockProduct,
        title: 'Ultra Premium Professional Grade Wireless Noise Cancelling Over-Ear Headphones with Extended Battery Life and Advanced Sound Engineering',
      },
      quantity: 1,
    } as CartItemType,
    onUpdateQuantity: (id, qty) => console.log(`Update ${id} to qty: ${qty}`),
    onRemove: (id) => console.log(`Remove ${id}`),
  },
};