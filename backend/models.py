from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    is_load_out = Column(Boolean, default=False)
    theme = Column(String, default="dark")
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    fitness_goal = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    routines = relationship("Routine", back_populates="owner")
    prs = relationship("PersonalRecord", back_populates="owner")
    history = relationship("WorkoutHistory", back_populates="owner")

class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    data = Column(JSON)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="routines")

class PersonalRecord(Base):
    __tablename__ = "personal_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    data = Column(JSON)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    owner = relationship("User", back_populates="prs")

class WorkoutHistory(Base):
    __tablename__ = "workout_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    workout_title = Column(String)
    date = Column(String)
    timestamp = Column(JSON) # Storing as JSON or BigInteger, frontend sends Date.now()
    exercises = Column(JSON) # Detailed log of the session
    is_load_out = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="history")
