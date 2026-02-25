import os
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
from dotenv import load_dotenv

load_dotenv("../.env")
db_url = os.getenv("DATABASE_URL") or os.getenv("NEON_API_KEY")

if not db_url:
    print("Database URL not found")
    exit(1)

if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(db_url)

columns_to_add = [
    ("is_load_out", "BOOLEAN DEFAULT FALSE"),
    ("theme", "VARCHAR DEFAULT 'dark'"),
    ("height", "VARCHAR"),
    ("weight", "VARCHAR"),
    ("age", "INTEGER"),
    ("gender", "VARCHAR"),
    ("fitness_goal", "VARCHAR")
]

for col_name, col_type in columns_to_add:
    with engine.connect() as conn:
        try:
            conn.execute(text(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}"))
            conn.commit()
            print(f"Added column {col_name}")
        except Exception as e:
            if "already exists" in str(e):
                print(f"Column {col_name} already exists")
            else:
                print(f"Error adding {col_name}: {e}")

print("Schema update attempt complete")
