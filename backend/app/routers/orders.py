import time
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies.auth import require_role
from app.dependencies.db import get_session
from app.models.batch import Batch, BatchStatus
from app.models.buyer import Buyer
from app.models.carbon_credit import CarbonCredit
from app.models.order import Order, OrderStatus
from app.schemas.orders import OrderCreateRequest, OrderStatusUpdateRequest
from app.utils.carbon_calc import METHODOLOGY, REGISTRY, calculate_carbon_credits, calculate_freight
from app.utils.serializers import order_dict
from app.websocket.manager import manager

router = APIRouter(prefix="/orders", tags=["orders"])


def _highway_for_distance(distance: float) -> str:
    if distance <= 120:
        return "NH-26"
    if distance <= 220:
        return "NH-26 -> NH-59"
    if distance <= 360:
        return "NH-26 -> NH-55"
    if distance <= 430:
        return "NH-49 -> NH-53"
    return "NH-26 -> NH-16"


async def _load_order(db: AsyncSession, order_id: str) -> Order | None:
    return await db.scalar(
        select(Order)
        .options(
            selectinload(Order.buyer),
            selectinload(Order.batch).selectinload(Batch.waste_stream),
            selectinload(Order.carbon_credit),
        )
        .where(Order.id == order_id)
    )


@router.get("")
async def list_orders(status: str | None = None, buyerId: str | None = None, db: AsyncSession = Depends(get_session)) -> dict:
    query = select(Order).options(
        selectinload(Order.buyer),
        selectinload(Order.batch).selectinload(Batch.waste_stream),
        selectinload(Order.carbon_credit),
    )
    if status:
        query = query.where(Order.status == status)
    if buyerId:
        query = query.where(Order.buyer_id == buyerId)
    query = query.order_by(Order.created_at.desc())
    orders = list((await db.scalars(query)).all())
    return {
        "orders": [order_dict(order) for order in orders],
        "stats": {
            "count": len(orders),
            "totalValue": sum(order.total_value for order in orders if order.status != OrderStatus.CANCELLED),
            "totalCO2": sum((order.carbon_credit.t_co2e if order.carbon_credit else 0) for order in orders),
            "pending": sum(1 for order in orders if order.status == OrderStatus.PENDING),
            "dispatched": sum(1 for order in orders if order.status == OrderStatus.DISPATCHED),
            "delivered": sum(1 for order in orders if order.status == OrderStatus.DELIVERED),
        },
    }


@router.get("/{order_id}")
async def get_order(order_id: str, db: AsyncSession = Depends(get_session)) -> dict:
    order = await _load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    return order_dict(order)


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_order(payload: OrderCreateRequest, db: AsyncSession = Depends(get_session)) -> dict:
    buyer = await db.get(Buyer, payload.buyer_id)
    batch = await db.scalar(
        select(Batch).options(selectinload(Batch.waste_stream)).where(Batch.id == payload.batch_id)
    )
    if buyer is None:
        raise HTTPException(status_code=404, detail={"error": "Buyer not found"})
    if batch is None:
        raise HTTPException(status_code=404, detail={"error": "Batch not found"})
    if batch.status != BatchStatus.AVAILABLE:
        raise HTTPException(status_code=400, detail={"error": "Batch is not available", "currentStatus": batch.status})
    if batch.tonnes < payload.tonnes:
        raise HTTPException(
            status_code=400,
            detail={"error": "Insufficient stock in batch", "available": batch.tonnes, "requested": payload.tonnes},
        )

    freight = calculate_freight(payload.tonnes, buyer.distance)
    carbon = calculate_carbon_credits(payload.tonnes, batch.waste_stream.type)
    order = Order(
        order_number=f"ORD-{int(time.time() * 1000)}",
        buyer_id=buyer.id,
        batch_id=batch.id,
        tonnes=payload.tonnes,
        price_per_mt=batch.waste_stream.avg_price_per_mt,
        total_value=payload.tonnes * batch.waste_stream.avg_price_per_mt,
        freight_cost=float(freight["freightCost"]),
        distance=buyer.distance,
        highway=_highway_for_distance(buyer.distance),
        truck_count=int(freight["truckCount"]),
        status=OrderStatus.PENDING,
        estimated_delivery=datetime.now(UTC) + timedelta(days=32),
    )
    batch.status = BatchStatus.RESERVED
    buyer.total_ordered += payload.tonnes
    buyer.total_carbon += float(carbon["tCO2e"])
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
            verified=False,
        )
    )
    await db.commit()
    created = await _load_order(db, order.id)
    data = {
        "order": order_dict(created),
        "carbonSummary": {"tCO2e": carbon["tCO2e"], "valueINR": carbon["valueINR"], "factor": carbon["factor"]},
        "freightSummary": {
            "freightCost": freight["freightCost"],
            "truckCount": freight["truckCount"],
            "highway": order.highway,
            "distanceKM": buyer.distance,
        },
        "message": "Order created successfully",
    }
    await manager.broadcast("dashboard", {"event": "metrics:update", "data": {"lastUpdate": datetime.now(UTC).isoformat()}})
    await manager.broadcast("orders", {"event": "orders:update", "data": [data["order"]]})
    return data


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: str,
    payload: OrderStatusUpdateRequest,
    db: AsyncSession = Depends(get_session),
    _user=Depends(require_role("NALCO_ADMIN", "LOGISTICS")),
) -> dict:
    valid = {item.value for item in OrderStatus}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail={"error": "Invalid status", "validValues": sorted(valid)})
    order = await _load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    next_status = OrderStatus(payload.status)
    order.status = next_status
    if payload.status == OrderStatus.DELIVERED.value:
        order.actual_delivery = datetime.now(UTC)
        if order.batch:
            order.batch.status = BatchStatus.DELIVERED
    elif payload.status == OrderStatus.DISPATCHED.value and order.batch:
        order.batch.status = BatchStatus.IN_TRANSIT
    await db.commit()
    updated = await _load_order(db, order_id)
    return {"order": order_dict(updated), "message": f"Order status updated to {payload.status}"}


@router.delete("/{order_id}")
async def cancel_order(order_id: str, db: AsyncSession = Depends(get_session)) -> dict:
    order = await _load_order(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail={"error": "Order not found"})
    if order.batch:
        order.batch.status = BatchStatus.AVAILABLE
    if order.buyer and order.carbon_credit:
        order.buyer.total_ordered = max(0, order.buyer.total_ordered - order.tonnes)
        order.buyer.total_carbon = max(0, order.buyer.total_carbon - order.carbon_credit.t_co2e)
    order.status = OrderStatus.CANCELLED
    await db.execute(delete(CarbonCredit).where(CarbonCredit.order_id == order.id))
    await db.commit()
    return {"message": "Order cancelled and batch released"}
