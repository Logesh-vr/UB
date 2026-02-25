import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv("../.env")
db_url = os.getenv("DATABASE_URL") or os.getenv("NEON_API_KEY")

if not db_url:
    print("Database URL not found")
    exit(1)

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)

with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'"))
    columns = [row[0] for row in result]
    print(f"Columns in 'users' table: {columns}")

print("Verification complete")
