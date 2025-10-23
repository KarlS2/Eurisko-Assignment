# Shoplite Deployment Guide

**Complete deployment instructions for Week 5 Full Stack E-Commerce Platform**

Author: Karl Sassine  
Last Updated: 20 October 2025

---

## 📋 Overview

This guide covers deploying:
1. **MongoDB Atlas** (Database) 
2. **Backend API** (Render.com/Railway) 
3. **Frontend** (Vercel) 
4. **LLM Endpoint** (Google Colab + ngrok) 

---

## 🗂️ Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Atlas Setup](#1-mongodb-atlas-setup)
3. [LLM Endpoint Setup](#2-llm-endpoint-setup-week-3-colab)
4. [Backend Deployment](#3-backend-deployment)
5. [Frontend Deployment](#4-frontend-deployment)
6. [Environment Variables](#5-environment-variables-reference)
7. [Testing Deployment](#6-testing-deployment)
8. [Troubleshooting](#7-troubleshooting)
9. [Local Development](#8-local-development-setup)

---

## Prerequisites

- ✅ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) - Database
- ✅ [Render.com](https://render.com/)
- ✅ [Vercel](https://vercel.com/) - Frontend hosting
- ✅ [ngrok](https://ngrok.com/) - LLM tunnel
- ✅ [GitHub](https://github.com/) - Code repository
- ✅ [Google Colab](https://colab.research.google.com/) - For LLM deployment

**Required Tools:**
```bash
node --version  # v18+ required
npm --version   # v9+ required
git --version   # Any recent version
```

---

## 1. MongoDB Atlas Setup

### Step 1.1: Create Free Cluster

1. **Go to** [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. **Sign up** with email or Google account
3. **Choose deployment:**
   - Click "Build a Database"
   - Select **M0 FREE** tier
   - Choose cloud provider: **AWS** (recommended)
   - Region: Choose closest to you (e.g., `eu-west-1` for Europe, `us-east-1` for USA)
   - Cluster name: `Shoplite` or keep default
4. **Click "Create"** (takes 3-5 minutes)

### Step 1.2: Configure Database Access

1. **Create Database User:**
   - Go to **Database Access** (left sidebar)
   - Click **"Add New Database User"**
   - Authentication Method: **Password**
   - Username: `shoplite_user` (or your choice)
   - Password: Click **"Autogenerate Secure Password"** and **SAVE IT**
   - Database User Privileges: **Read and write to any database**
   - Click **"Add User"**

2. **Whitelist IP Addresses:**
   - Go to **Network Access** (left sidebar)
   - Click **"Add IP Address"**
   - Click **"Allow Access from Anywhere"**
   - IP Address: `0.0.0.0/0` (auto-filled)
   - Click **"Confirm"**
   
   ⚠️ **Note:** In production, you'd whitelist specific IPs. For this assignment, `0.0.0.0/0` is acceptable.

### Step 1.3: Get Connection String

1. **Go to** **Database** (left sidebar)
2. **Click "Connect"** on your cluster
3. **Choose:** "Connect your application"
4. **Driver:** Node.js
5. **Version:** 5.5 or later
6. **Copy connection string:**
```
   mongodb+srv://shoplite_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```
7. **Replace `<password>`** with your actual password
8. **Add database name** after `.net/`:
```
   mongodb+srv://shoplite_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shoplite?retryWrites=true&w=majority
```

### Step 1.4: Seed Database

-Seed.js file available in the repo

**On your local machine:**
```bash
# Navigate to backend
cd apps/api

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb+srv://shoplite_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/shoplite?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
EOF

# Install dependencies
npm install

# Seed database
node seed.js

# Expected output:
# ✅ Connected to MongoDB
# ✅ Inserted 26 products
# ✅ Inserted 16 customers (3 admins + 13 users)
# ✅ Inserted 18 orders
```

**Verify seeding:**
1. Go to MongoDB Atlas dashboard
2. Click **"Browse Collections"**
3. You should see: `customers`, `products`, `orders` collections with data

---

## 2. LLM Endpoint Setup (Week 3 Colab)

### Prepare Colab Notebook

1. **Open your Week 3 Colab notebook** 
2. **Kept existing code**
3. **Added this new endpoint** at the end (before `app.run()`):
```python
# ADD THIS NEW ENDPOINT FOR WEEK 5
@app.route('/generate', methods=['POST'])
def generate():
    """
    Simple text completion - no RAG, no retrieval
    Week 5 backend does its own grounding, this just completes text
    """
    try:
        data = request.json
        prompt = data.get('prompt', '')
        max_tokens = data.get('max_tokens', 500)
        temperature = data.get('temperature', 0.7)
        
        if not prompt:
            return jsonify({"error": "Prompt is required"}), 400
        
        # Use your existing model (Ollama/LlamaCpp/etc.)
        response = model.generate(
            prompt, 
            max_tokens=max_tokens,
            temperature=temperature
        )
        
        return jsonify({"text": response})
        
    except Exception as e:
        print(f"Generation error: {str(e)}")
        return jsonify({"error": str(e)}), 500

```

4. **Run the notebook** to start Flask server

---

## 3. Backend Deployment

### Deploy to Render.com

#### Step 3.1: Prepare Repository
```bash
# Make sure your code is committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### Step 3.2: Create Render Account

1. Go to [Render.com](https://render.com/)
2. Sign up with GitHub
3. Authorize Render to access your repositories

#### Step 3.3: Create Web Service

1. **Click "New +"** → **"Web Service"**
2. **Connect repository:**
   - Find your repository
   - Click **"Connect"**
3. **Configure service:**
   - **Name:** `shoplite-api` (or your choice)
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Root Directory:** `apps/api`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

#### Step 3.4: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these (example values):

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://shoplite_user:YOUR_PASSWORD@cluster0...` |
| `PORT` | `5000` |
| `NODE_ENV` | `production` |
| `LLM_ENDPOINT` | `https://your-ngrok-url.ngrok-free.app` |
| `ALLOWED_ORIGINS` | `https://your-frontend.vercel.app,http://localhost:3000` |

#### Step 3.5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (3-5 minutes)
3. You'll get a URL like: `https://shoplite-api.onrender.com`

#### Step 3.6: Test Deployment
```bash
# Test health endpoint
curl https://shoplite-api.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"...","uptime":123}

# Test products endpoint
curl https://shoplite-api.onrender.com/api/products?limit=5
```

---


## 4. Frontend Deployment

### Step 4.1: Update API URL

**Edit `/apps/storefront/.env.production`:**
```bash
VITE_API_URL=https://shoplite-api.onrender.com
VITE_DEBUG=false
```

**Commit changes:**
```bash
git add apps/storefront/.env.production
git commit -m "Update production API URL"
git push origin main
```

### Step 4.2: Deploy to Vercel

1. **Go to** [Vercel Dashboard](https://vercel.com/dashboard)
2. **Click "Add New..."** → **"Project"**
3. **Import Git Repository:**
   - Click **"Import"** next to your repo
4. **Configure Project:**
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/storefront`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. **Environment Variables:**
   - Click **"Environment Variables"**
   - Add:
```
     VITE_API_URL = https://shoplite-api.onrender.com
     VITE_DEBUG = false
```
6. **Click "Deploy"**
7. Wait 2-3 minutes
8. You'll get a URL like: `https://shoplite.vercel.app`

#### Via Vercel CLI (Alternative):
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend
cd apps/storefront

# Login
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Set root directory: ./
# - Framework: Vite
# - Build command: npm run build
# - Output directory: dist
```

### Step 4.3: Update CORS

**Update backend `.env` on Render:**
```bash
ALLOWED_ORIGINS=https://shoplite.vercel.app,http://localhost:3000
```

**Redeploy backend** (Render auto-deploys on env change)

### Step 4.4: Test Frontend

1. **Visit:** `https://shoplite.vercel.app`
2. **Test features:**
   - ✅ Browse products
   - ✅ Login with `demo@example.com`
   - ✅ Add to cart
   - ✅ Checkout (creates order)
   - ✅ Order tracking (SSE live updates)
   - ✅ Support chat (Karobot)
   - ✅ Admin dashboard (login as `gandalf@shoplite.com`)

---

## 5. Environment Variables Reference

### Backend (Render)
```bash
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/shoplite

# Server
PORT=5000
NODE_ENV=production

# LLM (ngrok tunnel from Colab)
LLM_ENDPOINT=https://abc123.ngrok-free.app

# CORS
ALLOWED_ORIGINS=https://your-frontend.vercel.app,http://localhost:3000
```

### Frontend (Vercel)
```bash
# API URL (deployed backend)
VITE_API_URL=https://shoplite-api.onrender.com

# Debug mode
VITE_DEBUG=false
```

---

## 6. Testing Deployment

### Complete End-to-End Test
```bash
# 1. Test backend health
curl https://shoplite-api.onrender.com/health

# 2. Test products API
curl https://shoplite-api.onrender.com/api/products?limit=3

# 3. Test customer lookup
curl "https://shoplite-api.onrender.com/api/customers?email=demo@example.com"

# 4. Test assistant
curl -X POST https://shoplite-api.onrender.com/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"What is your return policy?"}'
```

### Frontend Test

**Visit:** `https://shoplite.vercel.app`

1. **Login:**
   - Click account icon
   - Enter: `demo@example.com`
   - Verify: Shows "Sarah Mitchell"

2. **Browse & Purchase:**
   - Browse products
   - Add item to cart
   - Go to checkout
   - Place order
   - Note the order ID

3. **Track Order (SSE):**
   - Go to order status page
   - Watch for live updates (green pulsing dot)
   - Status should progress: PENDING → PROCESSING → SHIPPED → DELIVERED

4. **Test Support Chat:**
   - Click "Support" in header
   - Ask: "What's your return policy?"
   - Verify: Response includes `[Policy9.1]` citation
   - Ask: "Show me laptops"
   - Verify: Products returned

5. **Admin Dashboard:**
   - Logout from `demo@example.com`
   - Login as: `gandalf@shoplite.com`
   - Click "Dashboard" (should appear in header)
   - Verify: All metrics loading
   - Verify: Intent distribution chart visible

---

## 7. Troubleshooting

### Backend Issues

#### "Application failed to respond"

**Cause:** Server not starting or crashed

**Fix:**
1. Check Render/Railway logs:
   - Go to service → Logs tab
   - Look for error messages
2. Common issues:
```
   Error: MONGODB_URI not defined
   → Add MONGODB_URI to environment variables
   
   Error: Cannot find module 'express'
   → Build command needs to be 'npm install'
   
   ECONNREFUSED connecting to MongoDB
   → Check MongoDB IP whitelist (0.0.0.0/0)
   → Verify connection string is correct
```

#### "CORS error" in frontend

**Fix:**
```bash
# Update backend ALLOWED_ORIGINS
ALLOWED_ORIGINS=https://your-actual-frontend.vercel.app,http://localhost:3000

# Redeploy backend
```

#### "LLM endpoint unreachable"

**This is OK!** Assistant uses fallback mode.

**To fix (optional):**
1. Check Colab notebook is running
2. Check ngrok tunnel is active
3. Update `LLM_ENDPOINT` in backend env vars
4. Redeploy backend

### Frontend Issues

#### "Failed to fetch products"

**Cause:** API URL incorrect or CORS issue

**Fix:**
1. Verify `VITE_API_URL` is correct:
   - Vercel Dashboard → Project → Settings → Environment Variables
2. Redeploy:
   - Vercel Dashboard → Deployments → Click "..." → Redeploy

#### "Support chat not working"

**Check:**
1. Backend `/api/assistant/chat` endpoint working:
```bash
   curl -X POST https://your-backend.onrender.com/api/assistant/chat \
     -H "Content-Type: application/json" \
     -d '{"query":"hello"}'
```
2. If LLM endpoint down → Assistant uses fallback (still works!)

#### "SSE not updating"

**Check:**
1. Order exists and isn't already DELIVERED:
```bash
   curl https://your-backend.onrender.com/api/orders/ORDER_ID
```
2. SSE endpoint working:
```bash
   curl -N https://your-backend.onrender.com/api/orders/ORDER_ID/stream
```

### Database Issues

#### "Customer not found" in tests

**Cause:** Database not seeded

**Fix:**
```bash
# Run seed script locally (connected to Atlas)
cd apps/api
node seed.js
```

#### "Can't connect to MongoDB"

**Fix:**
1. Verify IP whitelisted (0.0.0.0/0)
2. Check connection string format:
```
   mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/DATABASE
```
3. Verify password doesn't contain special characters (use autogenerate)

---

## 8. Local Development Setup

### Quick Start
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/shoplite.git
cd shoplite

# Backend setup
cd apps/api
cp .env.example .env
# Edit .env with your MongoDB URI and LLM endpoint
npm install
node seed.js  # Seed database
npm run dev   # Start backend on :5000

# Frontend setup (new terminal)
cd apps/storefront
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:5000
npm install
npm run dev   # Start frontend on :3000
```

### Environment Files

**Backend `.env`:**
```bash
MONGODB_URI=mongodb+srv://...
PORT=5000
NODE_ENV=development
LLM_ENDPOINT=https://your-ngrok.ngrok-free.app
ALLOWED_ORIGINS=http://localhost:3000
```

**Frontend `.env`:**
```bash
VITE_API_URL=http://localhost:5000
VITE_DEBUG=true
```

### Running Tests
```bash
# Backend tests
cd apps/api
npm run test:all

# Expected output:
# Intent Detection: 32/32 passed
# Identity Protection: 6/6 passed
# Function Calling: 10/10 passed
# API Endpoints: 12/12 passed
# Integration: 3/3 passed
# Total: 61+ tests passed ✅
```

---

## 9. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing locally (`npm run test:all`)
- [ ] `.env.example` has no real credentials
- [ ] Code committed to GitHub
- [ ] MongoDB Atlas cluster created and seeded
- [ ] LLM endpoint (Colab + ngrok) running and tested

### Backend Deployment

- [ ] Render/Railway service created
- [ ] Environment variables added (MONGODB_URI, LLM_ENDPOINT, etc.)
- [ ] Build successful
- [ ] Health check working (`/health` returns 200)
- [ ] Products endpoint working (`/api/products`)
- [ ] Assistant endpoint working (`/api/assistant/chat`)

### Frontend Deployment

- [ ] Vercel project created
- [ ] `VITE_API_URL` set to deployed backend
- [ ] Build successful
- [ ] Site loads and shows products
- [ ] Can login with `demo@example.com`
- [ ] Can place order
- [ ] SSE tracking works
- [ ] Support chat works

### Post-Deployment

- [ ] Backend CORS updated with frontend URL
- [ ] End-to-end test completed (browse → order → track → chat)
- [ ] Admin dashboard accessible (login as `gandalf@shoplite.com`)
- [ ] Test user documented in README

---

## 10. Production URLs

```bash
# Backend API
https://livedrop-karlsassine.onrender.com

# Frontend
https://livedrop-karl-sassine.vercel.app

# LLM Endpoint 
https://exculpatory-requitable-ahmad.ngrok-free.dev
```

---

## 📞 Support

**If you encounter issues:**

1. **Check logs first:**
   - Render: Service → Logs tab
   - Vercel: Deployment → Function logs
   - MongoDB: Cluster → Metrics

2. **Common fixes:**
   - Redeploy (fixes 80% of issues)
   - Clear browser cache
   - Check environment variables
   - Verify network access

3. **Still stuck?**
   - Check GitHub Issues
   - Review troubleshooting section above
   - Contact course instructor

---

## ✅ Deployment Complete!

Your full-stack e-commerce platform with intelligent assistant is now live! 🚀

**Test it:**
- Browse products
- Place an order
- Track with SSE live updates
- Chat with Karobot
- View admin dashboard

---

**Last Updated:** October 2025  
**Author:** Karl Sassine  
**Course:** Full Stack Development - Week 5
