import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import SupportPanel from './SupportPanel';

const meta: Meta<typeof SupportPanel> = {
  title: 'organisms/SupportPanel',
  component: SupportPanel,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls whether the support panel is visible',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback fired when the panel is closed',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SupportPanel>;

// Wrapper component to manage state for interactive stories
function SupportPanelWithState(args: any) {
  const [isOpen, setIsOpen] = useState(args.isOpen);
  
  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg"
      >
        Open Support Panel
      </button>
      <SupportPanel
        {...args}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

// Closed state
export const Closed: Story = {
  args: {
    isOpen: false,
    onClose: () => {},
  },
};

// Open and empty
export const Open: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  render: (args) => <SupportPanelWithState {...args} />,
};

// With conversation history
export const WithConversation: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Open Support Panel
        </button>
        <SupportPanel
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
  decorators: [
    (Story) => {
      // Simulate pre-loaded messages by injecting into localStorage
      // Note: In real testing, you'd mock the processQuery function
      return <Story />;
    },
  ],
};

// Interactive - allows user to send queries and see responses
export const Interactive: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div>
        <div className="p-4 bg-gray-50 rounded-lg mb-4">
          <h3 className="font-bold text-gray-900 mb-2">Try asking:</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• "How long does standard shipping take?"</li>
            <li>• "What's your return policy?"</li>
            <li>• "How do I verify my seller account?"</li>
            <li>• "What's your favorite color?" (out of scope)</li>
          </ul>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg mb-4"
        >
          Open Support Panel
        </button>
        
        <SupportPanel
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
};

// Mobile view
export const Mobile: Story = {
  args: {
    isOpen: true,
    onClose: () => {},
  },
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    return (
      <div style={{ width: '375px', height: '812px', overflow: 'hidden' }}>
        <SupportPanel
          {...args}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        />
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};