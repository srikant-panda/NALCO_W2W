from datetime import date, datetime
from typing import Any

from app.models.batch import Batch
from app.models.buyer import Buyer
from app.models.carbon_credit import CarbonCredit
from app.models.order import Order
from app.models.waste_stream import WasteStream


def iso(value: datetime | date | None) -> str | None:
    return value.isoformat() if value else None


def enum_value(value: Any) -> Any:
    return getattr(value, "value", value)


def waste_stream_dict(waste_stream: WasteStream, compact: bool = False) -> dict[str, Any]:
    data = {
        "id": waste_stream.id,
        "type": enum_value(waste_stream.type),
        "name": waste_stream.name,
        "avgPricePerMT": waste_stream.avg_price_per_mt,
    }
    if compact:
        return data
    data.update(
        {
            "chemicalFormula": waste_stream.chemical_formula,
            "source": waste_stream.source,
            "carbonFactor": waste_stream.carbon_factor,
            "monthlyProd": waste_stream.monthly_prod,
            "applications": waste_stream.applications,
            "currentStock": waste_stream.current_stock,
            "createdAt": iso(waste_stream.created_at),
        }
    )
    return data


def batch_dict(batch: Batch, include_waste_stream: bool = True, compact: bool = False) -> dict[str, Any]:
    data = {
        "id": batch.id,
        "batchCode": batch.batch_code,
        "wasteStreamId": batch.waste_stream_id,
        "tonnes": batch.tonnes,
        "moisture": batch.moisture,
        "ph": batch.ph,
        "grade": batch.grade,
        "status": enum_value(batch.status),
        "location": batch.location,
        "treatmentMethod": batch.treatment_method,
        "certifications": batch.certifications,
        "lat": batch.lat,
        "lng": batch.lng,
        "createdAt": iso(batch.created_at),
        "updatedAt": iso(batch.updated_at),
    }
    if compact:
        data = {k: data[k] for k in ("id", "batchCode", "tonnes", "status")}
    if include_waste_stream and batch.waste_stream:
        data["wasteStream"] = waste_stream_dict(batch.waste_stream, compact=compact)
    return data


def buyer_dict(buyer: Buyer) -> dict[str, Any]:
    return {
        "id": buyer.id,
        "company": buyer.company,
        "industry": buyer.industry,
        "location": buyer.location,
        "state": buyer.state,
        "latitude": buyer.latitude,
        "longitude": buyer.longitude,
        "distance": buyer.distance,
        "verified": buyer.verified,
        "gstNumber": buyer.gst_number,
        "contactPerson": buyer.contact_person,
        "phone": buyer.phone,
        "email": buyer.email,
        "rating": buyer.rating,
        "totalOrdered": buyer.total_ordered,
        "totalCarbon": buyer.total_carbon,
        "wasteInterests": buyer.waste_interests,
        "createdAt": iso(buyer.created_at),
        "updatedAt": iso(buyer.updated_at),
    }


def carbon_credit_dict(credit: CarbonCredit, include_relations: bool = False) -> dict[str, Any]:
    data = {
        "id": credit.id,
        "orderId": credit.order_id,
        "buyerId": credit.buyer_id,
        "tCO2e": credit.t_co2e,
        "methodology": credit.methodology,
        "registry": credit.registry,
        "valueINR": credit.value_inr,
        "verified": credit.verified,
        "certificateUrl": credit.certificate_url,
        "createdAt": iso(credit.created_at),
    }
    if include_relations:
        if credit.buyer:
            data["buyer"] = buyer_dict(credit.buyer)
        if credit.order:
            data["order"] = order_dict(credit.order, include_carbon=False)
    return data


def order_dict(order: Order, include_carbon: bool = True) -> dict[str, Any]:
    data = {
        "id": order.id,
        "orderNumber": order.order_number,
        "buyerId": order.buyer_id,
        "batchId": order.batch_id,
        "tonnes": order.tonnes,
        "pricePerMT": order.price_per_mt,
        "totalValue": order.total_value,
        "freightCost": order.freight_cost,
        "distance": order.distance,
        "highway": order.highway,
        "truckCount": order.truck_count,
        "status": enum_value(order.status),
        "estimatedDelivery": iso(order.estimated_delivery),
        "actualDelivery": iso(order.actual_delivery),
        "createdAt": iso(order.created_at),
        "updatedAt": iso(order.updated_at),
    }
    if order.buyer:
        data["buyer"] = buyer_dict(order.buyer)
    if order.batch:
        data["batch"] = batch_dict(order.batch, include_waste_stream=True, compact=True)
    if include_carbon and order.carbon_credit:
        data["carbonCredits"] = carbon_credit_dict(order.carbon_credit)
    return data
