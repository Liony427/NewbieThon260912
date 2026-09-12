from fastapi import APIRouter, Depends, HTTPException
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


@router.post(
    "/reservations/price",
    response_model=ReservationPriceResponse
)
def get_reservation_price(
    price_data: ReservationPriceRequest
):
    price = calculate_price(price_data.radius)

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
    price = calculate_price(reservation_data.radius)

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
        .filter(Reservation.id == reservation_id)
        .first()
    )

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    return reservation