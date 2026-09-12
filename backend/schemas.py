from pydantic import BaseModel, EmailStr, field_validator


class ReservationCreate(BaseModel):
    user_id: int
    address: str
    latitude: float
    longitude: float
    radius: int
    start_time: str
    end_time: str


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


class NearbyReservationResponse(BaseModel):
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
    distance: float


class ReservationPriceRequest(BaseModel):
    radius: int


class ReservationPriceResponse(BaseModel):
    price: int


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


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value):
        return value.lower()


class SignupResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }


class LocationCheckRequest(BaseModel):
    reservation_id: int
    latitude: float
    longitude: float


class LocationCheckResponse(BaseModel):
    inside: bool
    distance: float


class ReturnRequest(BaseModel):
    reservation_id: int
    latitude: float
    longitude: float


class ReturnResponse(BaseModel):
    reservation_id: int
    bike_id: int
    discount: int
    status: str
    message: str