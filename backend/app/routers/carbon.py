from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.dependencies.db import get_session
from app.models.batch import Batch
from app.models.carbon_credit import CarbonCredit
from app.models.order import Order
from app.utils.serializers import carbon_credit_dict

router = APIRouter(prefix="/carbon", tags=["carbon"])


@router.get("")
async def list_carbon_credits(buyerId: str | None = None, db: AsyncSession = Depends(get_session)) -> dict:
    query = select(CarbonCredit).options(
        selectinload(CarbonCredit.buyer),
        selectinload(CarbonCredit.order).selectinload(Order.buyer),
        selectinload(CarbonCredit.order).selectinload(Order.batch).selectinload(Batch.waste_stream),
    )
    if buyerId:
        query = query.where(CarbonCredit.buyer_id == buyerId)
    credits = list((await db.scalars(query)).all())
    return {
        "credits": [carbon_credit_dict(credit, include_relations=True) for credit in credits],
        "totalCO2e": sum(credit.t_co2e for credit in credits),
        "totalValueINR": sum(credit.value_inr for credit in credits),
        "count": len(credits),
    }
