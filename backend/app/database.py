from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - Supports both direct PostgreSQL and Firebase Data Connect
# For Firebase Data Connect, use the connection string from Firebase Console
# Format: postgresql://user:password@host:port/database
# For Cloud SQL with Firebase: postgresql://user:password@/database?host=/cloudsql/PROJECT_ID:REGION:INSTANCE
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    os.getenv(
        "FIREBASE_DATA_CONNECT_URL",  # Firebase Data Connect connection URL
        "postgresql://user:password@localhost/trademe"
    )
)

# Add connection pool settings for production
engine = create_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
