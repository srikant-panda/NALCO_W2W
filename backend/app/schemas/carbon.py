from pydantic import BaseModel, ConfigDict


class CarbonCreditResponse(BaseModel):
    model_config = ConfigDict(extra="allow", from_attributes=True)


class CarbonListResponse(BaseModel):
    credits: list[dict]
    totalCO2e: float
    totalValueINR: float
    count: int
