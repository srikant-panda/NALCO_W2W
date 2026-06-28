from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base, UUIDPrimaryKeyMixin


class SensorReading(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "sensor_readings"
    __table_args__ = (Index("ix_sensor_readings_batch_timestamp", "batchId", "timestamp"),)

    batch_id: Mapped[str] = mapped_column("batchId", ForeignKey("batches.id"), index=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    type: Mapped[str] = mapped_column(String(40))
    value: Mapped[float] = mapped_column(Float)
    unit: Mapped[str] = mapped_column(String(20))
    location: Mapped[str] = mapped_column(String(180))

    batch: Mapped["Batch"] = relationship(back_populates="sensor_readings")
