# Component Prompts Log

This document tracks the AI-assisted scaffolding of components for the Storefront v1 project.

## Date: October 7, 2025

### Atoms

#### Button Component
**Prompt**: "Create a reusable Button component in TypeScript with React that supports multiple variants (primary, secondary, danger, ghost), sizes (sm, md, lg), disabled state, and fullWidth option. Use Tailwind CSS for styling with clsx for conditional classes."

**Generated**: `src/components/atoms/Button.tsx`
- Props interface with variant, size, fullWidth
- Base styles with focus rings and transitions
- Disabled state handling
- TypeScript type safety

#### Input Component
**Prompt**: "Create an Input component with label support, error messages, and accessibility features. Include ARIA attributes for screen readers and proper error state styling."

**Generated**: `src/components/atoms/Input.tsx`
- Forward ref for form libraries
- Label and error message support
- ARIA attributes for accessibility
- Focus state with ring styling

#### Badge Component
**Prompt**: "Create a Badge component for displaying status indicators with variants (default, success, warning, danger, info) and sizes (sm, md)."

**Generated**: `src/components/atoms/Badge.tsx`
- Color-coded variants
- Size variations
- Rounded pill styling

#### Spinner Component
**Prompt**: "Create a loading Spinner component with size variants and animation using Tailwind."

**Generated**: `src/components/atoms/Spinner.tsx`
- CSS animation for rotation
- Screen reader support
- Size variations

### Molecules

#### ProductCard Component
**Prompt**: "Create a ProductCard component that displays product information, handles add-to-cart, shows stock status, and includes hover effects. Should accept a Product type and onAddToCart callback."

**Generated**: `src/components/molecules/ProductCard.tsx`
- Image with lazy loading
- Price formatting
- Stock indicators with badges
- Add to cart button
- Link to product details
- Hover animations

#### SearchBar Component
**Prompt**: "Create a SearchBar component with a text input and submit button that calls an onSearch callback with the query string."

**Generated**: `src/components/molecules/SearchBar.tsx`
- Form with submit handling
- Input with search type
- Accessible labels

#### CartItem Component
**Prompt**: "Create a CartItem component that displays cart line items with quantity controls, remove button, and subtotal calculation."

**Generated**: `src/components/molecules/CartItem.tsx`
- Product thumbnail and details
- Quantity increment/decrement controls
- Remove functionality
- Price calculations
- Stock limit validation

### Organisms

#### Header Component
**Prompt**: "Create a Header component with logo, navigation links (Catalog, Cart with item count badge), and Ask Support button. Header should be sticky and show cart item count."

**Generated**: `src/components/organisms/Header.tsx`
- Sticky positioning
- Logo and branding
- Navigation with active states
- Cart badge with item count
- Support panel trigger

#### SupportPanel Component
**Prompt**: "Create a SupportPanel slide-over component with chat interface, message history, input field, and keyboard navigation support (Escape to close). Include focus trapping and ARIA attributes."

**Generated**: `src/components/organisms/SupportPanel.tsx`
- Slide-over animation
- Chat message display
- User and assistant message styling
- Citations display
- Loading state with spinner
- Focus management
- Keyboard shortcuts (Escape)
- Backdrop overlay

### Pages

#### Catalog Page
**Prompt**: "Create a Catalog page that loads products, displays them in a responsive grid, supports search by title/tags/description, sorting by price, and filtering by tags. Include SearchBar and ProductCard components."

**Generated**: `src/pages/catalog.tsx`
- Product grid layout
- Client-side search implementation
- Sort dropdown (price asc/desc)
- Tag filter dropdown
- Loading state
- Empty state messaging

#### Product Page
**Prompt**: "Create a Product details page that shows product info, related products, quantity selector with stock validation, and add-to-cart functionality. Include breadcrumb navigation."

**Generated**: `src/pages/product.tsx`
- URL parameter extraction
- Product data loading
- Related products section
- Quantity controls with limits
- Stock status display
- Breadcrumb navigation
- 404 handling

#### Cart Page
**Prompt**: "Create a Cart page showing all cart items, order summary with subtotal/tax/shipping/total calculations, and checkout button. Include free shipping threshold indicator."

**Generated**: `src/pages/cart.tsx`
- Cart items list
- Order summary sidebar
- Tax calculation (8%)
- Shipping calculation (free over $50)
- Empty cart state
- Continue shopping link

#### Checkout Page
**Prompt**: "Create a Checkout page with forms for contact info, shipping address, and payment details (mock). Show order summary and place order button that creates an order and navigates to order status."

**Generated**: `src/pages/checkout.tsx`
- Multi-section form layout
- Form validation
- Order summary
- Mock payment processing
- Loading state during submission
- Redirect to order status

#### Order Status Page
**Prompt**: "Create an Order Status page that displays order information, visual progress tracker for order stages (Placed, Packed, Shipped, Delivered), tracking information, and estimated delivery."

**Generated**: `src/pages/order-status.tsx`
- Order lookup by ID
- Visual progress stepper
- Status badges
- Tracking information display
- 404 for invalid orders

### Library Files

#### API Module
**Prompt**: "Create an API module with mock data functions for listProducts, getProduct, searchProducts, getRelatedProducts, getOrderStatus, and placeOrder. Include TypeScript interfaces."

**Generated**: `src/lib/api.ts`
- Product and OrderStatus interfaces
- Mock order database
- Catalog caching
- Search/filter/sort utilities

#### Store Module
**Prompt**: "Create a Zustand store for cart management with addItem, removeItem, updateQuantity, clearCart, getTotal, and getItemCount. Persist to localStorage."

**Generated**: `src/lib/store.ts`
- Zustand store setup
- localStorage persistence
- Cart CRUD operations
- Total calculations

#### Support Engine
**Prompt**: "Create a support engine that processes user queries, extracts order IDs, matches questions to ground-truth Q&As using keyword scoring, and returns answers with citations. Include confidence scoring and out-of-scope handling."

**Generated**: `src/assistant/engine.ts`
- Order ID regex extraction
- Keyword matching algorithm
- Confidence threshold logic
- PII masking
- Optional OpenAI integration

## Notes

- All components follow atomic design principles
- TypeScript used throughout for type safety
- Tailwind CSS for consistent styling
- Accessibility features included by default
- Components are tested and documented
- Performance optimizations applied (lazy loading, memoization)