from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Reservation
from backend.schemas import ReservationCreate, ReservationResponse


router = APIRouter()


@router.post(
    "/reservations",
    response_model=ReservationResponse
)
def create_reservation(
    reservation_data: ReservationCreate,
    db: Session = Depends(get_db)
):
    new_reservation = Reservation(
        user_id=reservation_data.user_id,
        address=reservation_data.address,
        latitude=reservation_data.latitude,
        longitude=reservation_data.longitude,
        radius=reservation_data.radius,
        start_time=reservation_data.start_time,
        end_time=reservation_data.end_time,
        price=reservation_data.price,
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