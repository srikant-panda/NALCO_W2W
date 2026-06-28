import enum
from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class OrderStatus(str, enum.Enum):
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"


class Order(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "orders"

    order_number: Mapped[str] = mapped_column("orderNumber", String(64), unique=True, index=True)
    buyer_id: Mapped[str] = mapped_column("buyerId", ForeignKey("buyers.id"), index=True)
    batch_id: Mapped[str] = mapped_column("batchId", ForeignKey("batches.id"), index=True)
    tonnes: Mapped[float] = mapped_column(Float)
    price_per_mt: Mapped[float] = mapped_column("pricePerMT", Float)
    total_value: Mapped[float] = mapped_column("totalValue", Float)
    freight_cost: Mapped[float] = mapped_column("freightCost", Float)
    distance: Mapped[float] = mapped_column(Float)
    highway: Mapped[str] = mapped_column(String(120))
    truck_count: Mapped[int] = mapped_column("truckCount")
    status: Mapped[OrderStatus] = mapped_column(
        SAEnum(OrderStatus, name="order_status"), default=OrderStatus.PENDING.value, index=True
    )
    estimated_delivery: Mapped[datetime] = mapped_column("estimatedDelivery", DateTime(timezone=True))
    actual_delivery: Mapped[datetime | None] = mapped_column("actualDelivery", DateTime(timezone=True), nullable=True)

    buyer: Mapped["Buyer"] = relationship(back_populates="orders")
    batch: Mapped["Batch"] = relationship(back_populates="orders")
    carbon_credit: Mapped["CarbonCredit | None"] = relationship(
        back_populates="order", cascade="all, delete-orphan", uselist=False
    )
