from fastapi import FastAPI

from backend.database import Base, engine
from backend import models


Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="자전거 바톤터치 API",
    version="0.1.0"
)


@app.get("/")
def root():
    return {"message": "자전거 바톤터치 API"}