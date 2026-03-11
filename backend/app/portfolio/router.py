"""
portfolio/router.py
-------------------
All /portfolio endpoints.
"""
from __future__ import annotations
import io
import os
import uuid
from datetime import datetime
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.database import get_db
from app.models.models import User, Portfolio, PortfolioHistory
from app.auth.auth import get_current_user
from app.services.portfolio_analysis import analyze_portfolio
from app.ai_engine.ai_engine import generate_ai_insights
from app.config import get_settings

settings = get_settings()
router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


# ── CSV parsing ───────────────────────────────────────────────────────────────

REQUIRED_COLUMNS = {"symbol", "quantity", "price"}

COLUMN_ALIASES = {
    "ticker": "symbol", "stock": "symbol", "name": "symbol",
    "qty": "quantity", "shares": "quantity", "units": "quantity",
    "cost": "price", "nav": "price", "current_price": "price",
}


def _parse_csv(content: bytes) -> list[dict]:
    df = pd.read_csv(io.BytesIO(content))
    df.columns = df.columns.str.strip().str.lower()
    df.rename(columns=COLUMN_ALIASES, inplace=True)

    missing = REQUIRED_COLUMNS - set(df.columns)
    if missing:
        raise ValueError(f"CSV missing required columns: {missing}. Expected: symbol, quantity, price")

    df = df[list(REQUIRED_COLUMNS)].dropna()
    df["symbol"]   = df["symbol"].str.upper().str.strip()
    df["quantity"] = pd.to_numeric(df["quantity"], errors="coerce").fillna(0)
    df["price"]    = pd.to_numeric(df["price"], errors="coerce").fillna(0)
    df = df[df["quantity"] > 0]

    return df.to_dict(orient="records")


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_portfolio(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 10 MB limit.")

    try:
        holdings = _parse_csv(content)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not holdings:
        raise HTTPException(status_code=422, detail="No valid holdings found in the CSV.")

    # Run analysis
    analysis = analyze_portfolio(holdings)

    # Save file to disk
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{uuid.uuid4()}.csv")
    with open(file_path, "wb") as f:
        f.write(content)

    # Generate AI insights
    ai_insights = await generate_ai_insights(analysis)

    # Persist portfolio
    portfolio = Portfolio(
        user_id=current_user.id,
        file_path=file_path,
        total_value=analysis["total_value"],
        risk_score=analysis["risk_score"],
        diversification_score=analysis["diversification_score"],
        holdings={"items": analysis["holdings"]},
        sector_distribution=analysis["sector_distribution"],
        asset_allocation=analysis["asset_allocation"],
        ai_insights=ai_insights,
    )
    db.add(portfolio)
    await db.flush()
    await db.refresh(portfolio)

    # Record history snapshot
    snapshot = PortfolioHistory(
        portfolio_id=portfolio.id,
        user_id=current_user.id,
        total_value=analysis["total_value"],
        risk_score=analysis["risk_score"],
        diversification_score=analysis["diversification_score"],
    )
    db.add(snapshot)

    return {
        "portfolio_id": str(portfolio.id),
        "message": "Portfolio uploaded and analysed successfully.",
        "analysis": {**analysis, "ai_insights": ai_insights},
    }


@router.get("/analysis")
async def get_analysis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .order_by(desc(Portfolio.created_at))
        .limit(1)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="No portfolio found. Please upload a CSV first.")

    return {
        "portfolio_id":          str(portfolio.id),
        "total_value":           portfolio.total_value,
        "risk_score":            portfolio.risk_score,
        "diversification_score": portfolio.diversification_score,
        "sector_distribution":   portfolio.sector_distribution,
        "asset_allocation":      portfolio.asset_allocation,
        "holdings":              portfolio.holdings.get("items", []) if portfolio.holdings else [],
        "created_at":            portfolio.created_at.isoformat(),
    }


@router.get("/ai-recommendations")
async def get_ai_recommendations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, str]:
    result = await db.execute(
        select(Portfolio)
        .where(Portfolio.user_id == current_user.id)
        .order_by(desc(Portfolio.created_at))
        .limit(1)
    )
    portfolio = result.scalar_one_or_none()
    if not portfolio:
        raise HTTPException(status_code=404, detail="No portfolio found.")

    # Re-generate if missing
    if not portfolio.ai_insights:
        analysis = {
            "total_value":           portfolio.total_value,
            "risk_score":            portfolio.risk_score,
            "diversification_score": portfolio.diversification_score,
            "sector_distribution":   portfolio.sector_distribution or {},
            "asset_allocation":      portfolio.asset_allocation or {},
            "holdings":              portfolio.holdings.get("items", []) if portfolio.holdings else [],
            "num_holdings":          len(portfolio.holdings.get("items", [])) if portfolio.holdings else 0,
            "num_sectors":           len(portfolio.sector_distribution or {}),
            "estimated_returns":     {"conservative_1y": 8, "expected_1y": 12, "optimistic_1y": 18},
        }
        portfolio.ai_insights = await generate_ai_insights(analysis)

    return {"insights": portfolio.ai_insights}


@router.get("/history")
async def get_history(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict[str, Any]:
    result = await db.execute(
        select(PortfolioHistory)
        .where(PortfolioHistory.user_id == current_user.id)
        .order_by(PortfolioHistory.snapshot_date)
    )
    snapshots = result.scalars().all()

    return {
        "history": [
            {
                "date":                  s.snapshot_date.isoformat() if hasattr(s.snapshot_date, "isoformat") else str(s.snapshot_date),
                "total_value":           s.total_value,
                "risk_score":            s.risk_score,
                "diversification_score": s.diversification_score,
            }
            for s in snapshots
        ]
    }
