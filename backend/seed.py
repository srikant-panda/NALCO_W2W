import asyncio
from datetime import UTC, datetime

from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from uuid import UUID , uuid4
from app.database import AsyncSessionLocal, Base, engine
from app.config import get_settings
from app.models.batch import Batch, BatchStatus
from app.models.buyer import Buyer
from app.models.carbon_credit import CarbonCredit
from app.models.order import Order, OrderStatus
from app.models.route import Route
from app.models.user import Role, User
from app.models.waste_stream import WasteStream
from app.utils.carbon_calc import METHODOLOGY, REGISTRY, calculate_carbon_credits, calculate_freight
from app.utils.security import hash_password

WASTE_STREAMS = [
    {
        "id": "ws-redmud-001",
        "type": "RED_MUD",
        "name": "Red Mud (Bauxite Residue)",
        "chemical_formula": "Fe2O3 + Al2O3 + SiO2 + TiO2",
        "source": "Bayer Process - Alumina Refining",
        "avg_price_per_mt": 350,
        "carbon_factor": 0.44,
        "monthly_prod": 12000,
        "applications": ["Eco-Bricks", "Portland Cement", "Highway Sub-base", "Geopolymer", "Iron Recovery"],
        "current_stock": 42500,
    },
    {
        "id": "ws-flyash-002",
        "type": "FLY_ASH",
        "name": "Fly Ash (Coal Combustion)",
        "chemical_formula": "SiO2 + Al2O3 + CaO",
        "source": "Captive Power Plant - Coal Combustion",
        "avg_price_per_mt": 180,
        "carbon_factor": 0.38,
        "monthly_prod": 8500,
        "applications": ["Fly Ash Bricks", "PPC Cement", "Road Embankment", "Mine Fill", "Agriculture"],
        "current_stock": 28700,
    },
    {
        "id": "ws-spl-003",
        "type": "SPENT_POT_LINING",
        "name": "Spent Pot Lining (SPL)",
        "chemical_formula": "C + NaF + Al2O3 + Cyanides",
        "source": "Aluminium Smelter - Pot Relining",
        "avg_price_per_mt": 520,
        "carbon_factor": 0.56,
        "monthly_prod": 450,
        "applications": ["Cement Kiln Co-processing", "Carbon Recovery", "Fluoride Recovery", "Steel Industry"],
        "current_stock": 3200,
    },
    {
        "id": "ws-dross-004",
        "type": "ALUMINIUM_DROSS",
        "name": "Aluminium Dross",
        "chemical_formula": "Al + Al2O3 + MgAl2O4",
        "source": "Cast House - Molten Metal Processing",
        "avg_price_per_mt": 890,
        "carbon_factor": 0.72,
        "monthly_prod": 320,
        "applications": ["Secondary Aluminium", "Refractory Materials", "Slag Conditioner", "Alumina Recovery"],
        "current_stock": 1850,
    },
    {
        "id": "ws-caustic-005",
        "type": "CAUSTIC_LIQUOR",
        "name": "Spent Caustic Liquor",
        "chemical_formula": "NaOH + Na2CO3 + NaAlO2",
        "source": "Bayer Process - Digestion Circuit",
        "avg_price_per_mt": 220,
        "carbon_factor": 0.31,
        "monthly_prod": 1800,
        "applications": ["Water Treatment", "Paper Industry", "Soap Manufacturing", "pH Neutralization"],
        "current_stock": 5600,
    },
    {
        "id": "ws-lime-006",
        "type": "LIME_GRIT",
        "name": "Lime Grit / White Mud",
        "chemical_formula": "CaCO3 + Ca(OH)2",
        "source": "Causticization Plant",
        "avg_price_per_mt": 120,
        "carbon_factor": 0.22,
        "monthly_prod": 2200,
        "applications": ["Soil Amendment", "Construction Fill", "Cement Raw Mix", "Acid Mine Drainage"],
        "current_stock": 8900,
    },
]

BUYERS = [
    ("buyer-ultratech-001", "UltraTech Cement Ltd", "Cement", "Jharsuguda, Odisha", "Odisha", 21.8587, 83.9927, 420, True, "21AABCU9603R1ZM", "Rajesh Kumar", "+91-9876543210", "procurement@ultratech.in", 4.8, 18500, 7400),
    ("buyer-acc-002", "ACC Limited", "Cement", "Bargarh, Odisha", "Odisha", 21.3333, 83.6167, 385, True, "21AABCA1584R1ZX", "Priya Sharma", "+91-9876543211", "procurement@acc.in", 4.6, 14200, 5396),
    ("buyer-nhai-003", "NHAI - NH-26 Project", "Highway Construction", "Rayagada, Odisha", "Odisha", 19.1667, 83.4167, 95, True, "21AABCN8795R1ZJ", "Amit Patel", "+91-9876543212", "contracts@nhai.gov.in", 4.9, 8900, 3204),
    ("buyer-jindal-004", "Jindal Steel Works", "Steel", "Angul, Odisha", "Odisha", 20.8409, 85.1019, 340, True, "21AABCJ0901R1Z3", "Vikram Singh", "+91-9876543213", "rawmaterials@jsw.in", 4.5, 4500, 2520),
    ("buyer-ecobrick-005", "Eco Brick Manufacturers", "Brick Making", "Berhampur, Odisha", "Odisha", 19.3149, 84.7941, 180, True, "21AABCE4521R1ZP", "Sunita Devi", "+91-9876543214", "orders@ecobrick.in", 4.3, 6200, 2356),
    ("buyer-tata-006", "Tata Chemicals Ltd", "Chemicals", "Visakhapatnam, AP", "Andhra Pradesh", 17.6868, 83.2185, 510, True, "37AABCT1234R1Z5", "Arjun Reddy", "+91-9876543215", "procurement@tatachemicals.com", 4.7, 3800, 1178),
    ("buyer-greenbuild-007", "Green Build Solutions", "Construction", "Bhubaneswar, Odisha", "Odisha", 20.2961, 85.8245, 460, False, "21AABCG7890R1ZK", "Manoj Behera", "+91-9876543216", "info@greenbuild.in", 0, 0, 0),
    ("buyer-hindalco-008", "Hindalco Industries", "Aluminium", "Hirakud, Odisha", "Odisha", 21.5250, 83.8720, 400, True, "21AABCH5678R1Z2", "Deepak Agarwal", "+91-9876543217", "materials@hindalco.com", 4.4, 2100, 1344),
]

BATCHES = [
    ("batch-redmud-001", "ws-redmud-001", "RED-2026-0001", 2400, 22, 11.2, "A", "AVAILABLE", "Damanjodi Yard-A", "Filter Press + Solar Drying", ["ISO-14001", "CPCB-HW"]),
    ("batch-redmud-002", "ws-redmud-001", "RED-2026-0002", 3100, 19, 10.8, "A", "AVAILABLE", "Damanjodi Yard-A", "Filter Press + Solar Drying", ["ISO-14001", "CPCB-HW", "BIS-Quality"]),
    ("batch-flyash-003", "ws-flyash-002", "FLY-2026-0001", 4500, 8, 9.2, "A", "AVAILABLE", "CPP Silo-1", "Electrostatic Precipitator", ["IS-3812", "ISO-14001"]),
    ("batch-flyash-004", "ws-flyash-002", "FLY-2026-0002", 3200, 12, 10.1, "B", "AVAILABLE", "CPP Silo-2", "Bag Filter", ["IS-3812"]),
    ("batch-spl-005", "ws-spl-003", "SPL-2026-0001", 280, 4, 12.5, "A", "AVAILABLE", "Smelter Hazmat Bay", "Size Reduction + Detox", ["CPCB-HW", "Basel-Convention"]),
    ("batch-dross-006", "ws-dross-004", "ALD-2026-0001", 180, 1, 8.2, "A", "AVAILABLE", "Cast House Yard", "Cooling + Crushing", ["ISO-14001"]),
    ("batch-caustic-007", "ws-caustic-005", "CAU-2026-0001", 1200, 92, 13.1, "B", "AVAILABLE", "Tank Farm-3", "Evaporation + Concentration", ["CPCB-HW"]),
    ("batch-lime-008", "ws-lime-006", "LIM-2026-0001", 2800, 32, 10.2, "A", "AVAILABLE", "Causticization Yard", "Dewatering + Air Drying", ["ISO-14001"]),
]

ROUTES = [
    ("Rayagada", 95, "NH-26", "2h 30m"),
    ("Berhampur", 180, "NH-26 -> NH-59", "4h 15m"),
    ("Angul", 340, "NH-26 -> NH-55", "7h 30m"),
    ("Bargarh", 385, "NH-26 -> NH-53", "8h 45m"),
    ("Hirakud", 400, "NH-26 -> NH-53", "9h 00m"),
    ("Jharsuguda", 420, "NH-49 -> NH-53", "9h 30m"),
    ("Bhubaneswar", 460, "NH-26 -> NH-16", "10h 00m"),
    ("Visakhapatnam", 510, "NH-26 -> NH-16", "11h 15m"),
]

LOCAL_USERS = [
    {
        "email": "admin@nalco.in",
        "name": "NALCO Admin",
        "role": Role.NALCO_ADMIN,
        "password": "admin123",
    }
]


def highway_for_distance(distance: float) -> str:
    if distance <= 120:
        return "NH-26"
    if distance <= 220:
        return "NH-26 -> NH-59"
    if distance <= 360:
        return "NH-26 -> NH-55"
    if distance <= 430:
        return "NH-49 -> NH-53"
    return "NH-26 -> NH-16"

ORDERS = [
    {
        "id": "order-ultratech-001",
        "order_number": "ORD-2026-0001",
        "buyer_id": "buyer-ultratech-001",
        "batch_id": "batch-redmud-001",
        "tonnes": 2400,
        "status": OrderStatus.DELIVERED,
        "created_at": datetime(2026, 1, 10, 9, 30, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 14, 18, 0, tzinfo=UTC),
        "actual_delivery": datetime(2026, 1, 14, 16, 20, tzinfo=UTC),
    },
    {
        "id": "order-acc-002",
        "order_number": "ORD-2026-0002",
        "buyer_id": "buyer-acc-002",
        "batch_id": "batch-flyash-003",
        "tonnes": 3200,
        "status": OrderStatus.DISPATCHED,
        "created_at": datetime(2026, 1, 20, 10, 15, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 25, 12, 0, tzinfo=UTC),
        "actual_delivery": None,
    },
    {
        "id": "order-nhai-003",
        "order_number": "ORD-2026-0003",
        "buyer_id": "buyer-nhai-003",
        "batch_id": "batch-redmud-002",
        "tonnes": 1800,
        "status": OrderStatus.CONFIRMED,
        "created_at": datetime(2026, 1, 22, 11, 0, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 24, 9, 0, tzinfo=UTC),
        "actual_delivery": None,
    },
    {
        "id": "order-jindal-004",
        "order_number": "ORD-2026-0004",
        "buyer_id": "buyer-jindal-004",
        "batch_id": "batch-spl-005",
        "tonnes": 280,
        "status": OrderStatus.PENDING,
        "created_at": datetime(2026, 1, 25, 8, 45, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 30, 14, 0, tzinfo=UTC),
        "actual_delivery": None,
    },
    {
        "id": "order-ecobrick-005",
        "order_number": "ORD-2026-0005",
        "buyer_id": "buyer-ecobrick-005",
        "batch_id": "batch-lime-008",
        "tonnes": 1500,
        "status": OrderStatus.CONFIRMED,
        "created_at": datetime(2026, 1, 24, 13, 20, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 27, 10, 30, tzinfo=UTC),
        "actual_delivery": None,
    },
    {
        "id": "order-tata-006",
        "order_number": "ORD-2026-0006",
        "buyer_id": "buyer-tata-006",
        "batch_id": "batch-caustic-007",
        "tonnes": 1200,
        "status": OrderStatus.PENDING,
        "created_at": datetime(2026, 1, 26, 9, 10, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 2, 2, 17, 0, tzinfo=UTC),
        "actual_delivery": None,
    },
    {
        "id": "order-hindalco-007",
        "order_number": "ORD-2026-0007",
        "buyer_id": "buyer-hindalco-008",
        "batch_id": "batch-dross-006",
        "tonnes": 180,
        "status": OrderStatus.DELIVERED,
        "created_at": datetime(2026, 1, 27, 15, 5, tzinfo=UTC),
        "estimated_delivery": datetime(2026, 1, 29, 15, 0, tzinfo=UTC),
        "actual_delivery": datetime(2026, 1, 29, 13, 40, tzinfo=UTC),
    },
]


async def main() -> None:
    settings = get_settings()
    async with engine.begin() as conn:
        schema_prefix = f'"{settings.default_schema_name}".' if settings.default_schema_name else ""
        await conn.run_sync(Base.metadata.create_all)
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

    async with AsyncSessionLocal() as db:
        for item in LOCAL_USERS:
            user = await db.scalar(select(User).where(User.email == item["email"]))
            if user is None:
                db.add(
                    User(
                        email=item["email"],
                        name=item["name"],
                        role=item["role"],
                        password_hash=hash_password(item["password"]),
                        is_active=True,
                    )
                )
            elif not user.password_hash:
                user.password_hash = hash_password(item["password"])
                user.is_active = True
                user.refresh_token_hash = None
                user.refresh_token_expires_at = None

        for item in WASTE_STREAMS:
            if not await db.get(WasteStream, item["id"]):
                db.add(WasteStream(**item))

        for item in BUYERS:
            if not await db.get(Buyer, item[0]):
                db.add(
                    Buyer(
                        id=item[0],
                        company=item[1],
                        industry=item[2],
                        location=item[3],
                        state=item[4],
                        latitude=item[5],
                        longitude=item[6],
                        distance=item[7],
                        verified=item[8],
                        gst_number=item[9],
                        contact_person=item[10],
                        phone=item[11],
                        email=item[12],
                        rating=item[13],
                        total_ordered=item[14],
                        total_carbon=item[15],
                        waste_interests=[],
                    )
                )

        for item in BATCHES:
            if not await db.get(Batch, item[0]):
                db.add(
                    Batch(
                        id=item[0],
                        waste_stream_id=item[1],
                        batch_code=item[2],
                        tonnes=item[3],
                        moisture=item[4],
                        ph=item[5],
                        grade=item[6],
                        status=item[7],
                        location=item[8],
                        treatment_method=item[9],
                        certifications=item[10],
                    )
                )

        for destination, distance, highway, estimated_time in ROUTES:
            exists = await db.scalar(select(Route).where(Route.destination == destination))
            if not exists:
                db.add(Route(destination=destination, distance=distance, highway=highway, estimated_time=estimated_time))

        for item in ORDERS:
            existing_order = await db.get(Order, item["id"])
            if existing_order is not None:
                continue

            buyer = await db.get(Buyer, item["buyer_id"])
            batch = await db.scalar(
                select(Batch).options(selectinload(Batch.waste_stream)).where(Batch.id == item["batch_id"])
            )
            if buyer is None or batch is None:
                continue

            freight = calculate_freight(item["tonnes"], buyer.distance)
            carbon = calculate_carbon_credits(item["tonnes"], batch.waste_stream.type)

            order = Order(
                id=item["id"],
                order_number=item["order_number"],
                buyer_id=buyer.id,
                batch_id=batch.id,
                tonnes=item["tonnes"],
                price_per_mt=batch.waste_stream.avg_price_per_mt,
                total_value=item["tonnes"] * batch.waste_stream.avg_price_per_mt,
                freight_cost=float(freight["freightCost"]),
                distance=buyer.distance,
                highway=highway_for_distance(buyer.distance),
                truck_count=int(freight["truckCount"]),
                status=item["status"],
                estimated_delivery=item["estimated_delivery"],
                actual_delivery=item["actual_delivery"],
                created_at=item["created_at"],
            )
            db.add(order)
            await db.flush()
            db.add(
                CarbonCredit(
                    order_id=order.id,
                    buyer_id=buyer.id,
                    t_co2e=float(carbon["tCO2e"]),
                    methodology=METHODOLOGY,
                    registry=REGISTRY,
                    value_inr=float(carbon["valueINR"]),
                    verified=item["status"] == OrderStatus.DELIVERED,
                )
            )

        await db.flush()

        all_orders = list((await db.scalars(select(Order).options(selectinload(Order.carbon_credit)))).all())
        all_buyers = list((await db.scalars(select(Buyer))).all())
        all_batches = list((await db.scalars(select(Batch))).all())

        buyer_totals: dict[str, tuple[float, float]] = {}
        batch_statuses: dict[str, BatchStatus] = {}

        for order in all_orders:
            if order.carbon_credit:
                totals = buyer_totals.get(order.buyer_id, (0.0, 0.0))
                buyer_totals[order.buyer_id] = (
                    totals[0] + order.tonnes,
                    totals[1] + order.carbon_credit.t_co2e,
                )
            if order.batch_id not in batch_statuses:
                if order.status == OrderStatus.DELIVERED:
                    batch_statuses[order.batch_id] = BatchStatus.DELIVERED
                elif order.status == OrderStatus.DISPATCHED:
                    batch_statuses[order.batch_id] = BatchStatus.IN_TRANSIT
                elif order.status in {OrderStatus.CONFIRMED, OrderStatus.PENDING}:
                    batch_statuses[order.batch_id] = BatchStatus.RESERVED

        for buyer in all_buyers:
            totals = buyer_totals.get(buyer.id)
            if totals:
                buyer.total_ordered = totals[0]
                buyer.total_carbon = totals[1]

        for batch in all_batches:
            if batch.id in batch_statuses:
                batch.status = batch_statuses[batch.id]

        await db.commit()

        stream_count = len((await db.scalars(select(WasteStream))).all())
        buyer_count = len((await db.scalars(select(Buyer))).all())
        batch_count = len((await db.scalars(select(Batch))).all())
        route_count = len((await db.scalars(select(Route))).all())
        order_count = len((await db.scalars(select(Order))).all())
        credit_count = len((await db.scalars(select(CarbonCredit))).all())
        user_count = len((await db.scalars(select(User))).all())

    print("NALCO W2W seed complete")
    print(f"Timestamp: {datetime.now(UTC).isoformat()}")
    print(f"Waste streams: {stream_count}")
    print(f"Buyers: {buyer_count}")
    print(f"Batches: {batch_count}")
    print(f"Routes: {route_count}")
    print(f"Orders: {order_count}")
    print(f"Carbon credits: {credit_count}")
    print(f"Users: {user_count}")


if __name__ == "__main__":
    asyncio.run(main())
