# NALCO Waste-to-Wealth FastAPI Backend

This backend is a Python/FastAPI scaffold for the NALCO W2W marketplace. It mirrors the Node API reference in `sample_output.md` while using async SQLAlchemy, Pydantic v2, Supabase JWT verification, and native FastAPI WebSockets.

## Setup

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Set `DATABASE_URL` in `.env` to your PostgreSQL/Supabase database. For local API testing without Supabase JWTs, set `AUTH_DISABLED=true`.

## Database

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
python seed.py
```

For a quick hackathon setup, `python seed.py` also calls `Base.metadata.create_all()` before inserting seed records.

## Run

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 4000
```

Useful endpoints:

- `GET /api/health`
- `GET /api/inventory`
- `GET /api/inventory/batches`
- `POST /api/orders`
- `GET /api/carbon`
- `GET /api/buyers`
- `POST /api/logistics/calculate`

WebSocket rooms:

- `/ws/dashboard`
- `/ws/iot-feed`
- `/ws/orders`
