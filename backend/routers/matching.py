from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Reservation, Match
from backend.schemas import (
    ReservationResponse,
    MatchCreate,
    MatchResponse
)


router = APIRouter()


@router.get(
    "/reservations/available",
    response_model=list[ReservationResponse]
)
def get_available_reservations(
    db: Session = Depends(get_db)
):
    reservations = (
        db.query(Reservation)
        .filter(Reservation.status == "WAITING")
        .all()
    )

    return reservations


@router.post(
    "/matching",
    response_model=MatchResponse
)
def create_match(
    match_data: MatchCreate,
    db: Session = Depends(get_db)
):
    # 1. 수행하려는 예약을 찾는다.
    reservation = (
        db.query(Reservation)
        .filter(Reservation.id == match_data.reservation_id)
        .first()
    )

    # 존재하지 않는 예약
    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    # 2. WAITING 상태가 아니라면 이미 누군가 수행 중
    if reservation.status != "WAITING":
        raise HTTPException(
            status_code=409,
            detail="이미 다른 반납자와 매칭된 예약입니다."
        )

    # 3. Match 생성
    new_match = Match(
        reservation_id=match_data.reservation_id,
        return_user_id=match_data.return_user_id,
        bike_id=match_data.bike_id,
        status="ASSIGNED"
    )

    # 4. 예약 상태 변경
    reservation.status = "MATCHED"

    db.add(new_match)
    db.commit()
    db.refresh(new_match)

    return new_match