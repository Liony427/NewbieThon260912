from fastapi import FastAPI

from backend.database import Base, engine
from backend import models
from backend.routers.auth import router as auth_router

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="자전거 바톤터치 API",
    version="0.1.0"
)

app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "자전거 바톤터치 API"}


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
