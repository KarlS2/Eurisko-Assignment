# Shoplite Backend API

**Week 5 Assignment - Full Stack E-Commerce with Intelligent Assistant**

Author: Karl Sassine    
Date: 20 October 2025

Deployed on: https://livedrop-karlsassine.onrender.com

---

## 📋 Overview

Production-ready RESTful API with real-time order tracking (SSE) and intelligent assistant (Karobot) powered by LLM with keyword-based fallbacks.

### Key Features

- ✅ RESTful API with MongoDB Atlas
- ✅ Server-Sent Events (SSE) for live order tracking
- ✅ Intelligent assistant with 7 intent types
- ✅ Function calling system (3+ functions)
- ✅ Citation validation
- ✅ Session-based conversation memory
- ✅ Admin dashboard metrics
- ✅ Database aggregation for analytics

---

## 🏗️ Architecture
```
apps/api/
├── src/
│   ├── server.js                 # Express server
│   ├── db.js                     # MongoDB schemas
│   ├── routes/
│   │   ├── customers.js          # Customer endpoints
│   │   ├── products.js           # Product CRUD
│   │   ├── orders.js             # Order management
│   │   ├── analytics.js          # Revenue analytics (DB aggregation)
│   │   ├── dashboard.js          # Dashboard metrics
│   │   └── assistant.js          # Karobot chat endpoint
│   ├── sse/
│   │   └── order-status.js       # Real-time order tracking
│   └── assistant/
│       ├── engine.js              # Main orchestration
│       ├── intent-classifier.js  # Hybrid intent detection
│       └── function-registry.js  # Function calling system
├── tests/                         # Test suite (61+ tests)
├── seed.js                        # Database seeding script
├── package.json
└── .env.example
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (free tier)
- ngrok account (for LLM endpoint)

### Installation
```bash
# Navigate to API directory
cd apps/api

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### Environment Variables
```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>

# Server
PORT=5000
NODE_ENV=development

# LLM Endpoint (Week 3 Colab + ngrok)
LLM_ENDPOINT=https://your-ngrok-url.ngrok-free.app

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
```

### Database Setup

1. **Create MongoDB Atlas Cluster** (Free M0)
2. **Whitelist IP**: `0.0.0.0/0` (allow from anywhere)
3. **Create Database User** with read/write permissions
4. **Get Connection String** and add to `.env`

### Seed Database
```bash
npm run seed

# Expected output:
# ✅ Inserted 26 products
# ✅ Inserted 16 customers (3 admins + 13 users)
# ✅ Inserted 18 orders
```

### Run Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start

# Test endpoints
curl http://localhost:5000/health
```

---

## 🤖 Karobot Assistant

### Architecture Overview

Karobot is an intelligent support assistant with:
- **7 Intent Types** (policy, order, product, complaint, chitchat, off-topic, violation)
- **3 Functions** (getOrderStatus, searchProducts, getCustomerOrders)
- **Session Management** (conversation memory)
- **Citation Validation** (policy sources)
- **Identity Protection** (never reveals AI model)

### LLM Integration vs. Fallback Methods

#### **Why Two Approaches?**

Given Lebanon's infrastructure challenges (unstable internet, power outages), we implemented a **dual-mode system**:

#### **Mode 1: LLM-Powered (Primary)**

**When Available:**
- Uses Week 3 Colab notebook (Qwen2.5-7B-Instruct)
- Exposed via ngrok tunnel
- Backend calls `/generate` endpoint

**Advantages:**
- ✅ Natural language understanding
- ✅ Contextual responses
- ✅ Handles complex queries
- ✅ Empathetic tone
- ✅ Nuanced complaint handling

**Example Response (LLM):**
```
User: "What's your return policy?"

LLM Response: "Great question! At Shoplite, we offer a 30-day return 
window for most items [Policy9.1]. Items must be in original condition 
with tags attached. Once we receive your return, refunds are processed 
within 5-7 business days [Policy9.2]. Need help with a specific return? 
I'm here to assist!"
```

#### **Mode 2: Keyword Fallback (Backup)**

**When LLM Unavailable:**
- Uses keyword matching + policy retrieval
- Direct policy text responses
- Pre-defined response templates

**Advantages:**
- ✅ Works offline
- ✅ Instant responses (no network delay)
- ✅ 100% reliable
- ✅ Still provides accurate information

**Example Response (Fallback):**
```
User: "What's your return policy?"

Fallback Response: "Items can be returned within 30 days of purchase 
with original receipt. All items must be in original condition with 
tags attached. Refunds are processed within 5-7 business days. [Policy9.1]"
```

#### **How Fallback Works**
```javascript
// In engine.js - handlePolicyQuestion()

try {
  // TRY LLM FIRST
  const prompt = buildPrompt('policy_question', query, { policies: policiesText });
  responseText = await generateResponse(prompt);
  
  if (!responseText) throw new Error('LLM returned null');
  
} catch (error) {
  // FALLBACK: Use policy text directly
  console.log('[Engine] Using fallback response');
  usedFallback = true;
  
  const mainPolicy = policies[0];
  responseText = `${mainPolicy.answer} [${mainPolicy.id}]`;
  
  // Add related policies
  if (policies.length > 1) {
    responseText += `\n\nRelated: ${policies.slice(1).map(p => `[${p.id}]`).join(', ')}`;
  }
}
```

#### **Comparison Table**

| Feature | LLM Mode | Fallback Mode |
|---------|----------|---------------|
| **Response Quality** | Natural, conversational | Direct, factual |
| **Speed** | 2-5 seconds | <100ms |
| **Network Required** | Yes (ngrok tunnel) | No |
| **Accuracy** | High (with grounding) | High (direct policy text) |
| **Empathy** | Yes | Limited |
| **Citations** | Yes | Yes |
| **Reliability** | 95% (depends on ngrok) | 100% |
| **Works Offline** | ❌ | ✅ |

#### **When Fallback Is Used**

1. **LLM endpoint unreachable** (ngrok down, no internet)
2. **LLM timeout** (>10 seconds)
3. **LLM returns empty response**
4. **Network errors** (ECONNREFUSED, ETIMEDOUT)

**Fallback is NOT a compromise—it's a feature!** It ensures Karobot always works, even during power outages or network issues.

### Intent Classification

**Hybrid Approach:**
1. **Keyword matching** (fast, reliable)
2. **LLM classification** (for ambiguous cases)
3. **Agreement boosting** (both methods agree = higher confidence)
```javascript
// High confidence from keywords → Use keyword result
if (keywordConfidence >= 0.7) return keywordResult;

// Low confidence → Ask LLM for second opinion
const llmResult = await classifyByLLM(query);

// If both agree → Boost confidence
if (llmResult.intent === keywordResult.intent) {
  return { intent, confidence: 0.95, method: 'hybrid_agreement' };
}
```

### Function Registry

**Extensible function system:**
```javascript
// Register new function
registry.register('getOrderStatus', handler, schema);

// Execute function
const result = await registry.execute('getOrderStatus', { orderId: '123' });

// Get statistics
const stats = registry.getStats();
// { getOrderStatus: { callCount: 42, successRate: '95.2%' } }
```

**Built-in Functions:**

1. **getOrderStatus(orderId)** - Enhanced order lookup
   - Tries 4 strategies: Full ObjectId, tracking number, partial match, fuzzy search
   
2. **searchProducts(query, limit)** - Product search with relevance ranking
   - Keyword expansion (e.g., "phone" → "smartphone", "mobile")
   - Score-based ranking
   
3. **getCustomerOrders(email)** - Get all customer orders

---

## 📡 API Endpoints

### Customers
```http
GET    /api/customers?email=user@example.com   # Lookup by email
GET    /api/customers/:id                      # Get by ID
POST   /api/customers                          # Create customer
```

### Products
```http
GET    /api/products?search=laptop&tag=gaming&page=1&limit=20
GET    /api/products/:id
POST   /api/products
```

### Orders
```http
POST   /api/orders                            # Create order
GET    /api/orders/:id                        # Get order
GET    /api/orders?customerId=:id             # Customer orders
GET    /api/orders/:id/stream                 # SSE live tracking
```

### Analytics (Database Aggregation)
```http
GET    /api/analytics/daily-revenue?from=2024-10-01&to=2024-10-23
GET    /api/analytics/dashboard-metrics
```

**⚠️ IMPORTANT:** Analytics uses **native MongoDB aggregation**, NOT JavaScript `.reduce()`:
```javascript
// ✅ CORRECT (uses database)
const dailyRevenue = await Order.aggregate([
  { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
  { $group: { 
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      revenue: { $sum: "$total" },
      orderCount: { $sum: 1 }
  }},
  { $sort: { _id: 1 } }
]);

// ❌ WRONG (JavaScript reduce)
const revenue = orders.reduce((sum, order) => sum + order.total, 0);
```

### Dashboard
```http
GET    /api/dashboard/business-metrics       # Revenue, orders, trends
GET    /api/dashboard/performance            # API latency, SSE connections
GET    /api/dashboard/assistant-stats        # Intent distribution
```

### Assistant
```http
POST   /api/assistant/chat
Body: { "query": "What is your return policy?", "sessionId": "abc123" }

Response: {
  "success": true,
  "text": "Our return policy allows...",
  "intent": "policy_question",
  "confidence": "high",
  "citations": ["Policy9.1", "Policy9.2"],
  "functionsCalled": [],
  "processingTime": 1234,
  "sessionId": "abc123"
}
```

---

## 🔴 Server-Sent Events (SSE)

### Auto-Status Progression

**Assignment Requirement:**
> "Automatically simulate status progression for testing purposes"

**How It Works:**
```javascript
// When client connects to /api/orders/:id/stream
GET /api/orders/67163abc4f2d9e1a3b5c8f7e/stream

// Server automatically progresses order:
1. Send current status immediately
2. Wait 4-7 seconds → Update to PROCESSING (save DB + send event)
3. Wait 4-7 seconds → Update to SHIPPED (save DB + send event)
4. Wait 4-7 seconds → Update to DELIVERED (save DB + send event + close stream)
```

**Why?**
- No real fulfillment system in this demo
- Allows testing live updates every time you connect
- Database gets updated so data persists

**SSE Format:**
```
data: {"orderId":"...","status":"PROCESSING","carrier":"FedEx",...}

data: {"orderId":"...","status":"SHIPPED","trackingNumber":"TRK...",...}

data: {"orderId":"...","status":"DELIVERED","message":"Order delivered"}
```

---

## 🧪 Testing
```bash
# Run all tests (61+ tests)
npm run test:all

# Individual test suites
npm run test:intent      # Intent classification (32 tests)
npm run test:identity    # Identity protection (6 tests)
npm run test:function    # Function calling (10 tests)
npm run test             # API endpoints (12 tests)
npm run test:integration # End-to-end workflows (3 tests)
```

### Test Coverage

- ✅ **Intent Detection**: 32 tests (5-7 examples per intent)
- ✅ **Identity Protection**: 6 tests (verifies never reveals AI model)
- ✅ **Function Calling**: 10 tests
- ✅ **API Endpoints**: 12 tests
- ✅ **Integration**: 3 complete workflows

**Test User**: `demo@example.com` (Sarah Mitchell)  
**Admin Users**: `gandalf@shoplite.com`, `darth.vader@shoplite.com`, `karl.sassine@shoplite.com`

---

## 📊 Database Schema

### Customers
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  phone: String,
  role: 'user' | 'admin',
  address: {
    street, city, state, zipCode, country
  },
  createdAt: Date
}
```

### Products
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  price: Number,
  category: String,
  tags: [String],
  imageUrl: String,
  stock: Number,
  createdAt: Date
}
```

### Orders
```javascript
{
  _id: ObjectId,
  customerId: ObjectId (ref: Customer),
  items: [{
    productId: ObjectId,
    name: String,
    price: Number,
    quantity: Number
  }],
  total: Number,
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED',
  carrier: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 Troubleshooting

### MongoDB Connection Issues
```bash
# Test connection
node -e "require('./src/db').connectDB().then(() => process.exit(0))"

# Common issues:
# 1. IP not whitelisted → Add 0.0.0.0/0 in Atlas
# 2. Wrong credentials → Check username/password
# 3. Network access → Verify VPN/firewall settings
```

### LLM Endpoint Issues
```bash
# Check if ngrok is running
curl https://your-ngrok-url.ngrok-free.app/health

# Test LLM endpoint
curl -X POST https://your-ngrok-url.ngrok-free.app/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","max_tokens":50}'

# If fails → Assistant uses fallback mode (still works!)
```

### SSE Not Updating
```bash
# Check SSE endpoint
curl -N http://localhost:5000/api/orders/ORDER_ID/stream

# Should see data: {...} events every few seconds
# If no updates → Check order exists and isn't already DELIVERED
```

---

## 📦 Dependencies
```json
{
  "express": "^4.19.2",        // Web framework
  "mongoose": "^8.5.1",        // MongoDB ODM
  "cors": "^2.8.5",            // CORS middleware
  "dotenv": "^16.3.1",         // Environment variables
  "axios": "^1.7.7",           // HTTP client (for LLM)
  "js-yaml": "^4.1.0"          // YAML parser (for prompts.yaml)
}
```

---

## 🏆 Production Features

- ✅ **Error Handling**: Try-catch everywhere, never crashes
- ✅ **Input Validation**: All POST/PUT endpoints validated
- ✅ **Consistent Responses**: Standardized JSON format
- ✅ **Logging**: Console logs for debugging
- ✅ **Graceful Shutdown**: SIGTERM/SIGINT handlers
- ✅ **Rate Limiting**: Tracked via dashboard (optional implementation)
- ✅ **Health Checks**: `/health` endpoint
- ✅ **Metrics**: Performance tracking middleware

---

## 🚀 Deployment

See `docs/deployment-guide.md` for complete deployment instructions.

**Quick Deploy:**
1. Push to GitHub
2. Connect to Render.com/Railway
3. Add environment variables
4. Deploy!

---

## 👤 Author

**Karl Sassine**  
Full Stack Development Course  
Week 5 Assignment - October 2025

---

