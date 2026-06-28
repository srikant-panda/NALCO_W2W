# 🏭 NALCO Waste-to-Wealth | B2B Circular Economy Marketplace

NALCO Waste-to-Wealth is a full-stack circular economy platform connecting industrial waste producers with construction companies, cement plants, and road developers. It tracks, maps, and facilitates transactions for industrial byproducts (like Red Mud, Fly Ash, and Spent Pot Lining) while tracking carbon offsets.

---

## 📂 Project Structure

```text
waste-to-wealth-marketplace/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS
├── backend/              # Node.js + Express + Prisma ORM + Socket.IO
├── docs/                 # Original reference guides and hackathon resources
├── docker-compose.yml    # Combined Docker compose configuration
└── README.md             # This setup and run guide
```

---

## ⚙️ Prerequisites

Ensure the following are installed locally:
- **Node.js** (v20 or higher)
- **PostgreSQL** (v16 or higher) with **PostGIS** extension
- **Redis** (v7 or higher)
- _OR_ **Docker / Docker Desktop** (replaces local DB, Redis, and setup requirements)

---

## 🔑 Default Login Credentials
After seeding the database, use the following credentials to log in:
- **Email:** `admin@nalco.in`
- **Password:** `admin123`

---

## 🐳 Quick Start: Run via Docker (Recommended)

To run the entire full-stack application (Frontend + Backend + PostgreSQL + Redis) in one command:

```bash
# From the project root directory:
docker-compose up -d --build
```

Once building and startup completes (usually 2–3 minutes):
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:4000/api/health](http://localhost:4000/api/health)
- **PostgreSQL Database:** `localhost:5432` (DB: `nalco_w2w`, User: `admin`, Password: `StrongP@ssw0rd!2025`)
- **Redis Cache:** `localhost:6379`

To stop all services:
```bash
docker-compose down
```

---

## 🔧 Manual Setup (No Docker)

### Step 1: Initialize Database & Cache
1. Ensure PostgreSQL is running. Create the database:
   ```bash
   psql -U postgres -c "CREATE DATABASE nalco_w2w;"
   ```
2. Enable PostGIS:
   ```bash
   psql -U postgres -d nalco_w2w -c "CREATE EXTENSION postgis;"
   ```
3. Ensure Redis is running:
   ```bash
   redis-cli ping   # Should return "PONG"
   ```

### Step 2: Set Up & Run Backend
1. Navigate to the backend folder and install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env
   ```
   _Make sure the `DATABASE_URL` and `REDIS_URL` in `.env` match your local setup credentials._
3. Initialize the database schema & seed initial data:
   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   node seed.js
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```
   - **Backend API:** [http://localhost:4000/api](http://localhost:4000/api)
   - **API Health:** [http://localhost:4000/api/health](http://localhost:4000/api/health)

### Step 3: Set Up & Run Frontend
1. In a new terminal, navigate to the frontend folder and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Create an environment file:
   ```bash
   echo "VITE_API_URL=http://localhost:4000/api" >> .env
   echo "VITE_WS_URL=ws://localhost:4000" >> .env
   ```
3. Start the dev server:
   ```bash
   npm run dev
   ```
   - **Frontend App:** [http://localhost:5173](http://localhost:5173)

---

## 🌿 Core Business Logic References

### Carbon Credit Calculation
```javascript
tCO2e = tonnes * factor;
value_INR = tCO2e * 1500;  // @ ₹1500/tCO₂e (Indian Carbon Market rate)
```
- **Red Mud Factor:** `0.44 tCO2e/MT`
- **Fly Ash Factor:** `0.38 tCO2e/MT`
- **Spent Pot Lining (SPL) Factor:** `0.56 tCO2e/MT`
- **Aluminium Dross Factor:** `0.72 tCO2e/MT`

### Freight Cost Calculation
```javascript
freightCost = (tonnes * distanceKM * 4.5) / 25;
truckCount = Math.ceil(tonnes / 25);
fuelNeeded = distanceKM * truckCount * 0.35; // Liters
transportCO2 = (distanceKM * truckCount * 2.68) / 1000; // tCO2e
```
