import math

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Reservation
from backend.schemas import (
    ReservationCreate,
    ReservationResponse,
    ReservationPriceRequest,
    ReservationPriceResponse
)


router = APIRouter()


def calculate_price(radius: int) -> int:
    if radius <= 100:
        return 500
    elif radius <= 200:
        return 400
    elif radius <= 300:
        return 300
    else:
        return 200


def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    두 위도/경도 사이의 거리를 미터 단위로 계산
    Haversine 공식 사용
    """

    earth_radius = 6371000

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)

    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        * math.cos(lat2_rad)
        * math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return earth_radius * c


@router.post(
    "/reservations/price",
    response_model=ReservationPriceResponse
)
def get_reservation_price(
    price_data: ReservationPriceRequest
):
    price = calculate_price(
        price_data.radius
    )

    return {
        "price": price
    }


@router.post(
    "/reservations",
    response_model=ReservationResponse
)
def create_reservation(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db)
):
    price = calculate_price(
        reservation_data.radius
    )

    new_reservation = Reservation(
        user_id=reservation_data.user_id,
        address=reservation_data.address,
        latitude=reservation_data.latitude,
        longitude=reservation_data.longitude,
        radius=reservation_data.radius,
        start_time=reservation_data.start_time,
        end_time=reservation_data.end_time,
        price=price,
        status="WAITING"
    )

    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)

    return new_reservation


# 주의:
# /reservations/{reservation_id}보다 위에 있어야 함
@router.get(
    "/reservations/nearby"
)
def get_nearby_reservations(
    latitude: float,
    longitude: float,
    max_distance: float = Query(
        default=2000,
        gt=0
    ),
    db: Session = Depends(get_db)
):
    waiting_reservations = (
        db.query(Reservation)
        .filter(
            Reservation.status == "WAITING"
        )
        .all()
    )

    nearby = []

    for reservation in waiting_reservations:

        distance = calculate_distance(
            latitude,
            longitude,
            reservation.latitude,
            reservation.longitude
        )

        if distance <= max_distance:

            nearby.append({
                "id": reservation.id,
                "user_id": reservation.user_id,
                "address": reservation.address,
                "latitude": reservation.latitude,
                "longitude": reservation.longitude,
                "radius": reservation.radius,
                "start_time": reservation.start_time,
                "end_time": reservation.end_time,
                "price": reservation.price,
                "status": reservation.status,
                "distance": round(distance, 1)
            })

    nearby.sort(
        key=lambda item: item["distance"]
    )

    return nearby


@router.get(
    "/reservations/{reservation_id}",
    response_model=ReservationResponse
)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db)
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id
            == reservation_id
        )
        .first()
    )

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    return reservation