from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
import os

import models
import auth
import database
from database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="UB Gym Tracker API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/token")

class MetricType(str, Enum):
    KG = "KG"
    LBS = "LBS"
    PLATES = "PLATES"
    SECS = "SECS"

# Pydantic Schemas
class ExerciseSchema(BaseModel):
    id: str
    name: str
    relation: str
    targetSets: Optional[int] = 3
    defaultMetric: MetricType
    partnerName: Optional[str] = None
    partnerMetric: Optional[MetricType] = None
    primaryMuscle: Optional[str] = None
    secondaryMuscles: Optional[List[str]] = None

class WorkoutSessionSchema(BaseModel):
    id: str
    title: str
    subtitle: Optional[str] = None
    exercises: List[ExerciseSchema]

class PersonalRecordsSchema(BaseModel):
    bench: str
    squat: str
    deadlift: str

class UserCreate(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserSettingsSchema(BaseModel):
    is_load_out: bool
    theme: Optional[str] = "dark"

class LeaderboardEntry(BaseModel):
    username: str
    bench: float
    squat: float
    deadlift: float
    total: float

class Token(BaseModel):
    access_token: str
    token_type: str

class WorkoutHistorySchema(BaseModel):
    id: Optional[int] = None
    workoutTitle: str
    date: str
    timestamp: Optional[float] = None
    exercises: List[dict]
    isLoadOut: Optional[bool] = False

class WorkoutHistoryCreate(BaseModel):
    workoutTitle: str
    date: str
    timestamp: Optional[float] = None
    exercises: List[dict]
    isLoadOut: Optional[bool] = False

# Auth Utilities
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        from jose import jwt
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        identity: str = payload.get("sub")
        if identity is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    # Try searching by username first, then email
    user = db.query(models.User).filter(models.User.username == identity).first()
    if user is None:
        user = db.query(models.User).filter(models.User.email == identity).first()
    
    if user is None:
        raise credentials_exception
    return user

# Auth Endpoints
@app.post("/api/auth/register", response_model=Token)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    if user.email:
        db_email = db.query(models.User).filter(models.User.email == user.email).first()
        if db_email:
            raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/auth/token", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Try logging in with username OR email
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
        
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

# Data Endpoints
@app.get("/")
async def root():
    return {"message": "UB Gym Tracker API is running"}

@app.get("/api/routine", response_model=List[WorkoutSessionSchema])
async def get_routine(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    routine = db.query(models.Routine).filter(models.Routine.user_id == current_user.id).first()
    if not routine:
        return []
    return routine.data

@app.post("/api/routine")
async def save_routine(routine: List[WorkoutSessionSchema], current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_routine = db.query(models.Routine).filter(models.Routine.user_id == current_user.id).first()
    if db_routine:
        db_routine.data = [r.dict() for r in routine]
    else:
        new_routine = models.Routine(user_id=current_user.id, data=[r.dict() for r in routine])
        db.add(new_routine)
    db.commit()
    return {"status": "success"}

@app.get("/api/prs", response_model=PersonalRecordsSchema)
async def get_prs(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    prs = db.query(models.PersonalRecord).filter(models.PersonalRecord.user_id == current_user.id).first()
    if not prs:
        return {"bench": "0", "squat": "0", "deadlift": "0"}
    return prs.data

@app.post("/api/prs")
async def save_prs(prs: PersonalRecordsSchema, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    print(f"Saving PRs for user {current_user.username or current_user.email}: {prs.dict()}")
    db_prs = db.query(models.PersonalRecord).filter(models.PersonalRecord.user_id == current_user.id).first()
    if db_prs:
        db_prs.data = prs.dict()
    else:
        new_prs = models.PersonalRecord(user_id=current_user.id, data=prs.dict())
        db.add(new_prs)
    db.commit()
    return {"status": "success"}

@app.get("/api/history", response_model=List[WorkoutHistorySchema])
async def get_history(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    history = db.query(models.WorkoutHistory).filter(models.WorkoutHistory.user_id == current_user.id).all()
    return [
        {
            "id": h.id,
            "workoutTitle": h.workout_title,
            "date": h.date,
            "timestamp": h.timestamp,
            "exercises": h.exercises,
            "isLoadOut": h.is_load_out
        }
        for h in history
    ]

@app.post("/api/history")
async def save_history(history: WorkoutHistoryCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_history = models.WorkoutHistory(
        user_id=current_user.id,
        workout_title=history.workoutTitle,
        date=history.date,
        timestamp=history.timestamp,
        exercises=history.exercises,
        is_load_out=history.isLoadOut
    )
    db.add(new_history)
    db.commit()
    return {"status": "success"}

@app.get("/api/settings", response_model=UserSettingsSchema)
async def get_settings(current_user: models.User = Depends(get_current_user)):
    return {"is_load_out": current_user.is_load_out, "theme": current_user.theme}

@app.post("/api/settings")
async def save_settings(settings: UserSettingsSchema, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.is_load_out = settings.is_load_out
    if settings.theme:
        current_user.theme = settings.theme
    db.commit()
    return {"status": "success"}

@app.get("/api/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(db: Session = Depends(get_db)):
    users = db.query(models.User).all()
    leaderboard = []
    
    def safe_float(val):
        try:
            return float(val) if val else 0.0
        except (ValueError, TypeError):
            return 0.0

    for user in users:
        pr = db.query(models.PersonalRecord).filter(models.PersonalRecord.user_id == user.id).first()
        # Ensure we have a valid dictionary even if pr.data is None
        pr_data = pr.data if pr and isinstance(pr.data, dict) else {}
        
        bench = safe_float(pr_data.get('bench', 0))
        squat = safe_float(pr_data.get('squat', 0))
        deadlift = safe_float(pr_data.get('deadlift', 0))
        total = bench + squat + deadlift
        
        leaderboard.append({
            "username": user.username or (user.email.split('@')[0] if user.email else "Anonymous"),
            "bench": bench,
            "squat": squat,
            "deadlift": deadlift,
            "total": total
        })
    
    # Sort by total descending
    leaderboard.sort(key=lambda x: x['total'], reverse=True)
    return leaderboard
