# NALCO Waste-to-Wealth — FastAPI Backend Migration Plan

Migrating from: Node.js + Express + Prisma + Socket.IO
Migrating to: Python + FastAPI + SQLAlchemy + native WebSockets
Auth: existing custom auth-service (JWKS verify, python-jose)

---

## 1. Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app init, routers mount, CORS, startup events
│   ├── config.py                # env vars (DATABASE_URL, JWT/auth-service config, etc.)
│   ├── database.py              # SQLAlchemy engine, session, Base
│   ├── models/                  # SQLAlchemy ORM models (Prisma schema mapped)
│   │   ├── user.py               # optional — see Auth section
│   │   ├── waste_stream.py
│   │   ├── batch.py
│   │   ├── buyer.py
│   │   ├── order.py
│   │   ├── carbon_credit.py
│   │   ├── sensor_reading.py
│   │   └── route.py
│   ├── schemas/                 # Pydantic request/response models
│   │   ├── auth.py
│   │   ├── inventory.py
│   │   ├── orders.py
│   │   ├── buyers.py
│   │   └── carbon.py
│   ├── routers/                 # one file = one Node "routes/*.ts" equivalent
│   │   ├── auth.py               # /api/auth/*
│   │   ├── inventory.py          # /api/inventory/*
│   │   ├── orders.py             # /api/orders/*
│   │   ├── carbon.py             # /api/carbon
│   │   ├── buyers.py             # /api/buyers
│   │   └── logistics.py          # /api/logistics/calculate
│   ├── dependencies/
│   │   ├── auth.py               # verify_jwt(), require_role()
│   │   └── db.py                 # get_db() session dependency
│   ├── websocket/
│   │   ├── manager.py            # ConnectionManager (rooms: dashboard, iot-feed, orders)
│   │   └── iot_simulator.py      # background task generating fake sensor data
│   └── utils/
│       ├── carbon_calc.py        # calculateCarbonCredits() ported to Python
│       └── batch_code.py         # batchCode auto-generation logic
├── alembic/                     # DB migrations (Prisma migrate equivalent)
├── requirements.txt
├── .env.example
└── seed.py                      # Python equivalent of seed.js
```

---

## 2. Auth Integration Plan

Using existing auth-service (JWKS-based verification, not building a new auth system).

- `dependencies/auth.py` — JWKS-based `verify_jwt()` (python-jose, `kid` matching, JWKS response cached).
- `require_role(*roles)` — depends on `verify_jwt()`, checks role claim from the token (or from DB if role isn't in the token).
- **Open decision:** where does role live — inside the token claims (e.g. `app_metadata`/custom claim), or in a separate `profiles` table keyed by user id? This decides whether `require_role` is a pure token check or needs a DB lookup.
- `routers/auth.py` stays thin — register/login is handled by the existing auth-service, not duplicated here. FastAPI only exposes something like `GET /api/auth/me` that reads the verified token and returns user info.

---

## 3. SQLAlchemy Models — Prisma Schema Mapping

| Prisma Model | SQLAlchemy file | Notes |
|---|---|---|
| `WasteStream` | `waste_stream.py` | enum `WasteType`; `applications` → Postgres `ARRAY(String)` |
| `Batch` | `batch.py` | enum `BatchStatus`; optional `lat`/`lng`; relations to `WasteStream`, `Order` |
| `Buyer` | `buyer.py` | relations to `User`(if kept)/`Order`/`CarbonCredit` |
| `Order` | `order.py` | enum `OrderStatus`; relations to `Buyer`, `Batch`; one-to-one `CarbonCredit` |
| `CarbonCredit` | `carbon_credit.py` | one-to-one back to `Order` |
| `SensorReading` | `sensor_reading.py` | indexed on `(batchId, timestamp)` |
| `Route` | `route.py` | simple lookup table |
| `User` | optional | skip if auth-service/Supabase `auth.users` is the source of truth; otherwise keep a minimal `profiles`-style table |

Migrations: `alembic revision --autogenerate` (equivalent of `prisma migrate dev`).

---

## 4. REST Endpoint Mapping

| Node route | FastAPI route | Notes |
|---|---|---|
| `POST /api/auth/register`, `/login` | handled by existing auth-service | not built in FastAPI |
| `GET /api/auth/me` | `GET /api/auth/me` | `Depends(verify_jwt)` |
| `GET /api/inventory` | `GET /api/inventory/batches` | query params: wasteType, status, grade, skip, take |
| `POST /api/inventory` | `POST /api/inventory/batches` | `Depends(require_role("NALCO_ADMIN"))`; auto-generates batchCode |
| `GET /api/orders` | `GET /api/orders` | includes stats (pending/dispatched/delivered counts) |
| `POST /api/orders` | `POST /api/orders` | auto-calculates carbon credit on order creation |
| `GET /api/carbon` | `GET /api/carbon` | filter by buyerId |
| `GET /api/buyers` | `GET /api/buyers` | filter by verified |
| `POST /api/logistics/calculate` | `POST /api/logistics/calculate` | pure calculation, no DB |
| `GET /api/health` | `GET /api/health` | simple status check |

---

## 5. WebSocket Plan (Socket.IO → FastAPI native WebSockets)

Socket.IO's "rooms" concept needs to be manually replicated since FastAPI's native WebSockets don't have rooms built in:

- `websocket/manager.py` → `ConnectionManager` class holding `dict[str, set[WebSocket]]` mapping room name (`"dashboard"`, `"iot-feed"`, `"orders"`) to active connections.
- Endpoints: either separate `WS /ws/dashboard`, `WS /ws/iot-feed`, `WS /ws/orders`, or a single `/ws` endpoint where the client sends a subscribe-message (mirrors old Socket.IO behavior).
- `iot_simulator.py` — launched as an `asyncio` background task on FastAPI startup; every ~3s generates a fake sensor reading and broadcasts to all `iot-feed` connections.
- On batch creation (`POST /api/inventory/batches`), the endpoint manually calls `manager.broadcast("dashboard", ...)` — equivalent of Node's `io.to('dashboard').emit(...)`.

**Important side effect:** Socket.IO client (`socket.io-client`) and the native browser `WebSocket` API are different protocols. This means the frontend's `useRealtimeData.ts` hook also needs to be rewritten to use plain `WebSocket` instead of the Socket.IO client — a direct consequence of this backend migration.

---

## 6. Redis — Keep or Drop?

Node backend used Redis only to cache the inventory list for 30 seconds.

- **Keep (optional):** if time allows, replicate with `redis.asyncio` for the same caching behavior.
- **Drop:** acceptable for a hackathon — caching isn't core to the demo, the marketplace flow matters more to judges.

---

## 7. Suggested Build Order

1. `config.py` + `database.py` + SQLAlchemy `Base` setup
2. All models (every table)
3. Alembic init + first migration (create schema on Postgres)
4. `seed.py` (mirror seed.js data: admin user, 6 waste streams, 8 buyers, 8 sample batches)
5. Auth dependency (`verify_jwt`, `require_role`) wired to the existing auth-service
6. CRUD routers in order: inventory → orders → carbon → buyers → logistics
7. WebSocket manager + IoT simulator last (depends on everything above)