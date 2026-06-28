import enum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, Integer, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class WasteType(str, enum.Enum):
    RED_MUD = "RED_MUD"
    FLY_ASH = "FLY_ASH"
    SPENT_POT_LINING = "SPENT_POT_LINING"
    ALUMINIUM_DROSS = "ALUMINIUM_DROSS"
    CAUSTIC_LIQUOR = "CAUSTIC_LIQUOR"
    LIME_GRIT = "LIME_GRIT"


class WasteStream(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "waste_streams"

    type: Mapped[WasteType] = mapped_column(SAEnum(WasteType, name="waste_type"), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    chemical_formula: Mapped[str] = mapped_column("chemicalFormula", String(255))
    source: Mapped[str] = mapped_column(String(255))
    avg_price_per_mt: Mapped[float] = mapped_column("avgPricePerMT", Float)
    carbon_factor: Mapped[float] = mapped_column("carbonFactor", Float)
    monthly_prod: Mapped[int] = mapped_column("monthlyProd", Integer)
    applications: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    current_stock: Mapped[float] = mapped_column("currentStock", Float, default=0)

    batches: Mapped[list["Batch"]] = relationship(back_populates="waste_stream")
