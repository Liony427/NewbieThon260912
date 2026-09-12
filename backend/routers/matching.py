from math import radians, sin, cos, sqrt, atan2

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from backend.database import get_db
from backend.models import Reservation, Match
from backend.schemas import (
    ReservationResponse,
    MatchCreate,
    MatchResponse,
    LocationCheckRequest,
    LocationCheckResponse,
    ReturnRequest,
    ReturnResponse
)


router = APIRouter()


def calculate_distance(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    earth_radius = 6371000

    lat1 = radians(lat1)
    lon1 = radians(lon1)
    lat2 = radians(lat2)
    lon2 = radians(lon2)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        sin(delta_lat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(delta_lon / 2) ** 2
    )

    c = 2 * atan2(
        sqrt(a),
        sqrt(1 - a)
    )

    return earth_radius * c


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
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == match_data.reservation_id
        )
        .first()
    )

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    if reservation.status != "WAITING":
        raise HTTPException(
            status_code=409,
            detail="이미 다른 반납자와 매칭된 예약입니다."
        )

    new_match = Match(
        reservation_id=match_data.reservation_id,
        return_user_id=match_data.return_user_id,
        bike_id=match_data.bike_id,
        status="ASSIGNED"
    )

    reservation.status = "MATCHED"

    db.add(new_match)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=409,
            detail="이미 다른 반납자와 매칭된 예약입니다."
        )

    db.refresh(new_match)

    return new_match


@router.post(
    "/matching/check-location",
    response_model=LocationCheckResponse
)
def check_location(
    location_data: LocationCheckRequest,
    db: Session = Depends(get_db)
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == location_data.reservation_id
        )
        .first()
    )

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    distance = calculate_distance(
        reservation.latitude,
        reservation.longitude,
        location_data.latitude,
        location_data.longitude
    )

    inside = distance <= reservation.radius

    return {
        "inside": inside,
        "distance": round(distance, 1)
    }


@router.post(
    "/returns",
    response_model=ReturnResponse
)
def complete_return(
    return_data: ReturnRequest,
    db: Session = Depends(get_db)
):
    reservation = (
        db.query(Reservation)
        .filter(
            Reservation.id == return_data.reservation_id
        )
        .first()
    )

    if reservation is None:
        raise HTTPException(
            status_code=404,
            detail="예약을 찾을 수 없습니다."
        )

    if reservation.status != "MATCHED":
        raise HTTPException(
            status_code=409,
            detail="반납 가능한 상태의 예약이 아닙니다."
        )

    match = (
        db.query(Match)
        .filter(
            Match.reservation_id == return_data.reservation_id
        )
        .first()
    )

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="매칭 정보를 찾을 수 없습니다."
        )

    distance = calculate_distance(
        reservation.latitude,
        reservation.longitude,
        return_data.latitude,
        return_data.longitude
    )

    if distance > reservation.radius:
        raise HTTPException(
            status_code=400,
            detail="아직 지정된 반납 구역에 도착하지 않았습니다."
        )

    reservation.status = "COMPLETED"
    match.status = "COMPLETED"

    discount = reservation.price

    db.commit()

    return {
        "reservation_id": reservation.id,
        "bike_id": match.bike_id,
        "discount": discount,
        "status": "COMPLETED",
        "message": f"반납이 완료되었습니다. {discount}원 할인받았습니다!"
    }