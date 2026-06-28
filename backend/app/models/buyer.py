from sqlalchemy import Boolean, Float, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Buyer(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "buyers"

    company: Mapped[str] = mapped_column(String(180))
    industry: Mapped[str] = mapped_column(String(120))
    location: Mapped[str] = mapped_column(String(180))
    state: Mapped[str] = mapped_column(String(120))
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    distance: Mapped[float] = mapped_column(Float)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    gst_number: Mapped[str | None] = mapped_column("gstNumber", String(32), nullable=True)
    contact_person: Mapped[str | None] = mapped_column("contactPerson", String(120), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    email: Mapped[str | None] = mapped_column(String(180), nullable=True)
    rating: Mapped[float] = mapped_column(Float, default=0)
    waste_interests: Mapped[list[str]] = mapped_column("wasteInterests", ARRAY(String), default=list)
    total_ordered: Mapped[float] = mapped_column("totalOrdered", Float, default=0)
    total_carbon: Mapped[float] = mapped_column("totalCarbon", Float, default=0)

    orders: Mapped[list["Order"]] = relationship(back_populates="buyer")
    carbon_credits: Mapped[list["CarbonCredit"]] = relationship(back_populates="buyer")
