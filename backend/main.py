from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv

from app.database import engine, Base
from app.routers import auth, items, trades, users, payments, reviews

# Load environment variables
load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Trade Me API",
    description="A barter platform API for trading everyday items",
    version="1.0.0"
)

# CORS middleware
# Get Firebase project ID for dynamic CORS origins
# Defaults to trade-me-13f73 if not set
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "trade-me-13f73")
cors_origins = [
    "http://localhost:3000",
    "https://storage.googleapis.com",
]

# Add Firebase Hosting domains if project ID is set
if FIREBASE_PROJECT_ID:
    cors_origins.extend([
        f"https://{FIREBASE_PROJECT_ID}.web.app",
        f"https://{FIREBASE_PROJECT_ID}.firebaseapp.com",
    ])

# Add custom CORS origins from environment variable
custom_origins = os.getenv("CORS_ORIGINS", "")
if custom_origins:
    cors_origins.extend(custom_origins.split(","))

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

# Static files for uploaded images
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return {"message": "Trade Me API is running!"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
