from fastapi import APIRouter

from app.schemas.logistics import LogisticsCalculateRequest
from app.utils.carbon_calc import calculate_carbon_credits, calculate_freight

router = APIRouter(prefix="/logistics", tags=["logistics"])


@router.post("/calculate")
async def calculate_logistics(payload: LogisticsCalculateRequest) -> dict:
    freight = calculate_freight(payload.tonnes, payload.distance_km)
    carbon = calculate_carbon_credits(payload.tonnes, payload.waste_type)
    return {
        "freightCost": freight["freightCost"],
        "truckCount": freight["truckCount"],
        "transportCO2e": freight["transportCO2e"],
        "carbonCredits": carbon,
        "netCO2e": round(float(carbon["tCO2e"]) - float(freight["transportCO2e"]), 3),
    }
