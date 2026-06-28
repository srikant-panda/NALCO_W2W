from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies.auth import require_role
from app.dependencies.db import get_session
from app.models.batch import Batch, BatchStatus
from app.models.waste_stream import WasteStream
from app.schemas.inventory import BatchCreateRequest
from app.utils.batch_code import generate_batch_code
from app.utils.serializers import batch_dict
from app.websocket.manager import manager

router = APIRouter(prefix="/inventory", tags=["inventory"])


async def _inventory_response(db: AsyncSession, waste_type: str | None, status_filter: str | None, grade: str | None):
    query = select(Batch).options(selectinload(Batch.waste_stream)).join(Batch.waste_stream)
    if waste_type:
        query = query.where(WasteStream.type == waste_type)
    if status_filter:
        query = query.where(Batch.status == status_filter)
    if grade:
        query = query.where(Batch.grade == grade)
    query = query.order_by(Batch.created_at.desc())
    batches = list((await db.scalars(query)).all())

    all_batches = list((await db.scalars(select(Batch))).all())
    return {
        "batches": [batch_dict(batch) for batch in batches],
        "stats": {
            "totalBatches": len(all_batches),
            "availableStock": sum(batch.tonnes for batch in all_batches if batch.status == BatchStatus.AVAILABLE),
            "gradeA": sum(1 for batch in all_batches if batch.grade == "A"),
            "inTransit": sum(1 for batch in all_batches if batch.status == BatchStatus.IN_TRANSIT),
        },
    }


@router.get("")
@router.get("/batches")
async def list_batches(
    wasteType: str | None = None,
    status: str | None = None,
    grade: str | None = None,
    db: AsyncSession = Depends(get_session),
) -> dict:
    return await _inventory_response(db, wasteType, status, grade)


@router.post("", status_code=status.HTTP_201_CREATED)
@router.post("/batches", status_code=status.HTTP_201_CREATED)
async def create_batch(
    payload: BatchCreateRequest,
    db: AsyncSession = Depends(get_session),
    _user=Depends(require_role("NALCO_ADMIN")),
) -> dict:
    waste_stream = await db.get(WasteStream, payload.waste_stream_id)
    if waste_stream is None:
        raise HTTPException(status_code=404, detail={"error": "Waste stream not found"})

    batch = Batch(
        batch_code=await generate_batch_code(db, waste_stream.id, waste_stream.type),
        waste_stream_id=waste_stream.id,
        tonnes=payload.tonnes,
        moisture=payload.moisture,
        ph=payload.ph,
        grade=payload.grade,
        status=BatchStatus.AVAILABLE,
        location=payload.location,
        treatment_method=payload.treatment_method,
        certifications=payload.certifications,
        lat=payload.lat,
        lng=payload.lng,
    )
    db.add(batch)
    await db.commit()
    created = await db.scalar(
        select(Batch).options(selectinload(Batch.waste_stream)).where(Batch.id == batch.id)
    )
    data = batch_dict(created)
    await manager.broadcast("dashboard", {"event": "inventory:new", "data": data})
    return data


@router.get("/streams")
async def list_waste_streams(db: AsyncSession = Depends(get_session)) -> list[dict]:
    streams = list((await db.scalars(select(WasteStream).order_by(WasteStream.name))).all())
    return [
        {
            "id": stream.id,
            "type": stream.type,
            "name": stream.name,
            "chemicalFormula": stream.chemical_formula,
            "source": stream.source,
            "avgPricePerMT": stream.avg_price_per_mt,
            "carbonFactor": stream.carbon_factor,
            "monthlyProd": stream.monthly_prod,
            "applications": stream.applications,
            "currentStock": stream.current_stock,
        }
        for stream in streams
    ]


@router.get("/metrics")
async def inventory_metrics(db: AsyncSession = Depends(get_session)) -> dict:
    total_batches = await db.scalar(select(func.count(Batch.id)))
    total_stock = await db.scalar(
        select(func.coalesce(func.sum(Batch.tonnes), 0)).where(Batch.status == BatchStatus.AVAILABLE)
    )
    return {"totalBatches": total_batches or 0, "availableStock": total_stock or 0}
