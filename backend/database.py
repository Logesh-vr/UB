from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load from the root of the project
load_dotenv("../.env")
load_dotenv(".env")

# Prioritize DATABASE_URL, then NEON_API_KEY
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("NEON_API_KEY")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL or NEON_API_KEY not found in environment variables")

# Fix for Render/Heroku where postgres:// is used instead of postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
