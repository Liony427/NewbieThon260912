from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
from backend import models

from backend.routers.auth import router as auth_router
from backend.routers import matching, reservations


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="자전거 바톤터치 API",
    version="0.1.0"
)


# 프론트엔드 CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth
app.include_router(auth_router)

# Matching
app.include_router(matching.router)

# Reservation
app.include_router(reservations.router)


@app.get("/")
def root():
    return {
        "message": "자전거 바톤터치 API"
    }