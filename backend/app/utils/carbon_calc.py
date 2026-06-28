from math import ceil

from app.models.waste_stream import WasteType

WASTE_CARBON_FACTORS: dict[str, float] = {
    WasteType.RED_MUD.value: 0.44,
    WasteType.FLY_ASH.value: 0.38,
    WasteType.SPENT_POT_LINING.value: 0.56,
    WasteType.ALUMINIUM_DROSS.value: 0.72,
    WasteType.CAUSTIC_LIQUOR.value: 0.31,
    WasteType.LIME_GRIT.value: 0.22,
}

CARBON_PRICE_INR = 1500
METHODOLOGY = "ISO-14064-2:2019"
REGISTRY = "Indian Carbon Market (ICM)"


def calculate_carbon_credits(tonnes: float, waste_type: str) -> dict[str, float | str]:
    waste_type_value = getattr(waste_type, "value", waste_type)
    factor = WASTE_CARBON_FACTORS[waste_type_value]
    t_co2e = tonnes * factor
    return {
        "tCO2e": round(t_co2e, 3),
        "valueINR": round(t_co2e * CARBON_PRICE_INR, 2),
        "factor": factor,
        "methodology": METHODOLOGY,
    }


def calculate_freight(tonnes: float, distance_km: float) -> dict[str, float | int]:
    truck_count = ceil(tonnes / 25)
    freight_cost = tonnes * distance_km * 4.5 / 25
    transport_co2e = distance_km * truck_count * 2.68 / 1000
    return {
        "freightCost": round(freight_cost, 2),
        "truckCount": truck_count,
        "transportCO2e": round(transport_co2e, 3),
    }
