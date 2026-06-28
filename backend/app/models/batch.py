import enum

from sqlalchemy import Enum as SAEnum
from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class BatchStatus(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    RESERVED = "RESERVED"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    REJECTED = "REJECTED"


class Batch(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "batches"

    batch_code: Mapped[str] = mapped_column("batchCode", String(64), unique=True, index=True)
    waste_stream_id: Mapped[str] = mapped_column("wasteStreamId", ForeignKey("waste_streams.id"), index=True)
    tonnes: Mapped[float] = mapped_column(Float)
    moisture: Mapped[float] = mapped_column(Float)
    ph: Mapped[float] = mapped_column(Float)
    grade: Mapped[str] = mapped_column(String(1))
    status: Mapped[BatchStatus] = mapped_column(
        SAEnum(BatchStatus, name="batch_status"), default=BatchStatus.AVAILABLE.value, index=True
    )
    location: Mapped[str] = mapped_column(String(255))
    treatment_method: Mapped[str] = mapped_column("treatmentMethod", String(255))
    certifications: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    lat: Mapped[float | None] = mapped_column(Float, nullable=True)
    lng: Mapped[float | None] = mapped_column(Float, nullable=True)

    waste_stream: Mapped["WasteStream"] = relationship(back_populates="batches")
    orders: Mapped[list["Order"]] = relationship(back_populates="batch")
    sensor_readings: Mapped[list["SensorReading"]] = relationship(back_populates="batch", cascade="all, delete-orphan")
