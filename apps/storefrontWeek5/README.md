This storefront category contains the same old element in the storefront week 4, in addition to the new required elements.
The reason for the new directory is to keep the week 4 intact in case they haven't been graded yet.
The old elements will be updated in this new version in order to be compatible with the backend.

frontend available on:https://livedrop-karl-sassine.vercel.app/


# Shoplite Frontend (Karl storefront)

**Week 5 Assignment - React + TypeScript E-Commerce Storefront**

Author: Karl Sassine    
Date: 20 October 2025

---

## 📋 Overview

Modern, responsive e-commerce storefront built with React, TypeScript, and Tailwind CSS. Features real-time order tracking (SSE) and integrated intelligent assistant (Karobot).

### Key Features

- ✅ Product catalog with search, filter, and pagination
- ✅ Shopping cart with persistent state (Zustand)
- ✅ Real-time order tracking via Server-Sent Events
- ✅ Integrated support chat with Karobot assistant
- ✅ Admin dashboard with live metrics
- ✅ Role-based access control (User/Admin)
- ✅ Responsive design (mobile-first)
- ✅ Type-safe with TypeScript

---

## 🏗️ Architecture
```
apps/storefront/
├── src/
│   ├── lib/
│   │   ├── api.ts              # Backend API client
│   │   ├── config.ts           # Configuration & endpoints
│   │   ├── sse-client.ts       # SSE connection manager
│   │   ├── store.ts            # Zustand state management
│   │   ├── router.tsx          # React Router setup
│   │   └── format.ts           # Utility functions
│   ├── pages/
│   │   ├── catalog.tsx         # Product listing
│   │   ├── product.tsx         # Product details
│   │   ├── cart.tsx            # Shopping cart
│   │   ├── checkout.tsx        # Checkout flow
│   │   ├── order-status.tsx   # Live order tracking
│   │   ├── orders.tsx          # Order history
│   │   └── AdminDashboard.tsx # Admin metrics
│   ├── component/
│   │   ├── atoms/              # Basic components
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Spinner.tsx
│   │   ├── molecules/          # Composite components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── CartItem.tsx
│   │   │   └── SearchBar.tsx
│   │   └── organisms/          # Complex components
│   │       ├── Header.tsx
│   │       ├── SupportPanel.tsx
│   │       └── UserLogin.tsx
│   ├── app.tsx                 # Root component
│   ├── main.tsx               # Entry point
│   └── index.css              # Tailwind styles
├── package.json
├── vite.config.ts
├── tsconfig.json
├── vitest.config.js
├── postcss.config.js
├── tailwind.config.js
└── .env.example
```

**Design Pattern:** Atomic Design (Atoms → Molecules → Organisms → Pages)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm 9+
- Backend API running (see `/apps/api/README.md`)

### Installation
```bash
# Navigate to frontend directory
cd apps/storefront

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your backend URL
nano .env
```

### Environment Variables (example)
```bash
# Backend API URL
# Development: http://localhost:5000
# Production: https://your-api.onrender.com
VITE_API_URL=http://localhost:5000

# Debug mode (optional)
VITE_DEBUG=false
```

### Development
```bash
# Start development server
npm run dev

# Server starts on http://localhost:3000
# Hot reload enabled
```

### Build for Production
```bash
# Create optimized production build
npm run build

# Output directory: dist/
# Preview build locally:
npm run preview
```

---

## 🎨 Design System

### Tailwind Configuration

**Custom Colors:**
```javascript
primary: {
  50: '#eff6ff',
  100: '#dbeafe',
  // ... full color scale
  600: '#2563eb',  // Main brand color
  900: '#1e3a8a'
}
```

### Component Library

**Atomic Design Hierarchy:**

1. **Atoms** (Basic building blocks)
   - Button (4 variants: primary, secondary, danger, ghost)
   - Badge (5 variants: default, success, warning, danger, info)
   - Input (with label, error state, full-width)
   - Spinner (3 sizes: sm, md, lg)

2. **Molecules** (Simple combinations)
   - ProductCard (image, name, price, badges, add-to-cart)
   - CartItem (product info, quantity controls, remove)
   - SearchBar (input + submit button)

3. **Organisms** (Complex components)
   - Header (navigation, cart count, user menu)
   - SupportPanel (chat interface, message history)
   - UserLogin (email lookup, profile display)

4. **Pages** (Complete views)
   - Catalog, Product, Cart, Checkout, Order Status, Admin Dashboard

---

## 🔌 Backend Integration

### API Client (`lib/api.ts`)

**All backend calls go through centralized API client:**
```typescript
// Example usage in components:
import { listProducts, placeOrder, chatWithAssistant } from '../lib/api';

// Get products
const products = await listProducts({ search: 'laptop', limit: 20 });

// Create order
const { orderId } = await placeOrder(customerId, items);

// Chat with assistant
const response = await chatWithAssistant('What is your return policy?');
```

**Available Functions:**
```typescript
// Customers
getCustomerByEmail(email: string): Promise<User>
getCustomer(customerId: string): Promise<User>

// Products
listProducts(params?: FilterParams): Promise<Product[]>
getProduct(id: string): Promise<Product | null>
searchProducts(query: string): Promise<Product[]>
getRelatedProducts(productId: string, limit?: number): Promise<Product[]>

// Orders
placeOrder(customerId: string, items: OrderItem[]): Promise<{ orderId: string; order: Order }>
getOrder(orderId: string): Promise<Order | null>
getCustomerOrders(customerId: string): Promise<Order[]>

// Assistant
chatWithAssistant(query: string): Promise<AssistantResponse>

// Analytics
getDailyRevenue(from: string, to: string): Promise<DailyRevenue[]>
```

### Configuration (`lib/config.ts`)

**Centralized endpoint configuration:**
```typescript
export const config = {
  apiUrl: API_BASE_URL,
  
  endpoints: {
    customers: `${API_BASE_URL}/api/customers`,
    products: `${API_BASE_URL}/api/products`,
    orders: `${API_BASE_URL}/api/orders`,
    analytics: `${API_BASE_URL}/api/analytics`,
    dashboard: `${API_BASE_URL}/api/dashboard`,
    assistant: `${API_BASE_URL}/api/assistant`,
    health: `${API_BASE_URL}/health`,
  },

  timeouts: {
    default: 50000,      // 50 seconds (Lebanon internet considerations)
    assistant: 60000,    // 60 seconds (LLM might be slow)
    sse: 0,              // No timeout for SSE
  },
  
  sse: {
    orderStatus: (orderId: string) => `${API_BASE_URL}/api/orders/${orderId}/stream`,
  },
}
```

**Why long timeouts?**  
Given Lebanon's infrastructure challenges (unstable internet, power outages), we use generous timeouts to handle network delays gracefully.
If render went idle the functions might be slow too.

---

## 📡 Real-Time Features (SSE)

### SSE Client (`lib/sse-client.ts`)

**Production-quality SSE connection manager:**
```typescript
// Usage in components:
import { connectToOrderStream } from '../lib/sse-client';

const connection = connectToOrderStream(orderId, {
  onEvent: (event) => {
    console.log('Status update:', event.status);
    setOrder(prevOrder => ({ ...prevOrder, ...event }));
  },
  
  onError: (error) => {
    console.error('SSE error:', error);
    setStreamError(error.message);
  },
  
  onClose: () => {
    console.log('Connection closed');
    setIsStreaming(false);
  },
  
  reconnect: true,              // Auto-reconnect on disconnect
  maxReconnectAttempts: 3,      // Try 3 times before giving up
});

// Cleanup on unmount
return () => connection.close();
```

**Features:**
- ✅ Automatic reconnection (with exponential backoff)
- ✅ Proper cleanup (no memory leaks)
- ✅ Connection state tracking (CONNECTING | OPEN | CLOSED)
- ✅ Error handling with user feedback
- ✅ Event parsing and validation

### Order Tracking Page

**Real-time status updates:**

1. **User visits** `/order/:id`
2. **Component mounts** → Connects to SSE endpoint
3. **Backend automatically progresses** status every 4-7 seconds:
   - PENDING → PROCESSING → SHIPPED → DELIVERED
4. **Frontend updates** progress bar in real-time
5. **Connection closes** when order DELIVERED
6. **Cleanup** on component unmount

**Visual indicator:**
```typescript
{isStreaming ? (
  <span className="flex items-center gap-2">
    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
    Live tracking active
  </span>
) : (
  'Your order details'
)}
```

---

## 🤖 Karobot Assistant Integration

### Support Panel (`component/organisms/SupportPanel.tsx`)

**Full-featured chat interface:**
```typescript
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Add user message to chat
  setMessages(prev => [...prev, { role: 'user', content: query }]);
  
  // Call backend assistant
  const response = await chatWithAssistant(query);
  
  // Add assistant response with metadata
  setMessages(prev => [...prev, {
    role: 'assistant',
    content: response.text,
    intent: response.intent,              // Shows intent type
    citations: response.citations,        // Policy sources
    confidence: response.confidence,      // high/medium/low
    processingTime: response.processingTime,  // Response time in ms
  }]);
};
```

**Features:**
- ✅ Message history (preserved in component state)
- ✅ Intent badges (shows classification)
- ✅ Confidence indicators (color-coded)
- ✅ Citation display (shows `[PolicyID]`)
- ✅ Processing time (for performance monitoring)
- ✅ Auto-scroll to latest message
- ✅ Loading indicators
- ✅ Error handling with fallback messages
- ✅ Escape key to close
- ✅ Focus management

**Example Interaction:**
```
User: "What's your return policy?"

Karobot: "Items can be returned within 30 days of purchase 
with original receipt. All items must be in original condition 
with tags attached. Refunds are processed within 5-7 business 
days."

[Badges shown:]
✓ policy_question
✓ high confidence
✓ Sources: Policy9.1
✓ 1,234ms
```

---

## 👤 User Authentication

### Simple Email-Based Identification

**No passwords, no complex auth—just email lookup:**
```typescript
// In UserLogin.tsx
const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  
  // Call backend to find customer by email
  const customer = await getCustomerByEmail(email);
  
  // Save to Zustand store
  setUser(customer);
  
  // Close modal
  onClose?.();
};
```

**User Store (Zustand):**
```typescript
interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  isAuthenticated: () => boolean;
  isAdmin: () => boolean;  // Check if user has admin role
}

// Usage in components:
const { user, isAuthenticated, isAdmin } = useUserStore();

if (!isAuthenticated()) {
  return <LoginPrompt />;
}

if (isAdmin()) {
  return <AdminDashboard />;
}
```

**Test Accounts:**

| Email | Name | Role | Notes |
|-------|------|------|-------|
| `demo@example.com` | Sarah Mitchell | User | Has 3 orders (for testing) |
| `gandalf@shoplite.com` | Gandalf the Grey | Admin | Dashboard access |
| `darth.vader@shoplite.com` | Darth Vader | Admin | Dashboard access |
| `karl.sassine@shoplite.com` | Karl Sassine | Admin | Dashboard access |

---

## 📊 Admin Dashboard

### Role-Based Access Control
```typescript
// In AdminDashboard.tsx
useEffect(() => {
  if (!isAuthenticated()) {
    setError('Please login to access the dashboard');
    return;
  }
  
  if (!isAdmin()) {
    setError('Access denied. Admin privileges required.');
    return;
  }
  
  loadAllMetrics();
}, [isAuthenticated, isAdmin]);
```

### Dashboard Features

**1. Business Metrics:**
- Total revenue (all-time)
- Total orders count
- Average order value
- Revenue trend chart (last 7 days)
- Orders by status breakdown

**2. Performance Monitoring:**
- Average API latency
- Active SSE connections
- Failed requests count
- Recent requests log

**3. Assistant Analytics:**
- Total queries handled
- Intent distribution (bar chart)
- Function calls breakdown
- Average response time per intent
- Error rate

**4. System Health:**
- Database status (healthy/unhealthy)
- API server status
- LLM service status
- SSE connections status

**Auto-refresh:**
```typescript
// Dashboard updates every 10 seconds
useEffect(() => {
  loadAllMetrics();
  const interval = setInterval(loadAllMetrics, 10000);
  return () => clearInterval(interval);
}, []);
```

---

## 🛒 Shopping Flow

### Complete User Journey
```
1. Browse Catalog
   ↓
2. Search/Filter Products
   ↓
3. View Product Details
   ↓
4. Add to Cart
   ↓
5. View Cart (adjust quantities)
   ↓
6. Login (email identification)
   ↓
7. Checkout (review order)
   ↓
8. Place Order (backend creates order)
   ↓
9. Order Status Page (SSE connects)
   ↓
10. Live Tracking (auto-updates every 4-7s)
    ↓
11. Order History (view all past orders)
```

### State Management (Zustand)

**Cart Store:**
```typescript
const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity = 1) => { /* ... */ },
      removeItem: (productId) => { /* ... */ },
      updateQuantity: (productId, quantity) => { /* ... */ },
      clearCart: () => { /* ... */ },
      getTotal: () => { /* ... */ },
      getItemCount: () => { /* ... */ },
    }),
    {
      name: 'shoplite-cart',  // localStorage key
      partialize: (state) => ({ items: state.items }),
    }
  )
);
```

**Features:**
- ✅ Persists to localStorage (survives refresh)
- ✅ Stock quantity limits (can't add more than available)
- ✅ Automatic total calculation
- ✅ Item count for header badge

---

## 🎯 Key Pages

### Catalog Page (`pages/catalog.tsx`)

**Features:**
- Product grid (responsive: 1-4 columns)
- Search bar (searches name, description, tags)
- Category filter dropdown
- Tag filter dropdown
- Sort options (price: low-high, high-low)
- Pagination with results count
- Loading states
- Empty state with clear filters button

### Product Page (`pages/product.tsx`)

**Features:**
- Large product image
- Product name and description
- Price display
- Category and tag badges
- Stock indicator (with low stock warning)
- Quantity selector (with min/max validation)
- Add to cart button (disabled if out of stock)
- Related products section (based on tags)
- Breadcrumb navigation

### Checkout Page (`pages/checkout.tsx`)

**Features:**
- Customer information display (read-only)
- Shipping address (from customer profile)
- Order summary (items, subtotal, tax, shipping, total)
- Free shipping indicator (over $50)
- Demo mode notice (no real payment)
- Place order button (creates order via API)
- Loading state during order creation
- Error handling with user feedback
- Auto-redirects to order status page on success

### Order Status Page (`pages/order-status.tsx`)

**Features:**
- Order details (ID, date, total, items)
- Live status indicator (green pulsing dot when streaming)
- Progress timeline (visual status progression)
- Carrier and tracking information
- Estimated delivery date
- SSE connection (auto-connects on mount)
- Auto-reconnection (up to 3 attempts)
- Error handling (shows "last known status" if connection fails)
- Cleanup on unmount (no memory leaks)

---

## 🧪 Testing Frontend

### Manual Testing Checklist

**Basic Flow:**
```bash
# 1. Start frontend
npm run dev

# 2. Visit http://localhost:3000
# 3. Should see product catalog
```

**User Flow Test:**
1. ✅ Browse products → Products load and display correctly
2. ✅ Search "laptop" → Filters products
3. ✅ Click product → Shows product details
4. ✅ Add to cart → Cart count increases in header
5. ✅ View cart → Shows added items
6. ✅ Click checkout → Prompts for login
7. ✅ Login with `demo@example.com` → Shows customer name in header
8. ✅ Complete checkout → Creates order
9. ✅ Order status page → SSE connects (see green dot)
10. ✅ Watch status updates → Progress bar moves automatically
11. ✅ Click Support → Chat panel opens
12. ✅ Ask "What's your return policy?" → Response with `[Policy9.1]`

**Admin Test:**
1. ✅ Login as `gandalf@shoplite.com`
2. ✅ Red "Admin" badge appears in header
3. ✅ "Dashboard" link visible in header
4. ✅ Click Dashboard → Loads all 4 metric sections
5. ✅ Wait 10 seconds → Dashboard auto-refreshes
6. ✅ Intent distribution chart → Bar chart visible

### Browser Console Tests
```javascript
// Test API connection
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log);

// Test Zustand store
const store = window.__ZUSTAND_STORE__;
console.log('Cart items:', store.cart.items);
console.log('User:', store.user);
```

---

## 🔧 Troubleshooting

### "Failed to fetch products"

**Cause:** Backend not running or CORS issue

**Fix:**
```bash
# 1. Check backend is running
curl http://localhost:5000/health

# 2. Check .env has correct API URL
cat .env
# Should show: VITE_API_URL=http://localhost:5000

# 3. Restart frontend (Vite needs restart for .env changes)
npm run dev
```

### "SSE connection failed"

**Cause:** Order doesn't exist or already DELIVERED

**Fix:**
```bash
# 1. Create a new order first (through checkout)
# 2. Use that order ID for tracking
# 3. Or check backend logs for SSE errors
```

### "Support chat not responding"

**Possible causes:**
1. **Backend /api/assistant/chat not working**
```bash
   # Test endpoint
   curl -X POST http://localhost:5000/api/assistant/chat \
     -H "Content-Type: application/json" \
     -d '{"query":"hello"}'
```

2. **LLM endpoint down** → Assistant uses fallback (still works, just less natural)

3. **Network timeout** → Check `config.ts` timeouts (currently 60s for assistant)

### "Dashboard shows no data"

**Cause:** No orders in database or wrong user role

**Fix:**
```bash
# 1. Seed database
cd apps/api
node seed.js

# 2. Login as admin user
# gandalf@shoplite.com (not demo@example.com)

# 3. Check backend dashboard endpoints
curl http://localhost:5000/api/dashboard/business-metrics
```

---

## 📦 Dependencies
```json
{
  "react": "^18.2.0",           // UI library
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0", // Routing
  "zustand": "^4.4.7",          // State management
  "clsx": "^2.0.0",             // Conditional classes
  "typescript": "^5.3.3",       // Type safety
  
  // Development
  "vite": "^5.0.8",             // Build tool
  "tailwindcss": "^3.4.0",      // CSS framework
  "@vitejs/plugin-react": "^4.2.1"
}
```

---

## 🚀 Deployment

See `docs/deployment-guide.md` for complete Vercel deployment instructions.

---

## 🎨 Customization

### Change Brand Color

**Edit `tailwind.config.js`:**
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // Change these values
          600: '#your-color',  // Main brand color
        }
      }
    }
  }
}
```

### Add New Page

1. **Create page component:**
```typescript
   // src/pages/my-page.tsx
   export default function MyPage() {
     return <div>My Page</div>;
   }
```

2. **Add route:**
```typescript
   // src/lib/router.tsx
   {
     path: 'my-page',
     element: <MyPage />,
   }
```

3. **Add navigation link:**
```typescript
   // src/component/organisms/Header.tsx
   <Link to="/my-page">My Page</Link>
```

---

## 📝 Code Style

**TypeScript + Functional Components:**
```typescript
// Prefer functional components with hooks
export default function MyComponent() {
  const [state, setState] = useState<Type>(initialValue);
  
  useEffect(() => {
    // Side effects
  }, [dependencies]);
  
  return <div>...</div>;
}
```

**Atomic Design:**
- **Atoms** → Single-purpose, no dependencies
- **Molecules** → Combine atoms, simple logic
- **Organisms** → Complex, may call APIs
- **Pages** → Route-level components

**State Management:**
- **Local state** → `useState` for component-only data
- **Global state** → Zustand stores for cart, user
- **Server state** → Direct API calls (no caching library needed)

---

## 🏆 Production Features

- ✅ **Type Safety**: Full TypeScript coverage
- ✅ **Error Boundaries**: Graceful error handling
- ✅ **Loading States**: Spinners and skeleton screens
- ✅ **Empty States**: Helpful messages and CTAs
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Accessibility**: ARIA labels, keyboard navigation
- ✅ **Performance**: Code splitting, lazy loading
- ✅ **SEO**: Meta tags, semantic HTML
- ✅ **Analytics Ready**: Easy to add tracking

---


