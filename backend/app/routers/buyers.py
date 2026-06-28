from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.db import get_session
from app.models.buyer import Buyer
from app.utils.serializers import buyer_dict

router = APIRouter(prefix="/buyers", tags=["buyers"])


@router.get("")
async def list_buyers(verified: bool | None = None, db: AsyncSession = Depends(get_session)) -> list[dict]:
    query = select(Buyer).order_by(Buyer.company)
    if verified is not None:
        query = query.where(Buyer.verified == verified)
    buyers = list((await db.scalars(query)).all())
    return [buyer_dict(buyer) for buyer in buyers]
