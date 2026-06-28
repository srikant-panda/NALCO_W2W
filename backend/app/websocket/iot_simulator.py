import asyncio
import random
from datetime import UTC, datetime

from app.websocket.manager import ConnectionManager

STREAMS = [
    "Red Mud (Bauxite Residue)",
    "Fly Ash (Coal Combustion)",
    "Spent Pot Lining (SPL)",
    "Aluminium Dross",
    "Spent Caustic Liquor",
    "Lime Grit / White Mud",
]


def _reading() -> dict:
    reading_type = random.choice(["moisture", "pH", "temperature", "gps_lat/lng"])
    if reading_type == "moisture":
        value, unit = round(random.uniform(5, 35), 2), "%"
    elif reading_type == "pH":
        value, unit = round(random.uniform(7, 14), 2), "pH"
    elif reading_type == "temperature":
        value, unit = round(random.uniform(24, 48), 2), "degC"
    else:
        value, unit = f"{round(random.uniform(18.7, 19.1), 6)},{round(random.uniform(82.8, 83.1), 6)}", "lat,lng"
    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "wasteStream": random.choice(STREAMS),
        "type": reading_type,
        "value": value,
        "unit": unit,
        "location": "Damanjodi Plant",
    }


async def start_iot_simulator(connection_manager: ConnectionManager) -> None:
    iteration = 0
    while True:
        await asyncio.sleep(3)
        iteration += 1
        await connection_manager.broadcast("iot-feed", {"event": "iot:reading", "data": _reading()})
        if iteration % 10 == 0:
            await connection_manager.broadcast(
                "dashboard",
                {
                    "event": "metrics:update",
                    "data": {
                        "totalStockpile": random.randint(18000, 22000),
                        "totalRevenue": random.randint(500000, 2500000),
                        "totalCarbonSaved": random.randint(600, 4200),
                        "totalOrders": random.randint(1, 12),
                        "activeBuyers": random.randint(4, 8),
                        "trucksInTransit": random.randint(0, 160),
                        "lastUpdate": datetime.now(UTC).isoformat(),
                    },
                },
            )
