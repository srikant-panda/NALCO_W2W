from pydantic import BaseModel, ConfigDict, Field


class OrderCreateRequest(BaseModel):
    buyer_id: str = Field(alias="buyerId")
    batch_id: str = Field(alias="batchId")
    tonnes: float

    model_config = ConfigDict(populate_by_name=True)


class OrderStatusUpdateRequest(BaseModel):
    status: str


class OrderResponse(BaseModel):
    model_config = ConfigDict(extra="allow", from_attributes=True)


class OrderListResponse(BaseModel):
    orders: list[dict]
    stats: dict
