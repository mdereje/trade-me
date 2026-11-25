import os
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Load environment variables before importing modules that read them
load_dotenv()

import app.models  # noqa: E402, F401 - register all SQLAlchemy models
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.routers import auth, items, payments, reviews, trades, users  # noqa: E402
from app.utils.security import validate_security_config  # noqa: E402
from app.utils.seed import seed_default_categories  # noqa: E402

# Validate security configuration (fails closed if SECRET_KEY unset in production)
validate_security_config()

# In dev/test (or when explicitly enabled), create tables and seed categories automatically.
# In production, run `alembic upgrade head` via a migration job prior to serving traffic.
_env = os.getenv("ENV", "").lower()
if _env in ("development", "test") or os.getenv("AUTO_CREATE_TABLES", "").lower() == "true":
    Base.metadata.create_all(bind=engine)
    _db = SessionLocal()
    try:
        seed_default_categories(_db)
    finally:
        _db.close()

app = FastAPI(
    title="Trade Me API",
    description="A barter platform API for trading everyday items",
    version="1.0.0",
)

# CORS middleware
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "trade-me-13f73")
cors_origins = [
    "http://localhost:3000",
    "https://storage.googleapis.com",
]

if FIREBASE_PROJECT_ID:
    cors_origins.extend([
        f"https://{FIREBASE_PROJECT_ID}.web.app",
        f"https://{FIREBASE_PROJECT_ID}.firebaseapp.com",
    ])

custom_origins = os.getenv("CORS_ORIGINS", "")
if custom_origins:
    cors_origins.extend([o.strip() for o in custom_origins.split(",") if o.strip()])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(items.router, prefix="/api/items", tags=["items"])
app.include_router(trades.router, prefix="/api/trades", tags=["trades"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(reviews.router, prefix="/api/reviews", tags=["reviews"])

# Static files for local/dev uploaded images
static_dir = Path("static")
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static", StaticFiles(directory=str(static_dir)), name="static")


@app.get("/")
async def root():
    return {"message": "Trade Me API is running!"}


@app.get("/health")
@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
