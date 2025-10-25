from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

# Firebase Functions entry point
app = FastAPI(title="Trade Me API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import routers
from app.routers import auth, items, trades, users, payments, reviews

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
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
    return {"message": "Trade Me API is running on Firebase!"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

# Firebase Functions handler
def main(request):
    """Handle Firebase Functions requests"""
    from fastapi import Request
    from fastapi.responses import JSONResponse
    
    # This will be handled by Firebase Functions runtime
    return app(request)
