from pydantic import BaseModel, EmailStr, Field, field_validator


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

class SignupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=50)
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", mode="before")
    @classmethod
    def trim_name(cls, value):
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        return value.lower()


class SignupResponse(BaseModel):
    id: int
    name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }