from pydantic import BaseModel


class ReservationCreate(BaseModel):
    user_id: int

    address: str
    latitude: float
    longitude: float

    radius: int

    start_time: str
    end_time: str

    price: int


class ReservationResponse(BaseModel):
    id: int
    user_id: int

    address: str
    latitude: float
    longitude: float

    radius: int

    start_time: str
    end_time: str

    price: int
    status: str

    model_config = {
        "from_attributes": True
    }


class MatchCreate(BaseModel):
    reservation_id: int
    return_user_id: int
    bike_id: int


class MatchResponse(BaseModel):
    id: int
    reservation_id: int
    return_user_id: int
    bike_id: int
    status: str

    model_config = {
        "from_attributes": True
    }