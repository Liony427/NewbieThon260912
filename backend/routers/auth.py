from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import User
from backend.schemas import SignupRequest, SignupResponse


router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

password_hasher = PasswordHash.recommended()


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    message: str
    user: SignupResponse


@router.post(
    "/signup",
    response_model=SignupResponse,
    status_code=status.HTTP_201_CREATED
)
def signup(
    body: SignupRequest,
    db: Session = Depends(get_db)
):
    existing_user = db.scalar(
        select(User).where(User.email == body.email)
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="이미 가입된 이메일입니다."
        )

    new_user = User(
        name=body.name,
        email=body.email,
        password_hash=password_hasher.hash(body.password)
    )

    db.add(new_user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()

        existing_user = db.scalar(
            select(User).where(User.email == body.email)
        )

        if existing_user is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="이미 가입된 이메일입니다."
            )

        raise

    db.refresh(new_user)

    return new_user


@router.post(
    "/login",
    response_model=LoginResponse,
    status_code=status.HTTP_200_OK
)
def login(
    body: LoginRequest,
    db: Session = Depends(get_db)
):
    email = str(body.email).lower()

    user = db.scalar(
        select(User).where(User.email == email)
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호를 확인하고 다시 시도해주세요."
        )

    password_matches = password_hasher.verify(
        body.password,
        user.password_hash
    )

    if not password_matches:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호를 확인하고 다시 시도해주세요."
        )

    return {
        "message": "로그인 성공",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }