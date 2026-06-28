from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class BatchCreateRequest(BaseModel):
    waste_stream_id: str = Field(alias="wasteStreamId")
    tonnes: float
    moisture: float
    ph: float
    grade: str
    location: str
    treatment_method: str = Field(alias="treatmentMethod")
    certifications: list[str] = []
    lat: float | None = None
    lng: float | None = None

    model_config = ConfigDict(populate_by_name=True)


class WasteStreamResponse(BaseModel):
    id: str
    type: str
    name: str
    chemicalFormula: str | None = None
    source: str | None = None
    avgPricePerMT: float
    carbonFactor: float | None = None
    monthlyProd: int | None = None
    applications: list[str] | None = None
    currentStock: float | None = None
    createdAt: datetime | str | None = None

    model_config = ConfigDict(from_attributes=True)


class BatchResponse(BaseModel):
    id: str
    batchCode: str
    wasteStreamId: str | None = None
    tonnes: float
    moisture: float | None = None
    ph: float | None = None
    grade: str | None = None
    status: str
    location: str | None = None
    treatmentMethod: str | None = None
    certifications: list[str] | None = None
    lat: float | None = None
    lng: float | None = None
    createdAt: datetime | str | None = None
    updatedAt: datetime | str | None = None
    wasteStream: WasteStreamResponse | dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class InventoryResponse(BaseModel):
    batches: list[BatchResponse]
    stats: dict[str, float | int]
