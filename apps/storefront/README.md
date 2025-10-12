# Storefront v1

A modern, fast e-commerce frontend with AI-powered support built with React, Vite, TypeScript, and Tailwind CSS.

## Features

-  **Complete E-commerce Flow**: Catalog → Product Details → Cart → Checkout → Order Status
-  **AI Support Panel**: Context-aware support using ground-truth Q&A 
-  **Performance Optimized**: <200KB JS bundle (gzipped), lazy-loaded images
-  **Accessible**: Keyboard navigation, ARIA labels, focus trapping
-  **Responsive**: Mobile-first design with Tailwind CSS
-  **Well Tested**: Unit tests with Vitest and Testing Library
-  **Documented**: Storybook stories for all components

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router v6
- **Testing**: Vitest + Testing Library
- **Documentation**: Storybook

## Project Structure

```
/apps/storefront/
  /src/
    /components/         # Atomic design components
      /atoms/           # Basic UI elements (Button, Input, Badge, etc.)
      /molecules/       # Composite components (ProductCard, SearchBar, etc.)
      /organisms/       # Complex components (Header, SupportPanel, etc.)
    /pages/             # Route pages
    /lib/               # Utilities and helpers
    /assistant/         # Support engine and ground-truth data
  /public/              # Static assets
```

## Installation

```bash
# Install dependencies
pnpm install
# or
npm install
```

## Development

```bash
# Start development server
pnpm dev

# Run tests
pnpm test

# Run tests in UI mode
pnpm test:ui

# Run Storybook
pnpm storybook
```

## Build

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```


## Features Overview

### Catalog Page
- Product grid with images and pricing
- Client-side search by title, tags, or description
- Sort by price (ascending/descending)
- Filter by product tags
- Real-time filtering and sorting

### Product Details Page
- High-quality product images
- Detailed descriptions and specifications
- Stock availability indicators
- Quantity selector with stock limits
- Related products based on shared tags
- Add to cart functionality

### Shopping Cart
- Persistent cart (localStorage + in-memory state)
- Quantity adjustments with stock validation
- Line item management (add/remove/update)
- Real-time total calculations
- Tax and shipping calculations
- Free shipping threshold indicator

### Checkout
- Contact information form
- Shipping address collection
- Mock payment processing
- Order summary with itemized costs
- Form validation
- Success confirmation with order ID

### Order Status
- Visual progress tracker
- Order timeline with status updates
- Carrier and tracking information
- Estimated delivery date
- Status badges (Placed, Packed, Shipped, Delivered)

### Ask Support Panel
- Slide-over panel accessible from any page
- Real-time query processing
- Automatic order ID detection
- PII protection (masked order IDs)
- Citation-backed responses [Qxx]
- Knowledge base of 20 Q&As covering:
  - Shipping policies
  - Return procedures
  - Account management
  - Seller information
  - Payment security
  - API documentation

### Support Engine Logic
1. **Order ID Detection**: Extracts order IDs matching pattern `[A-Z0-9]{10,}`
2. **Keyword Matching**: Scores questions against ground-truth Q&As
3. **Confidence Threshold**: Minimum score of 3 required for response
4. **Out-of-Scope Handling**: Polite refusal for unsupported queries
5. **PII Protection**: Shows only last 4 characters of order IDs

## Testing

The project includes comprehensive tests:

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test -- --coverage

# Run specific test file
pnpm test Button.test.tsx
```

### Test Coverage
-  Component props and rendering
-  User interactions and events
-  Accessibility (ARIA labels, keyboard navigation)
-  Support engine query processing
-  Known policy questions return correct citations
-  Out-of-scope questions are refused
-  Order status detection and inclusion

## Performance Metrics

- **Bundle Size**: ~180KB gzipped (excluding images)
- **Route Transitions**: <250ms p95 on dev build
- **Image Loading**: Lazy-loaded with native loading="lazy"
- **State Persistence**: Cart saved to localStorage

## Accessibility Features

-  Semantic HTML elements
-  ARIA labels on interactive elements
-  Keyboard navigation support
-  Focus trapping in modals/panels
-  Color contrast compliance
-  Form validation with error messages

## Dataset
The Dataset consist of product related to a tech store. The prices and content are just estimations not containing any truth. The images are not too consistent because i used unsplash to get direct images URL, free to use instead of downloading real images and store them locally.
