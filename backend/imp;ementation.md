You are a senior Python/FastAPI engineer. Your task is to scaffold a complete 
FastAPI backend for a B2B waste marketplace called NALCO Waste-to-Wealth (nalco-w2w).

You have been given two reference documents:
1. `fastapi-migration-plan.md` — project structure, auth plan, model mapping, 
   endpoint mapping, WebSocket plan, and build order
2. `node-backend-api-reference.md` — complete JSON input/output shapes for every 
   endpoint (based on the original Node.js backend), plus WebSocket event payloads

---

## YOUR TASK

Scaffold the complete FastAPI backend. This means every file must have REAL 
working code — not empty files, not TODO placeholders, not `pass` statements. 
Every file must be immediately runnable/importable without modification.

---

## TECH STACK

- Python 3.11+
- FastAPI
- SQLAlchemy (async) with asyncpg driver
- Alembic for migrations
- python-jose for JWT verification (JWKS-based, Supabase auth-service)
- Pydantic v2 for request/response schemas
- asyncio background tasks for IoT simulator (no Celery, no external task queue)
- Native FastAPI WebSockets (NOT Socket.IO)
- Redis optional — skip it for now, no caching layer needed
- PostgreSQL (Supabase-hosted)

---

## AUTH DETAILS

- Auth is handled by an EXTERNAL Supabase auth-service — do NOT build login/register 
  endpoints in this backend
- JWT tokens are issued by Supabase and must be verified using JWKS 
  (fetch from `{SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
- Use python-jose with `kid` matching to select the correct key from the JWKS response
- Cache the JWKS response in memory (a simple module-level dict is fine, 
  no TTL needed for hackathon scope)
- After verifying the JWT, extract: `sub` (user id), `email`, `role` 
  (from `app_metadata.role` or a custom claim — make this configurable via env var 
  `ROLE_CLAIM_PATH`, default `app_metadata.role`)
- `require_role(*roles)` dependency must raise HTTP 403 with this exact shape:
  `{"error": "FORBIDDEN", "message": "Insufficient permissions. Requires: ROLE_NAME", "yourRole": "ACTUAL_ROLE"}`
- Roles: `NALCO_ADMIN`, `BUYER`, `LOGISTICS`, `AUDITOR`

---

## DATABASE MODELS

Map from the Prisma schema exactly. Key points:
- All primary keys: UUID, server-side default (`uuid_generate_v4()` or Python `uuid4`)
- All timestamps: `createdAt`, `updatedAt` (use SQLAlchemy `onupdate` for updatedAt)
- Enums: define as Python `enum.Enum` classes AND SQLAlchemy `Enum` column types
  - `WasteType`: RED_MUD, FLY_ASH, SPENT_POT_LINING, ALUMINIUM_DROSS, CAUSTIC_LIQUOR, LIME_GRIT
  - `BatchStatus`: AVAILABLE, RESERVED, IN_TRANSIT, DELIVERED, REJECTED
  - `OrderStatus`: PENDING, CONFIRMED, DISPATCHED, DELIVERED, CANCELLED
  - `Role`: NALCO_ADMIN, BUYER, LOGISTICS, AUDITOR
- `WasteStream.applications`: Postgres ARRAY(String)
- `Batch.certifications`: Postgres ARRAY(String)
- `CarbonCredit.verified`: Boolean, default False — this is intentional, credits are 
  estimates not certified (do not remove or change this default)
- All relationships must be defined bidirectionally with `back_populates`
- `SensorReading`: add a composite index on `(batch_id, timestamp)`

---

## PYDANTIC SCHEMAS

For every endpoint, define:
- A `*Request` schema (for POST/PUT body)
- A `*Response` schema (for the response)
- Response schemas must EXACTLY match the JSON shapes in `node-backend-api-reference.md` 
  field by field — same field names (camelCase where the Node API used camelCase), 
  same nesting structure, same field presence/absence

Use `model_config = ConfigDict(from_attributes=True)` on all response schemas 
that are built from SQLAlchemy ORM objects.

---

## ENDPOINTS

Implement every endpoint listed in `node-backend-api-reference.md`. For each:
- Match the HTTP method and path exactly
- Match the response JSON shape exactly (refer to the reference doc)
- Apply the correct auth dependency (`verify_jwt` or `require_role`)
- Implement the actual DB logic (not mocked)

Additional business logic to implement:
- `POST /api/inventory/batches`: auto-generate `batchCode` as `{PREFIX}-{YEAR}-{COUNT:04d}` 
  where PREFIX = first 3 chars of waste type (e.g. RED_MUD → "RED", FLY_ASH → "FLY"), 
  YEAR = current year, COUNT = existing batch count for that waste stream + 1
- `POST /api/orders`: run inside a DB transaction —
  1. Validate batch is AVAILABLE and has enough tonnes
  2. Set batch status to RESERVED
  3. Create order with `orderNumber = f"ORD-{int(time.time() * 1000)}"`
  4. Calculate carbon: `tCO2e = tonnes × WASTE_CARBON_FACTORS[waste_type]`
     where factors are: RED_MUD=0.44, FLY_ASH=0.38, SPENT_POT_LINING=0.56, 
     ALUMINIUM_DROSS=0.72, CAUSTIC_LIQUOR=0.31, LIME_GRIT=0.22
  5. Create CarbonCredit row with `verified=False`, methodology=`ISO-14064-2:2019`, 
     registry=`Indian Carbon Market (ICM)`, valueINR=`tCO2e × 1500`
  6. Update buyer's `totalOrdered` and `totalCarbon` fields
  7. After transaction commits, broadcast to WebSocket dashboard room
- `DELETE /api/orders/:id`: transaction — set batch back to AVAILABLE, 
  set order status to CANCELLED, delete related CarbonCredit rows
- `POST /api/logistics/calculate`: pure calculation, no DB, implement the 
  freight formula: `freightCost = tonnes × distanceKM × 4.5 / 25`, 
  `truckCount = ceil(tonnes / 25)`, `transportCO2e = (distanceKM × truckCount × 2.68) / 1000`

---

## WEBSOCKET

- `websocket/manager.py`: `ConnectionManager` class with:
  - `rooms: dict[str, set[WebSocket]]`
  - `async connect(websocket, room)` — adds to room
  - `disconnect(websocket, room)` — removes from room
  - `async broadcast(room, data: dict)` — sends JSON to all connections in that room, 
    silently removes dead connections on send failure

- WebSocket endpoints (in `main.py`):
  - `WS /ws/dashboard`
  - `WS /ws/iot-feed`
  - `WS /ws/orders`
  - On connect, client optionally sends a subscribe message — just accept connection 
    and add to the appropriate room
  - On disconnect, clean up from room

- `websocket/iot_simulator.py`:
  - `async def start_iot_simulator(manager: ConnectionManager)` function
  - Runs forever with `asyncio.sleep(3)` between iterations
  - Each iteration picks a random waste stream name and generates a reading with 
    one of these types: moisture (%), pH (0-14), temperature (°C), or gps_lat/lng
  - Broadcast payload shape must match exactly what is in `node-backend-api-reference.md` 
    under "WebSocket events → iot:reading"
  - Also broadcast `metrics:update` to dashboard room every 10th iteration
  - Launch via `asyncio.create_task()` in FastAPI `lifespan` startup

---

## `main.py` REQUIREMENTS

- Use `lifespan` context manager (not deprecated `@app.on_event`)
- Mount all routers with `/api` prefix
- CORS: allow origin from env var `FRONTEND_URL` (default `http://localhost:5173`)
- Include Swagger UI (automatic with FastAPI, just make sure it works)
- Global exception handler for unhandled errors returning `{"error": "Internal server error"}`
- Mount WebSocket endpoints
- Start IoT simulator background task in lifespan startup

---

## `seed.py` REQUIREMENTS

Standalone script (not a FastAPI route). Running `python seed.py` must:
- Create 6 waste streams with EXACT data from `node-backend-api-reference.md` 
  (same names, chemical formulas, prices, carbon factors, monthly production, 
  applications, stock levels)
- Create 8 buyers with EXACT data from seed.js (same companies, GST numbers, 
  distances, locations, ratings)
- Create 8 sample batches covering all 6 waste types (same batch codes pattern, 
  tonnage, moisture, pH, grade, location, treatment, certifications)
- Use upsert pattern (insert if not exists, skip if already exists) so it is 
  safe to run multiple times
- Print a clear summary at the end: