import { useState } from "react";
import { ChevronDown, ChevronRight, Server, Database, Globe, Shield, Zap, GitBranch, Layers, Terminal, CheckCircle2, Copy } from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative group mt-2 mb-4">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-lg border-b border-slate-700">
        <span className="text-[10px] text-slate-400 font-mono uppercase">{language}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <Copy size={10} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="bg-slate-900 p-4 rounded-b-lg overflow-x-auto text-[11px] leading-relaxed text-slate-300 font-mono">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SetupGuide() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["architecture"]));

  const toggle = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const sections: Section[] = [
    {
      id: "architecture",
      title: "System Architecture Overview",
      icon: <Layers size={16} className="text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            Current backend in this repository: FastAPI + SQLAlchemy + Alembic. The older Express/Prisma notes in this guide are legacy hackathon material.
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
            <h4 className="text-sm font-bold text-slate-800 mb-3">Full-Stack Architecture</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-bold text-blue-700 mb-2">🖥️ Frontend (This App)</div>
                <ul className="space-y-1 text-slate-600">
                  <li>• React 19 + TypeScript</li>
                  <li>• TailwindCSS 4</li>
                  <li>• Recharts (charts)</li>
                  <li>• Lucide Icons</li>
                  <li>• Vite 7 (build tool)</li>
                  <li>• WebSocket client</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-bold text-emerald-700 mb-2">⚡ Backend (Implemented)</div>
                <ul className="space-y-1 text-slate-600">
                  <li>• FastAPI + Uvicorn</li>
                  <li>• Native WebSockets (real-time)</li>
                  <li>• JWT Authentication</li>
                  <li>• SQLAlchemy ORM</li>
                  <li>• Alembic migrations</li>
                  <li>• REST + WebSocket APIs</li>
                </ul>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="font-bold text-purple-700 mb-2">🗄️ Database</div>
                <ul className="space-y-1 text-slate-600">
                  <li>• PostgreSQL 16+</li>
                  <li>• PostGIS extension</li>
                  <li>• Async SQLAlchemy engine</li>
                  <li>• Alembic migrations</li>
                  <li>• WebSocket-backed IoT feed</li>
                  <li>• Seeded starter data</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-4 border border-slate-200">
            <strong>Data Flow:</strong> Backend API and WebSockets → PostgreSQL via SQLAlchemy → React dashboard with live polling and WebSocket refreshes.
          </div>
        </div>
      ),
    },
    {
      id: "backend-setup",
      title: "Step 1: Backend Project Setup",
      icon: <Server size={16} className="text-emerald-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">Set up the FastAPI backend with virtualenv, dependencies, and environment config:</p>
          <CodeBlock
            language="bash"
            code={`# Create backend virtual environment
cd backend
python3.11 -m venv .venv
source .venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Prepare environment config
cp .env.example .env

# Run database migrations and seed data
alembic upgrade head
python seed.py

# Start the API server
uvicorn app.main:app --reload --host 0.0.0.0 --port 4000`}
          />
          <CodeBlock
            language="text"
            code={`📁 backend/
├── app/
│   ├── main.py               # FastAPI entry point
│   ├── routers/              # REST routes
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic request/response models
│   ├── websocket/            # WebSocket manager + IoT simulator
│   ├── dependencies/         # DB and auth dependencies
│   └── utils/                # Serializers and calculators
├── alembic/                  # Migration scripts
├── seed.py                   # Bootstrap data
├── requirements.txt
└── pyproject.toml`}
          />
        </div>
      ),
    },
    {
      id: "database",
      title: "Step 2: Database Schema (SQLAlchemy)",
      icon: <Database size={16} className="text-purple-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">The production schema lives in SQLAlchemy models and Alembic migrations:</p>
          <CodeBlock
            language="prisma"
            code={`// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  NALCO_ADMIN
  BUYER
  LOGISTICS
  AUDITOR
}

enum BatchStatus {
  AVAILABLE
  RESERVED
  IN_TRANSIT
  DELIVERED
  REJECTED
}

enum OrderStatus {
  PENDING
  CONFIRMED
  DISPATCHED
  DELIVERED
  CANCELLED
}

enum WasteType {
  RED_MUD
  FLY_ASH
  SPENT_POT_LINING
  ALUMINIUM_DROSS
  CAUSTIC_LIQUOR
  LIME_GRIT
}

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  role         Role     @default(BUYER)
  companyId    String?
  company      Buyer?   @relation(fields: [companyId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model WasteStream {
  id               String   @id @default(uuid())
  type             WasteType @unique
  name             String
  chemicalFormula  String
  source           String
  avgPricePerMT    Float
  carbonFactor     Float    // tCO2e per MT
  monthlyProd      Float
  applications     String[]
  batches          Batch[]
  createdAt        DateTime @default(now())
}

model Batch {
  id              String      @id @default(uuid())
  batchCode       String      @unique
  wasteStreamId   String
  wasteStream     WasteStream @relation(fields: [wasteStreamId], references: [id])
  tonnes          Float
  moisture        Float
  ph              Float
  grade           String      // A, B, C
  status          BatchStatus @default(AVAILABLE)
  location        String
  treatmentMethod String
  certifications  String[]
  sensorData      SensorReading[]
  orders          Order[]
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([status, wasteStreamId])
}

model Buyer {
  id            String  @id @default(uuid())
  company       String
  industry      String
  location      String
  state         String
  latitude      Float?
  longitude     Float?
  distance      Float   // km from Damanjodi
  verified      Boolean @default(false)
  gstNumber     String  @unique
  contactPerson String
  phone         String
  email         String
  rating        Float   @default(0)
  users         User[]
  orders        Order[]
  carbonCredits CarbonCredit[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Order {
  id                String      @id @default(uuid())
  orderNumber       String      @unique
  buyerId           String
  buyer             Buyer       @relation(fields: [buyerId], references: [id])
  batchId           String
  batch             Batch       @relation(fields: [batchId], references: [id])
  tonnes            Float
  pricePerMT        Float
  totalValue        Float
  freightCost       Float
  distance          Float
  highway           String
  truckCount        Int
  status            OrderStatus @default(PENDING)
  estimatedDelivery DateTime?
  actualDelivery    DateTime?
  carbonCredits     CarbonCredit?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  @@index([status, buyerId])
}

model CarbonCredit {
  id           String   @id @default(uuid())
  orderId      String   @unique
  order        Order    @relation(fields: [orderId], references: [id])
  buyerId      String
  buyer        Buyer    @relation(fields: [buyerId], references: [id])
  tCO2e        Float
  methodology  String   @default("ISO-14064-2:2019")
  registry     String   @default("ICM")
  valueINR     Float
  verified     Boolean  @default(false)
  certificateUrl String?
  createdAt    DateTime @default(now())
}

model SensorReading {
  id        String   @id @default(uuid())
  batchId   String
  batch     Batch    @relation(fields: [batchId], references: [id])
  type      String   // moisture, ph, temperature, weight
  value     Float
  unit      String
  timestamp DateTime @default(now())

  @@index([batchId, timestamp])
}

model Route {
  id       String @id @default(uuid())
  from     String
  to       String
  distance Float
  highway  String
  avgTime  String
  freight  Float  // per MT per km
}`}
          />
          <CodeBlock
            language="bash"
            code={`# Run migrations
alembic upgrade head

# Seed database
python seed.py`}
          />
        </div>
      ),
    },
    {
      id: "server",
      title: "Step 3: FastAPI Server with WebSocket",
      icon: <Zap size={16} className="text-amber-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">Main server with REST API + native WebSocket real-time:</p>
          <CodeBlock
            language="typescript"
            code={`// src/server.ts
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import inventoryRoutes from './routes/inventory';
import orderRoutes from './routes/orders';
import carbonRoutes from './routes/carbon';
import logisticsRoutes from './routes/logistics';
import buyerRoutes from './routes/buyers';
import authRoutes from './routes/auth';
import { setupWebSocket } from './websocket/handlers';
import { startIoTSimulator } from './services/iotSimulator';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/carbon', carbonRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/buyers', buyerRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), version: '2.1.0' });
});

// WebSocket handlers
setupWebSocket(io);

// Start IoT simulator (pushes data via WebSocket)
startIoTSimulator(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(\`🚀 NALCO W2W Backend running on port \${PORT}\`);
  console.log(\`📡 WebSocket server ready\`);
  console.log(\`🔌 IoT simulator active\`);
});`}
          />
          <CodeBlock
            language="typescript"
            code={`// src/websocket/handlers.ts
import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function setupWebSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log('Client connected:', socket.id);

    // Join rooms based on role
    socket.on('join:dashboard', () => {
      socket.join('dashboard');
      console.log(\`\${socket.id} joined dashboard room\`);
    });

    socket.on('join:logistics', () => {
      socket.join('logistics');
    });

    // Real-time inventory subscription
    socket.on('subscribe:inventory', async () => {
      const batches = await prisma.batch.findMany({
        include: { wasteStream: true },
        orderBy: { createdAt: 'desc' },
      });
      socket.emit('inventory:update', batches);
    });

    // Real-time order updates
    socket.on('subscribe:orders', async () => {
      const orders = await prisma.order.findMany({
        include: { buyer: true, batch: { include: { wasteStream: true } } },
        orderBy: { createdAt: 'desc' },
      });
      socket.emit('orders:update', orders);
    });

    // IoT sensor data stream
    socket.on('subscribe:iot', () => {
      socket.join('iot-feed');
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
}`}
          />
          <CodeBlock
            language="typescript"
            code={`// src/services/iotSimulator.ts
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function startIoTSimulator(io: Server) {
  setInterval(async () => {
    // Simulate sensor readings
    const batches = await prisma.batch.findMany({
      where: { status: 'AVAILABLE' },
      include: { wasteStream: true },
    });

    if (batches.length === 0) return;

    const batch = batches[Math.floor(Math.random() * batches.length)];

    const sensorTypes = [
      { type: 'moisture', value: batch.moisture + (Math.random() * 2 - 1), unit: '%' },
      { type: 'ph', value: batch.ph + (Math.random() * 0.5 - 0.25), unit: '' },
      { type: 'temperature', value: 25 + Math.random() * 15, unit: '°C' },
      { type: 'weight', value: batch.tonnes + Math.random() * 50 - 25, unit: 'MT' },
    ];

    const sensor = sensorTypes[Math.floor(Math.random() * sensorTypes.length)];

    // Store in TimescaleDB
    const reading = await prisma.sensorReading.create({
      data: {
        batchId: batch.id,
        type: sensor.type,
        value: sensor.value,
        unit: sensor.unit,
      },
    });

    // Push to all WebSocket clients in iot-feed room
    io.to('iot-feed').emit('iot:reading', {
      batchCode: batch.batchCode,
      wasteStream: batch.wasteStream.name,
      ...sensor,
      timestamp: reading.timestamp,
    });

    // Update batch moisture/weight if applicable
    if (sensor.type === 'moisture') {
      await prisma.batch.update({
        where: { id: batch.id },
        data: { moisture: sensor.value },
      });
    }

    // Push updated metrics to dashboard
    const metrics = await calculateMetrics();
    io.to('dashboard').emit('metrics:update', metrics);
  }, 3000); // Every 3 seconds
}

async function calculateMetrics() {
  const [stockpile, revenue, carbonTotal, activeOrders] = await Promise.all([
    prisma.batch.aggregate({
      where: { status: 'AVAILABLE' },
      _sum: { tonnes: true },
    }),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: { totalValue: true },
    }),
    prisma.carbonCredit.aggregate({
      _sum: { tCO2e: true },
    }),
    prisma.order.count({
      where: { status: { in: ['DISPATCHED', 'CONFIRMED'] } },
    }),
  ]);

  return {
    totalStockpile: stockpile._sum.tonnes || 0,
    totalRevenue: revenue._sum.totalValue || 0,
    totalCarbonSaved: carbonTotal._sum.tCO2e || 0,
    activeOrders,
    lastUpdate: new Date(),
  };
}`}
          />
        </div>
      ),
    },
    {
      id: "routes",
      title: "Step 4: REST API Routes",
      icon: <GitBranch size={16} className="text-cyan-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">Complete API route implementations:</p>
          <CodeBlock
            language="typescript"
            code={`// src/routes/inventory.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/inventory - List all batches
router.get('/', async (req, res) => {
  try {
    const { wasteType, status, grade } = req.query;
    const where: any = {};
    if (wasteType) where.wasteStream = { type: wasteType };
    if (status) where.status = status;
    if (grade) where.grade = grade;

    const batches = await prisma.batch.findMany({
      where,
      include: {
        wasteStream: true,
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 5, // latest 5 readings
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Aggregate stats
    const stats = {
      totalBatches: batches.length,
      availableStock: batches
        .filter(b => b.status === 'AVAILABLE')
        .reduce((sum, b) => sum + b.tonnes, 0),
      gradeA: batches.filter(b => b.grade === 'A').length,
      inTransit: batches.filter(b => b.status === 'IN_TRANSIT').length,
    };

    res.json({ batches, stats });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

// POST /api/inventory - Create new batch (admin only)
router.post('/', authenticate, authorize('NALCO_ADMIN'), async (req, res) => {
  try {
    const { wasteStreamId, tonnes, moisture, ph, grade, location, treatmentMethod, certifications } = req.body;

    // Auto-generate batch code
    const ws = await prisma.wasteStream.findUnique({ where: { id: wasteStreamId } });
    const count = await prisma.batch.count({ where: { wasteStreamId } });
    const prefix = ws?.type.slice(0, 2).toUpperCase() || 'XX';
    const batchCode = \`\${prefix}-\${new Date().getFullYear()}-\${String(count + 1).padStart(4, '0')}\`;

    const batch = await prisma.batch.create({
      data: {
        batchCode,
        wasteStreamId,
        tonnes,
        moisture,
        ph,
        grade,
        location,
        treatmentMethod,
        certifications,
      },
      include: { wasteStream: true },
    });

    res.status(201).json(batch);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create batch' });
  }
});

export default router;`}
          />
          <CodeBlock
            language="typescript"
            code={`// src/routes/orders.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { calculateCarbonCredits } from '../services/carbonEngine';

const router = Router();
const prisma = new PrismaClient();

// POST /api/orders - Create new order
router.post('/', authenticate, async (req, res) => {
  try {
    const { buyerId, batchId, tonnes } = req.body;

    const batch = await prisma.batch.findUnique({
      where: { id: batchId },
      include: { wasteStream: true },
    });
    const buyer = await prisma.buyer.findUnique({ where: { id: buyerId } });

    if (!batch || !buyer) return res.status(404).json({ error: 'Not found' });
    if (batch.status !== 'AVAILABLE') return res.status(400).json({ error: 'Batch not available' });
    if (tonnes > batch.tonnes) return res.status(400).json({ error: 'Insufficient stock' });

    const pricePerMT = batch.wasteStream.avgPricePerMT;
    const totalValue = tonnes * pricePerMT;
    const freightCost = tonnes * buyer.distance * 4.5 / 25;
    const truckCount = Math.ceil(tonnes / 25);

    // Calculate carbon credits
    const carbon = calculateCarbonCredits(tonnes, batch.wasteStream.type);

    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const ord = await tx.order.create({
        data: {
          orderNumber: \`ORD-\${Date.now()}\`,
          buyerId,
          batchId,
          tonnes,
          pricePerMT,
          totalValue,
          freightCost,
          distance: buyer.distance,
          highway: 'NH-26', // from routing engine
          truckCount,
          estimatedDelivery: new Date(Date.now() + buyer.distance * 100000),
        },
      });

      // Update batch status
      await tx.batch.update({
        where: { id: batchId },
        data: { status: 'RESERVED' },
      });

      // Create carbon credit record
      await tx.carbonCredit.create({
        data: {
          orderId: ord.id,
          buyerId,
          tCO2e: carbon.tCO2e,
          valueINR: carbon.valueINR,
          methodology: carbon.methodology,
        },
      });

      return ord;
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

export default router;`}
          />
          <CodeBlock
            language="typescript"
            code={`// src/services/carbonEngine.ts
const CARBON_FACTORS: Record<string, number> = {
  RED_MUD: 0.44,           // tCO₂e per MT vs virgin cement
  FLY_ASH: 0.38,           // tCO₂e per MT vs clay mining
  SPENT_POT_LINING: 0.56,  // tCO₂e per MT vs landfill
  ALUMINIUM_DROSS: 0.72,   // tCO₂e per MT vs primary smelting
  CAUSTIC_LIQUOR: 0.31,    // tCO₂e per MT vs virgin caustic
  LIME_GRIT: 0.22,         // tCO₂e per MT vs quarrying
};

const ICM_RATE = 1500; // ₹ per tCO₂e on Indian Carbon Market

export function calculateCarbonCredits(tonnes: number, wasteType: string) {
  const factor = CARBON_FACTORS[wasteType] || 0.3;
  const tCO2e = tonnes * factor;
  const valueINR = tCO2e * ICM_RATE;

  return {
    tCO2e: Math.round(tCO2e * 100) / 100,
    valueINR: Math.round(valueINR),
    factor,
    methodology: 'ISO-14064-2:2019',
    registry: 'Indian Carbon Market (ICM)',
    verifier: 'Bureau Veritas India',
  };
}

// src/services/routingEngine.ts
export function calculateRoute(buyerLat: number, buyerLng: number) {
  // Damanjodi coordinates
  const DAMANJODI = { lat: 18.7725, lng: 83.1163 };

  // Haversine distance
  const R = 6371;
  const dLat = (buyerLat - DAMANJODI.lat) * Math.PI / 180;
  const dLng = (buyerLng - DAMANJODI.lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) ** 2 + Math.cos(DAMANJODI.lat * Math.PI / 180)
    * Math.cos(buyerLat * Math.PI / 180) * Math.sin(dLng/2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c * 1.3; // 1.3x road factor

  const freightPerMTPerKm = 4.5;
  const avgSpeed = 45; // km/h
  const hours = distance / avgSpeed;

  return {
    distanceKm: Math.round(distance),
    estimatedTime: \`\${Math.floor(hours)}h \${Math.round((hours % 1) * 60)}m\`,
    freightPerMT: Math.round(distance * freightPerMTPerKm / 25),
    carbonEmission: Math.round(distance * 2.68 / 1000 * 100) / 100,
  };
}`}
          />
        </div>
      ),
    },
    {
      id: "auth",
      title: "Step 5: JWT Authentication & RBAC",
      icon: <Shield size={16} className="text-red-500" />,
      content: (
        <div className="space-y-3">
          <CodeBlock
            language="typescript"
            code={`// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  role: string;
  companyId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// src/routes/auth.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

router.post('/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, passwordHash, name, role },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email, name, role } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !await bcrypt.compare(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, companyId: user.companyId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;`}
          />
        </div>
      ),
    },
    {
      id: "frontend-connect",
      title: "Step 6: Connect Frontend ↔ Backend",
      icon: <Globe size={16} className="text-indigo-500" />,
      content: (
        <div className="space-y-3">
          <p className="text-xs text-slate-600">Replace the simulated data in this frontend with real API calls:</p>
          <CodeBlock
            language="typescript"
            code={`// src/lib/api.ts — Frontend API Client
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = localStorage.getItem('w2w_token');
  const res = await fetch(\`\${API_BASE}\${endpoint}\`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: \`Bearer \${token}\` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Inventory
export const getInventory = () => fetchAPI('/inventory');
export const createBatch = (data: any) =>
  fetchAPI('/inventory', { method: 'POST', body: JSON.stringify(data) });

// Orders
export const getOrders = () => fetchAPI('/orders');
export const createOrder = (data: any) =>
  fetchAPI('/orders', { method: 'POST', body: JSON.stringify(data) });

// Carbon
export const getCarbonCredits = () => fetchAPI('/carbon');
export const getCarbonByBuyer = (buyerId: string) => fetchAPI(\`/carbon/\${buyerId}\`);

// Logistics
export const getRoute = (buyerId: string) => fetchAPI(\`/logistics/route/\${buyerId}\`);

// Auth
export const login = (email: string, password: string) =>
  fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });`}
          />
          <CodeBlock
            language="typescript"
            code={`// src/lib/socket.ts — WebSocket Client
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:4000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    this.socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('w2w_token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('🔌 WebSocket connected');
      this.socket?.emit('join:dashboard');
      this.socket?.emit('subscribe:iot');
    });

    return this.socket;
  }

  // Subscribe to real-time IoT feed
  onIoTReading(callback: (data: any) => void) {
    this.socket?.on('iot:reading', callback);
  }

  // Subscribe to metrics updates
  onMetricsUpdate(callback: (data: any) => void) {
    this.socket?.on('metrics:update', callback);
  }

  // Subscribe to order updates
  onOrderUpdate(callback: (data: any) => void) {
    this.socket?.on('orders:update', callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();`}
          />
          <CodeBlock
            language="typescript"
            code={`// Modified useRealtimeData hook with WebSocket
// Replace the simulated interval with real WebSocket data:

import { useEffect, useState } from 'react';
import { socketService } from '../lib/socket';
import { getInventory, getOrders } from '../lib/api';

export function useRealtimeData() {
  const [batches, setBatches] = useState([]);
  const [orders, setOrders] = useState([]);
  const [iotFeed, setIotFeed] = useState([]);
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Initial data fetch
    getInventory().then(data => setBatches(data.batches));
    getOrders().then(data => setOrders(data));

    // Connect WebSocket
    const socket = socketService.connect();

    // Real-time IoT feed
    socketService.onIoTReading((reading) => {
      setIotFeed(prev => [
        {
          time: new Date(reading.timestamp).toLocaleTimeString(),
          event: \`\${reading.wasteStream} \${reading.type} sensor\`,
          value: \`\${reading.value.toFixed(1)}\${reading.unit}\`,
        },
        ...prev.slice(0, 19),
      ]);
    });

    // Real-time metrics
    socketService.onMetricsUpdate(setMetrics);

    // Real-time order updates
    socketService.onOrderUpdate(setOrders);

    return () => socketService.disconnect();
  }, []);

  return { batches, orders, metrics, iotFeed };
}`}
          />
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-200 text-xs text-amber-800">
            <strong>⚠️ Environment Variables Needed:</strong>
            <div className="mt-2 font-mono bg-white/50 rounded p-2">
              VITE_API_URL=http://localhost:4000/api<br />
              VITE_WS_URL=http://localhost:4000
            </div>
            <p className="mt-2">Install Socket.IO client: <code className="bg-white/50 px-1 rounded">npm install socket.io-client</code></p>
          </div>
        </div>
      ),
    },
    {
      id: "deployment",
      title: "Step 7: Deployment & DevOps",
      icon: <Terminal size={16} className="text-slate-500" />,
      content: (
        <div className="space-y-3">
          <CodeBlock
            language="yaml"
            code={`# docker-compose.yml
version: '3.9'
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: nalco_w2w
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./nalco-w2w-backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://admin:\${DB_PASSWORD}@postgres:5432/nalco_w2w
      REDIS_URL: redis://redis:6379
      JWT_SECRET: \${JWT_SECRET}
      FRONTEND_URL: http://localhost:5173
    depends_on:
      - postgres
      - redis

  frontend:
    build: .
    ports:
      - "5173:80"
    environment:
      VITE_API_URL: http://localhost:4000/api
      VITE_WS_URL: http://localhost:4000

volumes:
  pgdata:`}
          />
          <CodeBlock
            language="env"
            code={`# .env (Backend)
DATABASE_URL=postgresql://admin:password@localhost:5432/nalco_w2w
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-key-change-this
PORT=4000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Indian Carbon Market API (when available)
ICM_API_KEY=your-icm-api-key
ICM_ENDPOINT=https://api.carbonmarket.gov.in/v1

# NHAI API for highway data
NHAI_API_KEY=your-nhai-api-key`}
          />
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 text-xs text-emerald-800">
            <strong>🚀 Quick Start Commands:</strong>
            <div className="mt-2 font-mono bg-white/50 rounded p-2 space-y-1">
              <div># Start databases</div>
              <div>docker-compose up -d postgres redis</div>
              <div>&nbsp;</div>
              <div># Backend</div>
              <div>cd nalco-w2w-backend</div>
              <div>npm install</div>
              <div>npx prisma migrate dev</div>
              <div>npx prisma db seed</div>
              <div>npm run dev</div>
              <div>&nbsp;</div>
              <div># Frontend (this project)</div>
              <div>npm install socket.io-client</div>
              <div>npm run dev</div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4 max-w-5xl">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-6 text-white">
        <h2 className="text-lg font-bold mb-2">🔧 Backend Connection Guide</h2>
        <p className="text-sm text-slate-300">
          This frontend currently runs with simulated data. Follow these 7 steps to connect it to a real Node.js backend
          with PostgreSQL, WebSocket real-time feeds, and JWT authentication.
        </p>
        <div className="flex gap-3 mt-4">
          <div className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg">
            <CheckCircle2 size={12} className="text-emerald-400" />
            <span>Frontend: Complete ✓</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs bg-white/10 px-3 py-1.5 rounded-lg">
            <Server size={12} className="text-amber-400" />
            <span>Backend: Build with guide below</span>
          </div>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <button
            onClick={() => toggle(section.id)}
            className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
          >
            {section.icon}
            <span className="text-sm font-semibold text-slate-800 flex-1">{section.title}</span>
            {expandedSections.has(section.id) ? (
              <ChevronDown size={16} className="text-slate-400" />
            ) : (
              <ChevronRight size={16} className="text-slate-400" />
            )}
          </button>
          {expandedSections.has(section.id) && (
            <div className="px-4 pb-4 border-t border-slate-100 pt-4">{section.content}</div>
          )}
        </div>
      ))}
    </div>
  );
}
