# 🔧 SEED FIX — How to Seed the Database

## ❌ Problem
```
npm error Missing script: "seed"
```
or:
```
The "seed" command in package.json doesn't work...
```

---

## ✅ Solution — Simple 3 Commands

```bash
# 1. Make sure you are IN THE BACKEND FOLDER
cd nalco-w2w-backend

# 2. Install dependencies (if not done yet)
npm install

# 3. Run database migrations (creates 12 tables)
npx prisma migrate dev --name init

# 4. Generate Prisma client (required)
npx prisma generate

# 5. 🎯 SEED THE DATABASE — THIS IS THE MAGIC COMMAND
node seed.js

# 6. Start the server
npm run dev
```

---

## 🎯 The Seed Command You Will Actually Use

**USE THIS:**
```
node seed.js
```

**NOT this (doesn't work reliably):**
```
npm run seed
npx prisma db seed
ts-node prisma/seed.ts
```

---

## 📋 Full Complete Setup — Copy-Paste This Block

```bash
# ============================================
# FULL BACKEND SETUP — Copy this into your terminal
# ============================================

# 1. Enter backend folder
cd nalco-w2w-backend

# 2. Install everything
npm install

# 3. Create .env file
cp .env.example .env

# 4. Make sure PostgreSQL is running locally
#    (Or use Docker: see below)

# 5. Create database tables
npx prisma migrate dev --name init

# 6. Generate Prisma client (required)
npx prisma generate

# 7. 🌱 Seed initial data (6 streams, 8 buyers, 8 batches, 1 admin)
node seed.js

# 8. 🚀 Start the server
npm run dev

# 9. Verify it's working:
#    Open: http://localhost:4000/api/health
#    Should return: {"status":"ok"}
```

---

## 🐳 Don't Have PostgreSQL? Use Docker (Easiest)

```bash
# Start PostgreSQL (with PostGIS extension required by Prisma)
docker run --name nalco-postgres \
  -e POSTGRES_DB=nalco_w2w \
  -e POSTGRES_USER=admin \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgis/postgis:16-3.4

# Start Redis (for caching)
docker run --name nalco-redis -p 6379:6379 -d redis:7-alpine

# Now in your .env, make sure DATABASE_URL is:
# DATABASE_URL=postgresql://admin:password@localhost:5432/nalco_w2w
# REDIS_URL=redis://localhost:6379

# Then:
npx prisma migrate dev --name init
node seed.js
npm run dev
```

---

## 🔐 Default Login Credentials (After Seed)

```
Email:    admin@nalco.in
Password: admin123
```

---

## 📊 What Gets Seeded

| Data | Count |
|------|-------|
| Admin users | 1 (admin@nalco.in / admin123) |
| Waste streams | 6 (Red Mud, Fly Ash, SPL, Dross, Caustic, Lime Grit) |
| Batches | 8 (with grades A/A/B, tonnes 180-5100) |
| Buyers | 8 (NHAI, UltraTech, ACC, Jindal, etc.) |
| — Verified | 7 |
| — Pending KYC | 1 |
| Carbon credits | Auto-created when you place orders |

---

## 🔍 Verify the Seed Worked

```bash
# Option 1: Check backend logs — should show:
#    🟢 Client connected: <socket-id>
#    📡 REST API:      http://localhost:4000/api

# Option 2: Test via API (in new terminal)
curl http://localhost:4000/api/inventory/streams
# Should return JSON array with 6 waste streams

# Option 3: Open browser
http://localhost:4000/api/health
# Should return: {"status":"ok","timestamp":"...","version":"2.1.0"}
```

---

## 🚀 If Still Stuck — Simplest Path

```bash
# 1. Close everything
# 2. Delete node_modules folders
# 3. Copy paste these EXACT commands:

cd nalco-w2w-backend
rm -rf node_modules dist .env
npm install
cp .env.example .env
npx prisma migrate dev --name init
npx prisma generate
node seed.js
npm run dev
```

---

## 📱 Full-Stack: Frontend + Backend

```bash
# Terminal 1 — Backend (already running from above on :4000)

# Terminal 2 — Frontend (in PROJECT_FILES/ folder)
cd ..           # or: cd PROJECT_FILES
npm install
echo "VITE_API_URL=http://localhost:4000/api" >> .env
echo "VITE_WS_URL=ws://localhost:4000" >> .env
npm run dev

# Open: http://localhost:5173
```

---

**Done!** You now have a complete full-stack application.
