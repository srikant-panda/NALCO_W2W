# 🏭 NALCO Waste-to-Wealth | B2B Supply Chain Marketplace

A production-grade React dashboard for NALCO's circular economy platform — connecting industrial waste producers with construction companies, cement plants, and road developers.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-blue) ![Vite](https://img.shields.io/badge/Vite-7-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

---

## 📋 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Quick Start (5 Minutes)](#-quick-start-5-minutes)
3. [Detailed VS Code Setup](#-detailed-vs-code-setup)
4. [Project Structure](#-project-structure)
5. [Features Overview](#-features-overview)
6. [Waste Streams Covered](#-waste-streams-covered)
7. [Backend Connection Guide](#-backend-connection-guide)
8. [Troubleshooting](#-troubleshooting)

---

## 🔧 Prerequisites

Before starting, install these on your computer:

### 1. Node.js (v18 or higher)
- **Download:** https://nodejs.org/en/download
- Choose **LTS version** (recommended)
- After install, verify in terminal:
```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### 2. VS Code (Visual Studio Code)
- **Download:** https://code.visualstudio.com/download
- Install for your OS (Windows/Mac/Linux)

### 3. Git (Optional but recommended)
- **Download:** https://git-scm.com/downloads
- Verify: `git --version`

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create the project folder
```bash
# Open terminal/command prompt
mkdir nalco-waste-to-wealth
cd nalco-waste-to-wealth
```

### Step 2: Initialize the project
```bash
npm init -y
```

### Step 3: Install dependencies
```bash
# Core dependencies
npm install react@19.2.6 react-dom@19.2.6 recharts lucide-react clsx tailwind-merge

# Dev dependencies
npm install -D vite@7.3.2 @vitejs/plugin-react @tailwindcss/vite tailwindcss typescript @types/react @types/react-dom @types/node vite-plugin-singlefile
```

### Step 4: Copy all project files
Copy every file from this `PROJECT_FILES` folder into your `nalco-waste-to-wealth` folder, maintaining the exact folder structure shown below.

### Step 5: Run the project
```bash
npm run dev
```

### Step 6: Open in browser
Visit: **http://localhost:5173**

🎉 **Done!** You should see the full dashboard.

---

## 🖥️ Detailed VS Code Setup

### Step 1: Open VS Code
```
Launch VS Code → File → Open Folder → Select "nalco-waste-to-wealth"
```

### Step 2: Install Recommended Extensions
Open Extensions panel (`Ctrl+Shift+X` on Windows, `Cmd+Shift+X` on Mac) and install:

| Extension | Publisher | Purpose |
|-----------|-----------|---------|
| **ES7+ React/Redux** | dsznajder | React snippets & shortcuts |
| **Tailwind CSS IntelliSense** | Tailwind Labs | Tailwind class autocomplete |
| **TypeScript Importer** | pmneo | Auto-import TypeScript |
| **Prettier** | Prettier | Code formatting |
| **Error Lens** | Alexander | Inline error display |
| **Auto Rename Tag** | Jun Han | Auto-rename HTML/JSX tags |

### Step 3: Open Integrated Terminal
```
Press: Ctrl + ` (backtick)  OR  View → Terminal
```

### Step 4: Install Dependencies
In the VS Code terminal, run:
```bash
npm install
```

### Step 5: Start Development Server
```bash
npm run dev
```

You'll see output like:
```
  VITE v7.3.2  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.x.x:5173/
  ➜  press h + enter to show help
```

### Step 6: Open in Browser
- `Ctrl+Click` on `http://localhost:5173/` in the terminal
- OR manually open your browser and type the URL

### Step 7: Build for Production
```bash
npm run build
```
This creates a `dist/` folder with production files.

### Step 8: Preview Production Build
```bash
npm run preview
```

---

## 📁 Project Structure

```
nalco-waste-to-wealth/
│
├── index.html                      # HTML entry point
├── package.json                    # Dependencies & scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
│
├── src/
│   ├── main.tsx                    # React root mount
│   ├── App.tsx                     # Main app (page router)
│   ├── index.css                   # Global styles + Tailwind
│   │
│   ├── components/
│   │   ├── Sidebar.tsx             # Collapsible navigation sidebar
│   │   └── Header.tsx              # Top header with live ticker
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx           # Command Center with KPIs & charts
│   │   ├── Ledger.tsx              # Residue Ledger (batch inventory)
│   │   ├── Marketplace.tsx         # B2B order management
│   │   ├── Logistics.tsx           # Route mapping & freight calculator
│   │   ├── Carbon.tsx              # Carbon credits dashboard
│   │   ├── Buyers.tsx              # Buyer network registry
│   │   └── SetupGuide.tsx          # Backend connection documentation
│   │
│   ├── data/
│   │   └── wasteStreams.ts         # All mock data (streams, batches, buyers, orders)
│   │
│   ├── hooks/
│   │   └── useRealtimeData.ts     # Simulated real-time IoT data hook
│   │
│   └── utils/
│       └── cn.ts                   # Tailwind class merge utility
│
└── dist/                           # (Generated after build)
    └── index.html                  # Production single-file output
```

---

## ✨ Features Overview

### 7 Complete Pages:

| Page | Description |
|------|-------------|
| 🎯 **Dashboard** | Live KPIs, revenue chart, waste distribution pie, carbon bar chart, IoT sensor feed |
| 📒 **Residue Ledger** | Full batch inventory with filters, search, quality data, certifications |
| 🛒 **Marketplace** | Create orders with live pricing, CO₂ preview, freight estimate |
| 🚛 **Logistics Hub** | Route map, freight calculator, active shipment tracking |
| 🌿 **Carbon Credits** | Total CO₂ saved, credit value, verification standards, buyer leaderboard |
| 👥 **Buyer Network** | Buyer cards with KYC, waste interests, ratings, contact info |
| 🔧 **Setup Guide** | Complete backend connection code with copy button |

### Real-Time Features (Simulated):
- IoT sensor feed updates every 3 seconds
- Live stockpile ticker in header
- Dynamic batch data fluctuation
- Order creation updates ledger in real-time

---

## ♻️ Waste Streams Covered

| # | Stream | Price/MT | CO₂ Factor | Applications |
|---|--------|----------|------------|-------------|
| 🔴 | Red Mud | ₹350 | 0.44 tCO₂e | Bricks, Cement, Highway |
| ⚫ | Fly Ash | ₹180 | 0.38 tCO₂e | Bricks, PPC Cement, Roads |
| ⬛ | Spent Pot Lining | ₹520 | 0.56 tCO₂e | Cement Kiln, Carbon Recovery |
| 🔘 | Aluminium Dross | ₹890 | 0.72 tCO₂e | Secondary Al, Refractories |
| 🟡 | Spent Caustic | ₹220 | 0.31 tCO₂e | Water Treatment, Paper |
| ⚪ | Lime Grit | ₹120 | 0.22 tCO₂e | Soil Amendment, Cement |

---

## 🔌 Backend Connection Guide

The app currently runs with **simulated data**. To connect a real backend:

1. Navigate to the **"Setup Guide"** tab in the running app
2. Follow the 7-step guide with copy-paste code blocks
3. Key technologies for backend:
   - **Node.js + Express** (REST API)
   - **Socket.IO** (WebSocket real-time)
   - **PostgreSQL + Prisma** (Database)
   - **JWT** (Authentication)
   - **Redis** (Caching)
   - **Docker Compose** (Deployment)

---

## ❓ Troubleshooting

### "npm: command not found"
→ Node.js is not installed. Download from https://nodejs.org

### "Port 5173 is already in use"
→ Kill the existing process or change port:
```bash
npm run dev -- --port 3000
```

### "Module not found" errors
→ Re-install dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript errors in VS Code
→ Restart TypeScript server:
```
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Blank page on browser
→ Check terminal for errors, ensure you're at http://localhost:5173

### Build fails
```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

---

## 📝 NPM Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (hot-reload) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

---

## 🏆 Hackathon Pitch Points

| Criterion | Your Angle |
|-----------|-----------|
| **Circular Economy** | NALCO's liability → ₹350/MT revenue stream |
| **Scalability** | Replicable to all 4 alumina refineries in India |
| **Carbon Story** | CCTS-eligible credits = second revenue stream |
| **Real Buyers** | NHAI, ACC, UltraTech have real procurement needs |
| **Tech Stack** | Modern React + real-time IoT + WebSocket |

---

## 📜 License

MIT License — Free to use for hackathon and educational purposes.

---

**Built with ❤️ for NALCO Damanjodi, Koraput, Odisha**
