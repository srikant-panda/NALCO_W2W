from pydantic import BaseModel, ConfigDict, Field


class LogisticsCalculateRequest(BaseModel):
    tonnes: float
    distance_km: float = Field(alias="distanceKM")
    waste_type: str = Field(alias="wasteType")

    model_config = ConfigDict(populate_by_name=True)
