import asyncio
from contextlib import asynccontextmanager
from contextlib import suppress
from datetime import UTC, datetime

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
from app.routers import auth, buyers, carbon, inventory, logistics, orders
from app.websocket.iot_simulator import start_iot_simulator
from app.websocket.manager import manager
from app.database import engine, metadata

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        schema_prefix = f'"{settings.default_schema_name}".' if settings.default_schema_name else ""
        if settings.default_schema_name:
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{settings.default_schema_name}"'))
        await conn.run_sync(metadata.create_all)
        await conn.execute(
            text(
                f"""
                ALTER TABLE IF EXISTS {schema_prefix}profiles
                ADD COLUMN IF NOT EXISTS "passwordHash" VARCHAR(255),
                ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
                ADD COLUMN IF NOT EXISTS "refreshTokenHash" VARCHAR(128),
                ADD COLUMN IF NOT EXISTS "refreshTokenExpiresAt" TIMESTAMPTZ
                """
            )
        )

    task = asyncio.create_task(start_iot_simulator(manager))
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task



settings = get_settings()
app = FastAPI(title="NALCO Waste-to-Wealth API", version=settings.app_version, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": "VALIDATION_ERROR", "details": exc.errors()})


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, _exc: Exception):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok", "timestamp": datetime.now(UTC).isoformat(), "version": settings.app_version}


app.include_router(auth.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(carbon.router, prefix="/api")
app.include_router(buyers.router, prefix="/api")
app.include_router(logistics.router, prefix="/api")


async def _room_websocket(websocket: WebSocket, room: str) -> None:
    await manager.connect(websocket, room)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, room)


@app.websocket("/ws/dashboard")
async def dashboard_ws(websocket: WebSocket) -> None:
    await _room_websocket(websocket, "dashboard")


@app.websocket("/ws/iot-feed")
async def iot_feed_ws(websocket: WebSocket) -> None:
    await _room_websocket(websocket, "iot-feed")


@app.websocket("/ws/orders")
async def orders_ws(websocket: WebSocket) -> None:
    await _room_websocket(websocket, "orders")
