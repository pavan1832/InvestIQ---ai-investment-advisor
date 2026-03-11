"""
main.py - FastAPI application entry point
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import init_db
from app.config import get_settings
from app.auth.router import router as auth_router
from app.auth.auth import get_current_user, UserOut
from app.portfolio.router import router as portfolio_router
from app.models.models import User

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    yield
    # Shutdown – nothing needed


app = FastAPI(
    title="AI Investment Advisor API",
    version="1.0.0",
    description="Production-grade AI-powered investment advisory platform",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(portfolio_router)


# ── Extra auth endpoints ──────────────────────────────────────────────────────
@app.get("/auth/me", response_model=UserOut, tags=["Authentication"])
async def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health():
    return {"status": "ok", "service": settings.APP_NAME}
