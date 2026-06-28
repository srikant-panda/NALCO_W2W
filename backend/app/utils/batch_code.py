from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.batch import Batch

PREFIXES = {
    "RED_MUD": "RED",
    "FLY_ASH": "FLY",
    "SPENT_POT_LINING": "SPL",
    "ALUMINIUM_DROSS": "ALD",
    "CAUSTIC_LIQUOR": "CAU",
    "LIME_GRIT": "LIM",
}


async def generate_batch_code(db: AsyncSession, waste_stream_id: str, waste_type: str) -> str:
    count = await db.scalar(select(func.count(Batch.id)).where(Batch.waste_stream_id == waste_stream_id))
    year = datetime.now(UTC).year
    waste_type_value = getattr(waste_type, "value", waste_type)
    prefix = PREFIXES.get(waste_type_value, waste_type_value[:3])
    return f"{prefix}-{year}-{(count or 0) + 1:04d}"
