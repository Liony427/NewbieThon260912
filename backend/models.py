from sqlalchemy import Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import relationship

from backend.database import Base


class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, nullable=False)

    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)

    radius = Column(Integer, nullable=False)

    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    price = Column(Integer, nullable=False)

    status = Column(
        String,
        nullable=False,
        default="WAITING"
    )

    match = relationship(
        "Match",
        back_populates="reservation",
        uselist=False
    )


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)

    reservation_id = Column(
        Integer,
        ForeignKey("reservations.id"),
        unique=True,
        nullable=False
    )

    return_user_id = Column(Integer, nullable=False)
    bike_id = Column(Integer, nullable=False)

    status = Column(
        String,
        nullable=False,
        default="ASSIGNED"
    )

    reservation = relationship(
        "Reservation",
        back_populates="match"
    )