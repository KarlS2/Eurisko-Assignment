import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import Header from './Header';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  args: {
    onOpenSupport: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

export const EmptyCart: Story = {
  args: {},
};

export const WithItems: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: 'Note: Cart badge count comes from Zustand store. In Storybook, it will show 0 unless you add items to the store.',
      },
    },
  },
};