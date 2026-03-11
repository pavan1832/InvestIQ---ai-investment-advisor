"""
portfolio_analysis.py
---------------------
Pure Python functions for portfolio metric calculations.
Uses mock sector/risk data when live market APIs are unavailable.
"""
from __future__ import annotations
import math
import random
from typing import Any

# ── Mock market metadata ──────────────────────────────────────────────────────

STOCK_META: dict[str, dict] = {
    # Symbol → {sector, beta, asset_class}
    "RELIANCE":  {"sector": "Energy",           "beta": 1.1,  "asset_class": "Large Cap"},
    "TCS":       {"sector": "IT",               "beta": 0.9,  "asset_class": "Large Cap"},
    "HDFCBANK":  {"sector": "Banking",          "beta": 1.0,  "asset_class": "Large Cap"},
    "INFY":      {"sector": "IT",               "beta": 0.85, "asset_class": "Large Cap"},
    "HINDUNILVR":{"sector": "FMCG",             "beta": 0.7,  "asset_class": "Large Cap"},
    "ICICIBANK": {"sector": "Banking",          "beta": 1.15, "asset_class": "Large Cap"},
    "BHARTIARTL":{"sector": "Telecom",          "beta": 0.95, "asset_class": "Large Cap"},
    "ITC":       {"sector": "FMCG",             "beta": 0.65, "asset_class": "Large Cap"},
    "KOTAKBANK": {"sector": "Banking",          "beta": 1.05, "asset_class": "Large Cap"},
    "LT":        {"sector": "Infrastructure",   "beta": 1.2,  "asset_class": "Large Cap"},
    "WIPRO":     {"sector": "IT",               "beta": 0.88, "asset_class": "Mid Cap"},
    "TATAMOTORS":{"sector": "Auto",             "beta": 1.4,  "asset_class": "Mid Cap"},
    "SUNPHARMA": {"sector": "Pharma",           "beta": 0.75, "asset_class": "Large Cap"},
    "ADANIGREEN":{"sector": "Renewable Energy", "beta": 1.6,  "asset_class": "Mid Cap"},
    "ZOMATO":    {"sector": "Consumer Tech",    "beta": 1.8,  "asset_class": "Small Cap"},
    "PAYTM":     {"sector": "Fintech",          "beta": 2.0,  "asset_class": "Small Cap"},
    "NYKAA":     {"sector": "Consumer Tech",    "beta": 1.7,  "asset_class": "Small Cap"},
    "AAPL":      {"sector": "Technology",       "beta": 1.2,  "asset_class": "Large Cap"},
    "MSFT":      {"sector": "Technology",       "beta": 0.9,  "asset_class": "Large Cap"},
    "GOOGL":     {"sector": "Technology",       "beta": 1.05, "asset_class": "Large Cap"},
    "AMZN":      {"sector": "Consumer Disc.",   "beta": 1.3,  "asset_class": "Large Cap"},
    "TSLA":      {"sector": "Auto",             "beta": 2.0,  "asset_class": "Large Cap"},
    "NVDA":      {"sector": "Technology",       "beta": 1.7,  "asset_class": "Large Cap"},
    "META":      {"sector": "Technology",       "beta": 1.3,  "asset_class": "Large Cap"},
}

DEFAULT_META = {"sector": "Diversified", "beta": 1.0, "asset_class": "Mid Cap"}


def _get_meta(symbol: str) -> dict:
    return STOCK_META.get(symbol.upper(), DEFAULT_META)


# ── Core metric functions ─────────────────────────────────────────────────────

def compute_total_value(holdings: list[dict]) -> float:
    """Sum quantity * price for all holdings."""
    return sum(h.get("quantity", 0) * h.get("price", 0) for h in holdings)


def compute_sector_distribution(holdings: list[dict], total_value: float) -> dict[str, float]:
    """Return sector → percentage of portfolio."""
    sector_values: dict[str, float] = {}
    for h in holdings:
        meta = _get_meta(h["symbol"])
        val = h.get("quantity", 0) * h.get("price", 0)
        sector_values[meta["sector"]] = sector_values.get(meta["sector"], 0) + val

    if total_value == 0:
        return sector_values
    return {s: round((v / total_value) * 100, 2) for s, v in sector_values.items()}


def compute_asset_allocation(holdings: list[dict], total_value: float) -> dict[str, float]:
    """Return asset class → percentage."""
    class_values: dict[str, float] = {}
    for h in holdings:
        meta = _get_meta(h["symbol"])
        val = h.get("quantity", 0) * h.get("price", 0)
        class_values[meta["asset_class"]] = class_values.get(meta["asset_class"], 0) + val

    if total_value == 0:
        return class_values
    return {c: round((v / total_value) * 100, 2) for c, v in class_values.items()}


def compute_risk_score(holdings: list[dict], total_value: float) -> float:
    """
    Weighted average beta scaled to a 0–10 risk score.
    Beta 0 → score 0, Beta 2.5+ → score 10.
    """
    if total_value == 0 or not holdings:
        return 5.0

    weighted_beta = 0.0
    for h in holdings:
        weight = (h.get("quantity", 0) * h.get("price", 0)) / total_value
        beta = _get_meta(h["symbol"])["beta"]
        weighted_beta += weight * beta

    # Clamp to [0, 2.5], then scale to [0, 10]
    score = min(weighted_beta / 2.5, 1.0) * 10
    return round(score, 2)


def compute_diversification_score(holdings: list[dict]) -> float:
    """
    Herfindahl–Hirschman Index inverted to a 0–10 diversification score.
    More sectors + balanced weights → higher score.
    """
    if not holdings:
        return 0.0

    total = sum(h.get("quantity", 0) * h.get("price", 0) for h in holdings)
    if total == 0:
        return 0.0

    weights = [(h.get("quantity", 0) * h.get("price", 0)) / total for h in holdings]
    hhi = sum(w ** 2 for w in weights)  # 1/n (perfect) → 1 (monopoly)

    # n = number of distinct sectors
    sectors = {_get_meta(h["symbol"])["sector"] for h in holdings}
    sector_bonus = min(len(sectors) / 8, 1.0)  # max bonus at 8+ sectors

    # Invert HHI: lower HHI = more diversified
    score = (1 - hhi) * 7 + sector_bonus * 3
    return round(min(max(score, 0), 10), 2)


def compute_estimated_returns(risk_score: float) -> dict[str, float]:
    """Rough expected annual return brackets based on risk profile."""
    base = 8 + (risk_score / 10) * 12  # 8–20% range
    return {
        "conservative_1y": round(base * 0.7, 2),
        "expected_1y":     round(base, 2),
        "optimistic_1y":   round(base * 1.4, 2),
    }


def analyze_portfolio(holdings: list[dict]) -> dict[str, Any]:
    """Run all metrics and return a single analysis dict."""
    total_value        = compute_total_value(holdings)
    sector_dist        = compute_sector_distribution(holdings, total_value)
    asset_alloc        = compute_asset_allocation(holdings, total_value)
    risk_score         = compute_risk_score(holdings, total_value)
    diversification    = compute_diversification_score(holdings)
    estimated_returns  = compute_estimated_returns(risk_score)

    # Enrich holdings with metadata
    enriched = []
    for h in holdings:
        meta = _get_meta(h["symbol"])
        value = h.get("quantity", 0) * h.get("price", 0)
        enriched.append({
            **h,
            "sector":      meta["sector"],
            "asset_class": meta["asset_class"],
            "beta":        meta["beta"],
            "value":       round(value, 2),
            "weight_pct":  round((value / total_value * 100) if total_value else 0, 2),
        })

    return {
        "total_value":          round(total_value, 2),
        "risk_score":           risk_score,
        "diversification_score": diversification,
        "sector_distribution":  sector_dist,
        "asset_allocation":     asset_alloc,
        "estimated_returns":    estimated_returns,
        "holdings":             enriched,
        "num_holdings":         len(holdings),
        "num_sectors":          len(sector_dist),
    }
