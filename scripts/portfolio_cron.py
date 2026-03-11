#!/usr/bin/env python3
"""
scripts/portfolio_cron.py
--------------------------
Daily job: recalculates analytics for all portfolios and appends a history snapshot.

Run manually:  python scripts/portfolio_cron.py
Cron schedule: 0 2 * * *  (2 AM daily)

Add to crontab:
  crontab -e
  0 2 * * * cd /app && python scripts/portfolio_cron.py >> /var/log/portfolio_cron.log 2>&1
"""
import asyncio
import sys
import os
from datetime import datetime

# Allow imports from backend/app
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import select
from backend.app.database import AsyncSessionLocal
from backend.app.models.models import Portfolio, PortfolioHistory
from backend.app.services.portfolio_analysis import analyze_portfolio


async def refresh_all_portfolios():
    print(f"[{datetime.utcnow().isoformat()}] Starting daily portfolio refresh...")
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Portfolio))
        portfolios = result.scalars().all()
        print(f"Found {len(portfolios)} portfolios to process.")

        updated = 0
        for portfolio in portfolios:
            try:
                holdings = portfolio.holdings.get("items", []) if portfolio.holdings else []
                if not holdings:
                    continue

                analysis = analyze_portfolio(holdings)

                # Update portfolio metrics
                portfolio.total_value           = analysis["total_value"]
                portfolio.risk_score            = analysis["risk_score"]
                portfolio.diversification_score = analysis["diversification_score"]
                portfolio.sector_distribution   = analysis["sector_distribution"]
                portfolio.asset_allocation      = analysis["asset_allocation"]

                # Append history snapshot
                snapshot = PortfolioHistory(
                    portfolio_id=portfolio.id,
                    user_id=portfolio.user_id,
                    total_value=analysis["total_value"],
                    risk_score=analysis["risk_score"],
                    diversification_score=analysis["diversification_score"],
                )
                db.add(snapshot)
                updated += 1

            except Exception as e:
                print(f"  ERROR processing portfolio {portfolio.id}: {e}")

        await db.commit()
        print(f"[{datetime.utcnow().isoformat()}] Done. Updated {updated}/{len(portfolios)} portfolios.")


if __name__ == "__main__":
    asyncio.run(refresh_all_portfolios())
