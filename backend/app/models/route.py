from sqlalchemy import Float, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Route(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "routes"

    origin: Mapped[str] = mapped_column(String(120), default="Damanjodi")
    destination: Mapped[str] = mapped_column(String(180), index=True)
    distance: Mapped[float] = mapped_column(Float)
    highway: Mapped[str] = mapped_column(String(120))
    freight_rate: Mapped[float] = mapped_column("freightRate", Float, default=4.5)
    estimated_time: Mapped[str] = mapped_column("estimatedTime", String(40))
