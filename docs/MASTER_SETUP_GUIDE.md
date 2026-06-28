# 🏭 NALCO Waste-to-Wealth - COMPLETE FULL-STACK SETUP

## 📂 What's Included (FULL STACK)
```
PROJECT_FILES/
├── MASTER_SETUP_GUIDE.md        ← THIS FILE - Start Here
│
├── 📱 FRONTEND (React 19) ← 22 files
│   ├── index.html, package.json, tsconfig.json, vite.config.ts
│   ├── README.md                 Full feature guide + hackathon pitch
│   ├── COPY_FILES_GUIDE.md       Copy instructions
│   ├── SETUP.sh                  Auto-install script
│   └── src/                      18 files of app source
│       ├── main.tsx, App.tsx, index.css
│       ├── utils/cn.ts
│       ├── data/wasteStreams.ts  All waste streams, batches, buyers, orders
│       ├── hooks/useRealtimeData.ts  Live IoT simulator
│       ├── components/            Sidebar, Header
│       └── pages/                 Dashboard, Ledger, Marketplace, Logistics,
│                                   Carbon, Buyers, SetupGuide
│
├── ⚡ BACKEND (Node.js + Express) ← 12 files
│   ├── package.json, tsconfig.json
│   ├── .env.example
│   ├── Dockerfile, startup.sh
│   ├── README.md                 Complete API docs, WebSocket docs
│   ├── prisma/
│   │   ├── schema.prisma         12 database models
│   │   └── seed.ts               Initial data seeding (6 streams, 8 buyers)
│   └── src/
│       ├── server.ts             Main server (Express + Socket.IO)
│       ├── middleware/auth.ts     JWT + RBAC + rate limiting
│       └── routes/
│           ├── auth.ts           /api/auth/* (login, register, profile)
│           ├── inventory.ts      /api/inventory/* (streams, batches, metrics)
│           └── orders.ts         /api/orders/* (CRUD + status)
│
└── 🚀 DEPLOYMENT
    ├── docker-compose-fullstack.yml   One command: everything together
    ├── Dockerfile.frontend           Frontend Dockerfile (Nginx)
    └── nginx.conf                     Nginx config with API proxy
```

---

## 🚀 Method 1: ONE-COMMAND FULL STACK (Docker - Easiest)

### Prerequisites: Only Docker
→ https://www.docker.com/products/docker-desktop

### Run Everything with One Command
```bash
cd PROJECT_FILES
docker-compose -f docker-compose-fullstack.yml up -d --build
```

### Wait 2-5 minutes (builds everything), then open:
| Service | URL |
|---------|-----|
| 🌐 **Frontend App** | http://localhost:5173 |
| ⚡ **Backend API** | http://localhost:4000/api/health |
| 🗄️ **PostgreSQL** | localhost:5432 (DB: nalco_w2w, User: admin, PW: StrongP@ssw0rd!2025) |
| 🔴 **Redis** | localhost:6379 |

### 📝 Default Admin Login (after auto-seeding)
```
Email:    admin@nalco.in
Password: admin123
```

### Stop Everything
```bash
docker-compose -f docker-compose-fullstack.yml down
```

---

## 🚀 Method 2: Manual Local Setup (No Docker)

### Prerequisites (Install These First)
1. **Node.js** v20+ → https://nodejs.org
2. **PostgreSQL** v16+ with **PostGIS** → https://www.postgresql.org
3. **Redis** v7+ → https://redis.io/download

---

### 🔧 Step 1: Set Up Database (One Time)
```bash
# 1. Start PostgreSQL (create database)
psql -U postgres -c "CREATE DATABASE nalco_w2w;"

# 2. Enable PostGIS (required)
psql -U postgres -d nalco_w2w -c "CREATE EXTENSION postgis;"

# 3. Create Redis-ready (Redis usually auto-runs on :6379)
# Test:
redis-cli ping   # Should print: PONG
```

---

### 🔧 Step 2: Backend Setup
```bash
# 1. Enter backend folder
cd PROJECT_FILES/nalco-w2w-backend

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env:
#   DATABASE_URL=postgresql://admin:password@localhost:5432/nalco_w2w
#   REDIS_URL=redis://localhost:6379
#   JWT_SECRET=your-super-long-secret-key-change-this

# 4. Run database migrations (creates 12 tables)
npx prisma migrate dev --name init

# 5. Seed initial data (6 waste streams, 8 buyers)
npx prisma db seed

# 6. Start backend server (hot reload)
npm run dev

# ✅ Backend running at:  http://localhost:4000
# ✅ WebSocket at:           ws://localhost:4000
# ✅ API health check:      http://localhost:4000/api/health
```

---

### 🔧 Step 3: Frontend Setup (Open New Terminal)
```bash
# 1. Enter frontend folder (PROJECT_FILES/ is the frontend)
cd PROJECT_FILES/

# 2. Install frontend dependencies
npm install

# 3. (Optional) Set backend URL via environment
# Create .env file:
echo "VITE_API_URL=http://localhost:4000/api" >> .env
echo "VITE_WS_URL=ws://localhost:4000" >> .env

# 4. Start frontend
npm run dev

# ✅ Frontend running at:  http://localhost:5173
```

### 🎉 Open in Browser: **http://localhost:5173**

You'll see the full dashboard with live IoT feed!

---

## 🔌 Connecting Frontend ↔ Backend

**The frontend can work in 2 modes:**

### Mode A: Simulated Data (Default - No Backend Needed)
- The app ships with full simulated data
- No database, no backend required
- Live IoT feed is simulated
- **Run: `npm run dev`** — that's all

### Mode B: Real Backend (Full-Stack - Set the env vars)
```bash
# Create PROJECT_FILES/.env with:
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=ws://localhost:4000

# Then restart:
npm run dev
```

**Set these and the app switches from simulated to real data.**

---

## 📡 REST API Quick Reference

### 🔐 Authentication
```bash
# Login → Get JWT token
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nalco.in","password":"admin123"}'

# Register new user
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"buyer@company.in","password":"secure123","name":"Company Buyer","role":"BUYER"}'
```

### 📦 Inventory
```bash
# List waste streams
curl http://localhost:4000/api/inventory/streams

# List batches (with filters)
curl "http://localhost:4000/api/inventory/batches?grade=A&status=AVAILABLE&take=20"

# Get dashboard metrics
curl http://localhost:4000/api/inventory/metrics
```

### 💰 Orders
```bash
# List orders
curl http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create new order
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"buyerId":"BUYER_ID","batchId":"BATCH_ID","tonnes":1500}'
```

### 🌿 Carbon Credits
```bash
# All carbon credits
curl http://localhost:4000/api/carbon

# Filter by buyer
curl "http://localhost:4000/api/carbon?buyerId=BUYER_ID"
```

### 🚚 Logistics
```bash
# Calculate freight + CO2
curl -X POST http://localhost:4000/api/logistics/calculate \
  -H "Content-Type: application/json" \
  -d '{"tonnes":1000,"distanceKM":180,"wasteType":"RED_MUD"}'
```

### 💊 Health
```bash
curl http://localhost:4000/api/health
# Response: {"status":"ok","timestamp":"...","version":"2.1.0"}
```

---

## 🔌 WebSocket Quick Reference

### Connect in browser console:
```javascript
const socket = io('ws://localhost:4000');

socket.on('connect', () => {
  console.log('✅ Connected to backend');
  socket.emit('join:dashboard');
  socket.emit('subscribe:iot');
  socket.emit('subscribe:inventory');
  socket.emit('subscribe:orders');
});

// 📊 Real-time IoT sensor data
socket.on('iot:reading', (data) => {
  console.log('📡 IoT:', data);
});

// 📦 Inventory updates
socket.on('inventory:update', (batches) => {
  console.log('📦 Batches:', batches.length);
});
socket.on('inventory:new', (batch) => {
  console.log('✨ New batch:', batch.batchCode);
});

// 💰 Order updates
socket.on('orders:update', (orders) => {
  console.log('📋 Orders:', orders.length);
});

// 📊 Dashboard metrics
socket.on('metrics:update', (metrics) => {
  console.log('📊 Metrics:', metrics);
});
```

---

## 🗂️ Database Model Map (12 Models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | Auth & profiles | id, email, passwordHash, role (NALCO_ADMIN/BUYER/LOGISTICS/AUDITOR) |
| **WasteStream** | 6 waste types | type, name, avgPricePerMT, carbonFactor, monthlyProd, applications |
| **Batch** | Individual lots | batchCode, tonnes, moisture, ph, grade, status, location, certifications |
| **Buyer** | Companies | company, industry, gstNumber, verified, totalOrdered, totalCarbon, distance |
| **Order** | Purchase orders | orderNumber, buyerId, batchId, tonnes, pricePerMT, totalValue, status |
| **CarbonCredit** | CO₂ credits | orderId, tCO2e, methodology, registry, valueINR, verified |
| **SensorReading** | IoT data (time-series) | batchId, type, value, unit, timestamp |
| **Route** | Highway routes | from, to, distance, highway, avgTime, freight |

---

## 🎯 Business Logic Reference

### Carbon Credit Calculation
```javascript
const factors = {
  RED_MUD: 0.44,        // vs Portland cement clinker
  FLY_ASH: 0.38,        // vs clay mining for bricks
  SPENT_POT_LINING: 0.56, // vs hazardous landfill
  ALUMINIUM_DROSS: 0.72,  // vs primary aluminium smelting
  CAUSTIC_LIQUOR: 0.31,    // vs virgin caustic soda production
  LIME_GRIT: 0.22,        // vs gravel quarrying
};

tCO2e = tonnes * factor;
value_INR = tCO2e * 1500;  // @ ₹1500/tCO₂e (Indian Carbon Market)
```

### Freight Cost Calculation
```javascript
FREIGHT_RATE = ₹4.5 / tonne / km
TRUCK_CAPACITY = 25 tonnes
fuel_per_km = 0.35 liters
co2_kg_per_km = 2.68

freightCost = (tonnes × distanceKM × 4.5) / 25;
truckCount = ceil(tonnes / 25);
fuelNeeded = distanceKM × truckCount × 0.35;
transportCO2 = (distanceKM × truckCount × 2.68) / 1000; // tonnes
```

---

## 🚨 Troubleshooting

### Issue: "Cannot connect to database"
```bash
# Verify PostgreSQL is running
ps aux | grep postgres
# Verify connection
psql -U admin -d nalco_w2w -c "SELECT 1;"
# Check DATABASE_URL format
# postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

### Issue: "Redis connection refused"
```bash
# Start Redis
redis-server &
# Test
redis-cli ping
```

### Issue: "No orders / buyers showing"
```bash
# Ensure you ran the seed
cd nalco-w2w-backend
npx prisma db seed
```

### Issue: "Carbon credits show 0"
```bash
# Carbon credits are auto-created when you create an order.
# Create one via the Marketplace page, or via API:
curl -X POST http://localhost:4000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{"buyerId":"BUYER_ID","batchId":"BATCH_ID","tonnes":1000}'
```

### Issue: Dashboard data not updating in real-time
```bash
# Check:
# 1. Backend is running on port 4000
# 2. Frontend .env has VITE_WS_URL=ws://localhost:4000
# 3. Browser console shows: "Client connected: <socket-id>"
```

---

## 🏆 Hackathon Demo Checklist

- [x] Dashboard: Live KPIs + charts + IoT feed
- [x] Residue Ledger: Filterable batch inventory
- [x] Marketplace: Create orders + live CO₂ preview
- [x] Logistics Hub: Freight calculator + route map
- [x] Carbon Credits: Dashboard + verification standards + buyer leaderboard
- [x] Buyer Network: KYC-verified companies
- [x] Real backend: REST API + WebSocket + PostgreSQL + Redis
- [x] Production Docker: One-command full-stack deployment
- [x] Database: 12 Prisma models with proper relations
- [x] Security: JWT auth + RBAC + rate limiting + bcrypt + Helmet
- [x] 6 Waste Streams: Red Mud, Fly Ash, SPL, Dross, Caustic, Lime Grit

---

## 📞 Quick Reference Cheat Sheet

| Task | Command |
|------|---------|
| **Start backend** | `cd nalco-w2w-backend && npm run dev` |
| **Start frontend** | `cd PROJECT_FILES && npm run dev` |
| **Run full-stack** | `docker-compose -f docker-compose-fullstack.yml up -d` |
| **DB migrations** | `npx prisma migrate dev` |
| **DB seed** | `npx prisma db seed` |
| **Production build** | `npm run build` (frontend) / `tsc` (backend) |
| **Open app** | http://localhost:5173 |
| **Open API** | http://localhost:4000/api/health |
| **Admin login** | admin@nalco.in / admin123 |

---

## 🎉 Success Message

When everything works, your terminal should show:
```
🚀 NALCO W2W Backend Server
============================================================
📡 REST API:      http://localhost:4000/api
🔌 WebSocket:    ws://localhost:4000
🌍 Frontend:     http://localhost:5173
🔋 IoT Simulator: Active (every 3000ms)
============================================================
🗄️  Database connected successfully
🔴 Redis connected successfully
🟢 Client connected: <socket-id>
```

---

**Built for NALCO Damanjodi, Koraput, Odisha**
v2.1.0 · Complete Full-Stack Application
