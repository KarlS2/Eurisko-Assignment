import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import ProductCard from './ProductCard';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof ProductCard> = {
  title: 'Molecules/ProductCard',
  component: ProductCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div style={{ width: '300px' }}>
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
  args: {
    onAddToCart: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof ProductCard>;

export const Default: Story = {
  args: {
    product: {
      id: 'prod_001',
      title: 'Wireless Bluetooth Headphones',
      price: 79.99,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      tags: ['audio', 'wireless'],
      stockQty: 45,
      description: 'Premium wireless headphones with active noise cancellation.',
    },
  },
};

export const LowStock: Story = {
  args: {
    product: {
      id: 'prod_002',
      title: 'Lenovo ThinkPad X1 Carbon Gen 11',
      price: 1799.99,
      image: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400',
      tags: ["laptops", "business", "lenovo", "professional"],
      stockQty: 5,
      description: 'Ultra-light business laptop with Intel i7, 14\" 2.8K display, and military-grade durability.',
    },
  },
};

export const OutOfStock: Story = {
  args: {
    product: {
      id: 'prod_003',
      title: 'Apple Watch Series 9',
      price: 399.99,
      image: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=400',
      tags: ["wearables", "smartwatch", "apple", "fitness"],
      stockQty: 0,
      description: 'Most advanced Apple Watch with double tap gesture, all-day battery, and health sensors.',
    },
  },
};