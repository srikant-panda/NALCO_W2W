from pydantic import BaseModel, ConfigDict


class BuyerResponse(BaseModel):
    model_config = ConfigDict(extra="allow", from_attributes=True)
