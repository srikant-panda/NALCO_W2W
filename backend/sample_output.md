# NALCO W2W — Node Backend API Reference (Sample JSON Outputs)

⚠️ **Important finding:** `src/routes/inventory.ts` is never mounted in `server.ts`
(only `authRoutes` and `orderRoutes` are `app.use()`'d). The `/api/inventory`,
`/api/carbon`, `/api/buyers`, and `/api/logistics/calculate` endpoints below are
defined **inline in `server.ts`**, not from `routes/inventory.ts`. That file's
extra endpoints (`/streams`, `/batches/:id`, `PUT /batches/:id`, `/metrics`) are
currently dead code — not reachable. Decide in FastAPI whether you want those
extra endpoints for real or not.

All examples use realistic values based on `seed.js` data.

---

## `GET /api/health`

```json
{
  "status": "ok",
  "timestamp": "2026-06-20T12:00:00.000Z",
  "version": "2.1.0"
}
```

---

## `POST /api/auth/register`

**Request:**
```json
{
  "email": "buyer@ultratech.in",
  "password": "SecurePass123",
  "name": "Rajesh Kumar",
  "role": "BUYER",
  "companyId": null
}
```

**Response `201`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbHh...",
  "user": {
    "id": "c3a1f2e0-1234-4abc-9def-56789abcdef0",
    "email": "buyer@ultratech.in",
    "name": "Rajesh Kumar",
    "role": "BUYER",
    "companyId": null
  },
  "message": "Registration successful"
}
```

**Response `409` (duplicate email):**
```json
{
  "error": "EMAIL_EXISTS",
  "message": "Email already registered"
}
```

---

## `POST /api/auth/login`

**Request:**
```json
{
  "email": "admin@nalco.in",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhZG1pbi1pZCJ9...",
  "user": {
    "id": "f1e2d3c4-5678-4abc-9def-0123456789ab",
    "email": "admin@nalco.in",
    "name": "NALCO Admin",
    "role": "NALCO_ADMIN",
    "companyId": null
  }
}
```

**Response `401` (wrong credentials):**
```json
{
  "error": "INVALID_CREDENTIALS",
  "message": "Email or password is incorrect"
}
```

---

## `GET /api/auth/me`

Requires `Authorization: Bearer <token>`

**Response `200`:**
```json
{
  "user": {
    "id": "f1e2d3c4-5678-4abc-9def-0123456789ab",
    "email": "admin@nalco.in",
    "name": "NALCO Admin",
    "role": "NALCO_ADMIN",
    "companyId": null,
    "createdAt": "2026-06-01T08:30:00.000Z"
  },
  "tokenValid": true
}
```

**Response `401` (no/invalid token):**
```json
{
  "error": "UNAUTHORIZED",
  "message": "No token provided",
  "help": "Set Authorization: Bearer <your-jwt-token>"
}
```

---

## `GET /api/inventory`

Query params: `?wasteType=RED_MUD&status=AVAILABLE` (both optional)

**Response `200`:**
```json
{
  "batches": [
    {
      "id": "b1a2c3d4-0001-4abc-9def-aaaaaaaaaaaa",
      "batchCode": "RM-2026-0002",
      "wasteStreamId": "ws-redmud-001",
      "tonnes": 3100,
      "moisture": 19,
      "ph": 10.8,
      "grade": "A",
      "status": "AVAILABLE",
      "location": "Damanjodi Yard-A",
      "treatmentMethod": "Filter Press + Solar Drying",
      "certifications": ["ISO-14001", "CPCB-HW", "BIS-Quality"],
      "lat": null,
      "lng": null,
      "createdAt": "2026-06-10T06:15:00.000Z",
      "updatedAt": "2026-06-10T06:15:00.000Z",
      "wasteStream": {
        "id": "ws-redmud-001",
        "type": "RED_MUD",
        "name": "Red Mud (Bauxite Residue)",
        "chemicalFormula": "Fe₂O₃ + Al₂O₃ + SiO₂ + TiO₂",
        "source": "Bayer Process - Alumina Refining",
        "avgPricePerMT": 350,
        "carbonFactor": 0.44,
        "monthlyProd": 12000,
        "applications": ["Eco-Bricks", "Portland Cement", "Highway Sub-base", "Geopolymer", "Iron Recovery"],
        "currentStock": 42500,
        "createdAt": "2026-05-01T00:00:00.000Z"
      }
    }
  ],
  "stats": {
    "totalBatches": 8,
    "availableStock": 19560,
    "gradeA": 6,
    "inTransit": 0
  }
}
```

---

## `POST /api/inventory` (NALCO_ADMIN only)

**Request:**
```json
{
  "wasteStreamId": "ws-redmud-001",
  "tonnes": 2800,
  "moisture": 20,
  "ph": 11.0,
  "grade": "A",
  "location": "Damanjodi Yard-B",
  "treatmentMethod": "Filter Press + Solar Drying",
  "certifications": ["ISO-14001", "CPCB-HW"]
}
```

**Response `201`:**
```json
{
  "id": "b1a2c3d4-0009-4abc-9def-bbbbbbbbbbbb",
  "batchCode": "RM-2026-0009",
  "wasteStreamId": "ws-redmud-001",
  "tonnes": 2800,
  "moisture": 20,
  "ph": 11.0,
  "grade": "A",
  "status": "AVAILABLE",
  "location": "Damanjodi Yard-B",
  "treatmentMethod": "Filter Press + Solar Drying",
  "certifications": ["ISO-14001", "CPCB-HW"],
  "lat": null,
  "lng": null,
  "createdAt": "2026-06-20T12:05:00.000Z",
  "updatedAt": "2026-06-20T12:05:00.000Z",
  "wasteStream": {
    "id": "ws-redmud-001",
    "type": "RED_MUD",
    "name": "Red Mud (Bauxite Residue)",
    "...": "...same shape as above..."
  }
}
```

**Response `403` (wrong role):**
```json
{
  "error": "FORBIDDEN",
  "message": "Insufficient permissions. Requires: NALCO_ADMIN",
  "yourRole": "BUYER"
}
```

---

## `GET /api/orders`

Query params: `?status=PENDING&buyerId=...` (both optional)

**Response `200`:**
```json
{
  "orders": [
    {
      "id": "ord-0001-4abc-9def-cccccccccccc",
      "orderNumber": "ORD-1750420800000",
      "buyerId": "buyer-ultratech-001",
      "batchId": "b1a2c3d4-0001-4abc-9def-aaaaaaaaaaaa",
      "tonnes": 1500,
      "pricePerMT": 350,
      "totalValue": 525000,
      "freightCost": 94500,
      "distance": 420,
      "highway": "NH-26",
      "truckCount": 60,
      "status": "PENDING",
      "estimatedDelivery": "2026-07-22T12:00:00.000Z",
      "actualDelivery": null,
      "createdAt": "2026-06-20T10:00:00.000Z",
      "updatedAt": "2026-06-20T10:00:00.000Z",
      "buyer": {
        "id": "buyer-ultratech-001",
        "company": "UltraTech Cement Ltd",
        "industry": "Cement",
        "location": "Jharsuguda, Odisha",
        "state": "Odisha",
        "distance": 420,
        "verified": true,
        "gstNumber": "21AABCU9603R1ZM",
        "contactPerson": "Rajesh Kumar",
        "phone": "+91-9876543210",
        "email": "procurement@ultratech.in",
        "rating": 4.8,
        "totalOrdered": 20000,
        "totalCarbon": 8060
      },
      "batch": {
        "id": "b1a2c3d4-0001-4abc-9def-aaaaaaaaaaaa",
        "batchCode": "RM-2026-0001",
        "tonnes": 2400,
        "status": "RESERVED",
        "wasteStream": {
          "type": "RED_MUD",
          "name": "Red Mud (Bauxite Residue)",
          "avgPricePerMT": 350
        }
      },
      "carbonCredits": {
        "id": "cc-0001-4abc-9def-dddddddddddd",
        "orderId": "ord-0001-4abc-9def-cccccccccccc",
        "buyerId": "buyer-ultratech-001",
        "tCO2e": 660,
        "methodology": "ISO-14064-2:2019",
        "registry": "Indian Carbon Market (ICM)",
        "valueINR": 990000,
        "verified": false,
        "certificateUrl": null,
        "createdAt": "2026-06-20T10:00:00.000Z"
      }
    }
  ],
  "stats": {
    "count": 1,
    "totalValue": 525000,
    "totalCO2": 660,
    "pending": 1,
    "dispatched": 0,
    "delivered": 0
  }
}
```

---

## `GET /api/orders/:id`

**Response `200`:** same shape as a single object from the `orders` array above (no `stats` wrapper).

**Response `404`:**
```json
{ "error": "Order not found" }
```

---

## `POST /api/orders`

**Request:**
```json
{
  "buyerId": "buyer-ultratech-001",
  "batchId": "b1a2c3d4-0002-4abc-9def-aaaaaaaaaaaa",
  "tonnes": 1500
}
```

**Response `201`:**
```json
{
  "order": {
    "id": "ord-0002-4abc-9def-eeeeeeeeeeee",
    "orderNumber": "ORD-1750420923456",
    "buyerId": "buyer-ultratech-001",
    "batchId": "b1a2c3d4-0002-4abc-9def-aaaaaaaaaaaa",
    "tonnes": 1500,
    "pricePerMT": 350,
    "totalValue": 525000,
    "freightCost": 94500,
    "distance": 420,
    "highway": "NH-26",
    "truckCount": 60,
    "status": "PENDING",
    "estimatedDelivery": "2026-07-22T12:00:00.000Z",
    "actualDelivery": null,
    "createdAt": "2026-06-20T12:15:00.000Z",
    "updatedAt": "2026-06-20T12:15:00.000Z",
    "buyer": { "...": "full buyer object" },
    "batch": { "...": "full batch object with wasteStream" }
  },
  "carbonSummary": {
    "tCO2e": 660,
    "valueINR": 990000,
    "factor": 0.44
  },
  "freightSummary": {
    "freightCost": 94500,
    "truckCount": 60,
    "highway": "NH-26",
    "distanceKM": 420
  },
  "message": "Order created successfully"
}
```

**Response `400` (batch unavailable):**
```json
{
  "error": "Batch is not available",
  "currentStatus": "RESERVED"
}
```

**Response `400` (insufficient stock):**
```json
{
  "error": "Insufficient stock in batch",
  "available": 1200,
  "requested": 1500
}
```

---

## `PUT /api/orders/:id/status` (NALCO_ADMIN or LOGISTICS only)

**Request:**
```json
{ "status": "DISPATCHED" }
```

**Response `200`:**
```json
{
  "order": {
    "id": "ord-0002-4abc-9def-eeeeeeeeeeee",
    "status": "DISPATCHED",
    "actualDelivery": null,
    "...": "...rest of order fields + buyer + batch (not wasteStream nested here)"
  },
  "message": "Order status updated to DISPATCHED"
}
```

**Response `400` (invalid status):**
```json
{
  "error": "Invalid status",
  "validValues": ["PENDING", "CONFIRMED", "DISPATCHED", "DELIVERED", "CANCELLED"]
}
```

---

## `DELETE /api/orders/:id`

**Response `200`:**
```json
{ "message": "Order cancelled and batch released" }
```

---

## `GET /api/carbon`

Query params: `?buyerId=...` (optional)

**Response `200`:**
```json
{
  "credits": [
    {
      "id": "cc-0001-4abc-9def-dddddddddddd",
      "orderId": "ord-0001-4abc-9def-cccccccccccc",
      "buyerId": "buyer-ultratech-001",
      "tCO2e": 660,
      "methodology": "ISO-14064-2:2019",
      "registry": "Indian Carbon Market (ICM)",
      "valueINR": 990000,
      "verified": false,
      "certificateUrl": null,
      "createdAt": "2026-06-20T10:00:00.000Z",
      "buyer": { "...": "full buyer object" },
      "order": { "...": "full order object" }
    }
  ],
  "totalCO2e": 660,
  "totalValueINR": 990000,
  "count": 1
}
```

---

## `GET /api/buyers`

Query params: `?verified=true` (optional)

**Response `200`:**
```json
[
  {
    "id": "buyer-ultratech-001",
    "company": "UltraTech Cement Ltd",
    "industry": "Cement",
    "location": "Jharsuguda, Odisha",
    "state": "Odisha",
    "latitude": 21.8587,
    "longitude": 83.9927,
    "distance": 420,
    "verified": true,
    "gstNumber": "21AABCU9603R1ZM",
    "contactPerson": "Rajesh Kumar",
    "phone": "+91-9876543210",
    "email": "procurement@ultratech.in",
    "rating": 4.8,
    "totalOrdered": 18500,
    "totalCarbon": 7400,
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-06-20T10:00:00.000Z"
  },
  {
    "id": "buyer-acc-002",
    "company": "ACC Limited",
    "industry": "Cement",
    "location": "Bargarh, Odisha",
    "state": "Odisha",
    "distance": 385,
    "verified": true,
    "gstNumber": "21AABCA1584R1ZX",
    "contactPerson": "Priya Sharma",
    "rating": 4.6,
    "totalOrdered": 14200,
    "totalCarbon": 5396
  }
]
```

Note: this returns a **plain array**, not wrapped in an object (unlike most other endpoints).

---

## `POST /api/logistics/calculate`

**Request:**
```json
{
  "tonnes": 1500,
  "distanceKM": 420,
  "wasteType": "RED_MUD"
}
```

**Response `200`:**
```json
{
  "freightCost": 113400,
  "truckCount": 60,
  "transportCO2e": 67.536,
  "carbonCredits": {
    "tCO2e": 660,
    "valueINR": 990000,
    "factor": 0.44,
    "methodology": "ISO-14064-2:2019"
  },
  "netCO2e": 592.464
}
```

---

## WebSocket events (Socket.IO — for reference when designing the WS equivalent)

**`iot:reading`** — broadcast every ~3s to clients in the `iot-feed` room:
```json
{
  "timestamp": "2026-06-20T12:20:03.000Z",
  "wasteStream": "Red Mud (Bauxite Residue)",
  "type": "moisture",
  "value": 27.84,
  "unit": "%",
  "location": "Damanjodi Plant"
}
```

**`metrics:update`** — broadcast to `dashboard` room on changes:
```json
{
  "totalStockpile": 19560,
  "totalRevenue": 525000,
  "totalCarbonSaved": 660,
  "totalOrders": 1,
  "activeBuyers": 7,
  "trucksInTransit": 0,
  "lastUpdate": "2026-06-20T12:20:03.000Z"
}
```

**`inventory:new`** — broadcast to `dashboard` room when a batch is created: same shape as the `POST /api/inventory` response above.

**`inventory:update`** — sent on `subscribe:inventory`: array of up to 50 batches (same shape as `batches` array in `GET /api/inventory`).

**`orders:update`** — sent on `subscribe:orders`: array of up to 50 orders (same shape as `orders` array in `GET /api/orders`).