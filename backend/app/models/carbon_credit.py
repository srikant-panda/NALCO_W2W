from sqlalchemy import Boolean, Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class CarbonCredit(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "carbon_credits"

    order_id: Mapped[str] = mapped_column("orderId", ForeignKey("orders.id"), unique=True, index=True)
    buyer_id: Mapped[str] = mapped_column("buyerId", ForeignKey("buyers.id"), index=True)
    t_co2e: Mapped[float] = mapped_column("tCO2e", Float)
    methodology: Mapped[str] = mapped_column(String(120), default="ISO-14064-2:2019")
    registry: Mapped[str] = mapped_column(String(160), default="Indian Carbon Market (ICM)")
    value_inr: Mapped[float] = mapped_column("valueINR", Float)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    certificate_url: Mapped[str | None] = mapped_column("certificateUrl", String(255), nullable=True)

    order: Mapped["Order"] = relationship(back_populates="carbon_credit")
    buyer: Mapped["Buyer"] = relationship(back_populates="carbon_credits")
