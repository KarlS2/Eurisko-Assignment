This storefront category contains the same old element in the storefront week 4, in addition to the new required elements.
The reason for the new directory is to keep the week 4 intact in case they haven't been graded yet.
The old elements will be updated in this new version in order to be compatible with the backend.


# Karl Storefront - Frontend Application

> **Week 5 Assignment - E-commerce Storefront with Real-time Features & AI Support**

A fully responsive, production-ready React + TypeScript storefront with real-time order tracking via Server-Sent Events (SSE) and an intelligent AI-powered support assistant.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Setup](#-environment-setup)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Key Features Walkthrough](#-key-features-walkthrough)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Browser Compatibility](#-browser-compatibility)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Features

### Core E-commerce
- **Product Catalog** - Browse 20+ products with search, filtering, and sorting
- **Shopping Cart** - Persistent cart with quantity management
- **Checkout Flow** - Simple checkout with user identification
- **Order History** - View all past orders with status tracking

### Real-time Features
- **Live Order Tracking** - Server-Sent Events (SSE) for real-time order status updates
- **Auto-progression** - Orders automatically transition through statuses for demo purposes
- **Connection Management** - Automatic reconnection with exponential backoff

### AI-Powered Support
- **Intelligent Assistant** (Karobot) - Context-aware support bot with:
  - Intent detection (7+ intent types)
  - Function calling (order status, product search, customer data)
  - Policy knowledge grounding with citations
  - Personality and identity (never reveals AI model)
  - Multi-turn conversation support

### Admin Features
- **Admin Dashboard** - Real-time metrics and analytics:
  - Business metrics (revenue, orders, average order value)
  - Performance monitoring (API latency, SSE connections)
  - Assistant analytics (intent distribution, function calls)
  - System health indicators

### User Experience
- **Fully Responsive** - Mobile-first design, works on all screen sizes
- **User Authentication** - Simple email-based identification (no passwords)
- **Role-based Access** - Admin vs regular user permissions
- **Persistent State** - Cart and user data persist across sessions

---

## 🛠 Tech Stack

- **React 18.2** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router 6** - Client-side routing
- **Zustand** - State management (with persistence)
- **Tailwind CSS** - Utility-first styling
- **Vitest** - Unit testing
- **Storybook** - Component development

### Key Libraries
- `clsx` - Conditional CSS classes
- `react-router-dom` - Routing
- `zustand` - Global state

---

## 📦 Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** 9+ or **yarn** 1.22+
- **Backend API** running (see backend README)
- Modern web browser with SSE support

---

## 🚀 Installation

### 1. Clone Repository

```bash
git clone (https://github.com/KarlS2/livedrop--KarlSassine)
cd storefront
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Development (local backend)
VITE_API_URL=http://localhost:3000

# Production (deployed backend)
# VITE_API_URL=https://livedrop-karlsassine.onrender.com
```

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at `http://localhost:3000`

---

## 🌍 Environment Setup

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000` |

**Note:** Vite requires `VITE_` prefix for environment variables to be exposed to the client.

### Backend Requirements

The frontend expects these backend endpoints to be available:

```
GET    /api/customers?email=...      # Customer lookup
GET    /api/customers/:id            # Customer details
GET    /api/products                 # Product list
GET    /api/products/:id             # Product details
POST   /api/orders                   # Create order
GET    /api/orders/:id               # Order details
GET    /api/orders?customerId=...    # Customer orders
GET    /api/orders/:id/stream        # SSE order tracking (EventSource)
POST   /api/assistant/chat           # AI assistant
GET    /api/assistant/metrics        # Assistant analytics
GET    /api/dashboard/business-metrics  # Business data
GET    /api/dashboard/performance    # Performance metrics
```

---

## 🏗 Project Structure

```
storefront/
├── src/
│   ├── component/
│   │   ├── atoms/               # Basic UI components
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Spinner.tsx
│   │   ├── molecules/           # Composite components
│   │   │   ├── CartItem.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   └── SearchBar.tsx
│   │   └── organisms/           # Complex components
│   │       ├── Header.tsx
│   │       ├── SupportPanel.tsx
│   │       └── UserLogin.tsx
│   ├── lib/
│   │   ├── api.ts              # Backend API client
│   │   ├── config.ts           # API configuration
│   │   ├── format.ts           # Formatting utilities
│   │   ├── router.tsx          # Route configuration
│   │   ├── sse-client.ts       # SSE connection manager
│   │   └── store.ts            # Zustand stores
│   ├── pages/
│   │   ├── AdminDashboard.tsx  # Admin dashboard
│   │   ├── catalog.tsx         # Product catalog
│   │   ├── product.tsx         # Product detail
│   │   ├── cart.tsx            # Shopping cart
│   │   ├── checkout.tsx        # Checkout flow
│   │   ├── orders.tsx          # Order history
│   │   └── order-status.tsx    # Order tracking (SSE)
│   ├── test/
│   │   └── setup.ts            # Test configuration
│   ├── app.tsx                 # Root component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── .env                        # Environment variables (gitignored)
├── .env.example                # Environment template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── tailwind.config.js
└── README.md
```

---

## 🎯 Key Features Walkthrough

### 1. User Authentication (Email-based)

**No password required** - Simple email lookup for demo purposes.

**Demo Accounts:**
- **Admin accounts:**
  - `gandalf@shoplite.com`
  - `darth.vader@shoplite.com`
  - `karl.sassine@shoplite.com`
- **Regular users:**
  - `demo@example.com` (has existing orders)
  - `james.rodriguez@email.com`
  - `emily.chen@techmail.com`

**Flow:**
1. Click account icon in header
2. Enter email address
3. System looks up customer in database
4. User is logged in (state persists in localStorage)

**Implementation:** `src/component/organisms/UserLogin.tsx`

```typescript
// User identification
const customer = await getCustomerByEmail(email);
setUser(customer);
```

---

### 2. Real-time Order Tracking (SSE)

**Live updates** using Server-Sent Events (EventSource API).

**Features:**
- Automatic status progression for demo (PENDING → PROCESSING → SHIPPED → DELIVERED)
- Connection management with auto-reconnect
- Graceful error handling
- Resource cleanup on unmount

**Implementation:** `src/lib/sse-client.ts`

```typescript
// Connect to order stream
const connection = connectToOrderStream(orderId, {
  onEvent: (event) => {
    // Update UI with new status
    setOrder(prev => ({ ...prev, status: event.status }));
  },
  onError: (error) => console.error('SSE error:', error),
  reconnect: true,
  maxReconnectAttempts: 3
});

// Cleanup
return () => connection.close();
```

**Usage:** Navigate to any order page (`/order/:id`) to see live tracking.

---

### 3. AI Support Assistant (Karobot)

**Intelligent context-aware assistant** with personality.

**Capabilities:**
- **Intent Detection** - Classifies user queries into 7+ categories
- **Function Calling** - Invokes backend functions for order status, product search
- **Knowledge Grounding** - Answers policy questions with citations
- **Personality** - Named "Karobot", never reveals underlying AI model
- **Multi-turn Conversations** - Maintains context

**Intent Types:**
- `policy_question` - Returns policy, shipping, warranties
- `order_status` - Order tracking queries
- `product_search` - Product searches
- `complaint` - Customer complaints/issues
- `chitchat` - Greetings, small talk
- `off_topic` - Unrelated queries
- `violation` - Inappropriate content

**Implementation:** `src/component/organisms/SupportPanel.tsx`

```typescript
// Send query to assistant
const response = await chatWithAssistant(userQuery);

// Display response with metadata
<Message
  content={response.text}
  intent={response.intent}
  citations={response.citations}
  confidence={response.confidence}
/>
```

**Try asking:**
- "What's your return policy?"
- "Track order [ORDER_ID]"
- "Show me laptops under $1000"
- "Hello!"

---

### 4. Admin Dashboard

**Real-time metrics and monitoring** for admin users.

**Access:** Login with admin account → Navigate to `/admin`

**Metrics Displayed:**
- **Business:** Total revenue, order count, avg order value, orders by status
- **Performance:** API latency, active SSE connections, request counts
- **Assistant:** Total queries, intent distribution, function call stats
- **System Health:** Database, API, LLM service status

**Auto-refresh:** Every 10 seconds

**Implementation:** `src/pages/AdminDashboard.tsx`

---

### 5. Shopping Cart (Persistent)

**Features:**
- Add/remove products
- Quantity management
- Real-time subtotal calculation
- Persists across browser sessions (localStorage)
- Free shipping over $50

**Implementation:** Uses Zustand with persistence middleware

```typescript
// Cart store
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, quantity) => { /* ... */ },
      removeItem: (productId) => { /* ... */ },
      updateQuantity: (productId, quantity) => { /* ... */ },
      clearCart: () => { /* ... */ }
    }),
    { name: 'shoplite-cart' }
  )
);
```

---

## 🧪 Testing (frontend)

same as week 4 so no changes

---

## 📱 Browser Compatibility

### Supported Browsers

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Required Features

- **ES2020** - Modern JavaScript
- **EventSource API** - For SSE (real-time tracking)
- **localStorage** - For cart/user persistence
- **Fetch API** - For HTTP requests

### Mobile Support

- ✅ iOS Safari 14+
- ✅ Chrome Mobile 90+
- ✅ Samsung Internet 14+

**Fully responsive design** tested on:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- iPad (768px)
- Desktop (1920px+)

---

## 🚀 Deployment

### Vercel 

Deployed on https://livedrop-karl-sassine.vercel.app

## 📊 Performance Optimization

### Bundle Size

Current production bundle (gzipped):
- Vendor chunk: ~150KB
- App code: ~30KB
- Total: ~180KB

### Code Splitting

Automatic route-based splitting via React Router:

```typescript
// Lazy load pages
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
```

### Image Optimization

- Use `loading="lazy"` for product images
- Optimize images before upload (WebP format recommended)
- Consider using CDN for image delivery

---

### 📋 Test Accounts

**Admin (Dashboard Access):**
- gandalf@shoplite.com
- darth.vader@shoplite.com
- karl.sassine@shoplite.com

**Regular User (With Orders):**
- demo@example.com

**Regular Users (No Orders):**
- james.rodriguez@email.com
- emily.chen@techmail.com
...
---

