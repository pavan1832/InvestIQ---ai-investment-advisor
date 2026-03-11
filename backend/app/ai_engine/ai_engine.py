"""
ai_engine.py
------------
LangChain-powered investment insights generation.
Supports both Gemini and OpenAI backends.
"""
from __future__ import annotations
import json
from app.config import get_settings

settings = get_settings()


def _build_prompt(analysis: dict) -> str:
    portfolio_summary = f"""
Portfolio Overview:
- Total Value: ${analysis['total_value']:,.2f}
- Number of Holdings: {analysis['num_holdings']}
- Number of Sectors: {analysis['num_sectors']}
- Risk Score: {analysis['risk_score']}/10
- Diversification Score: {analysis['diversification_score']}/10

Sector Distribution:
{json.dumps(analysis['sector_distribution'], indent=2)}

Asset Allocation:
{json.dumps(analysis['asset_allocation'], indent=2)}

Top Holdings:
{json.dumps([{
    'symbol': h['symbol'],
    'value': h['value'],
    'weight_pct': h['weight_pct'],
    'sector': h['sector'],
    'beta': h['beta']
} for h in sorted(analysis['holdings'], key=lambda x: x['value'], reverse=True)[:10]], indent=2)}

Estimated Annual Returns:
- Conservative: {analysis['estimated_returns']['conservative_1y']}%
- Expected:     {analysis['estimated_returns']['expected_1y']}%
- Optimistic:   {analysis['estimated_returns']['optimistic_1y']}%
"""

    return f"""You are an experienced financial advisor analyzing an investment portfolio. 
Provide specific, actionable investment advice based on the data below.

{portfolio_summary}

Please provide:
1. **Portfolio Strengths**: What the investor is doing well
2. **Risk Assessment**: Evaluate the risk profile and concentration risks
3. **Diversification Recommendations**: Specific sectors or asset classes to add/reduce
4. **Top 3 Action Items**: Concrete, prioritized steps the investor should take
5. **Long-term Outlook**: 3–5 year perspective based on current allocation

Keep advice practical, data-driven, and suitable for a retail investor. 
Format the response with clear headers and bullet points."""


async def generate_ai_insights(analysis: dict) -> str:
    """Generate AI investment insights using LangChain."""
    prompt = _build_prompt(analysis)

    if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
        return await _gemini_insights(prompt)
    elif settings.OPENAI_API_KEY:
        return await _openai_insights(prompt)
    else:
        return _mock_insights(analysis)


async def _gemini_insights(prompt: str) -> str:
    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.messages import HumanMessage

        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
        )
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return _mock_insights({}) + f"\n\n[Note: AI service temporarily unavailable: {e}]"


async def _openai_insights(prompt: str) -> str:
    try:
        from langchain_openai import ChatOpenAI
        from langchain_core.messages import HumanMessage

        llm = ChatOpenAI(
            model="gpt-4o-mini",
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
        )
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content
    except Exception as e:
        return _mock_insights({}) + f"\n\n[Note: AI service temporarily unavailable: {e}]"


def _mock_insights(analysis: dict) -> str:
    """Fallback insights when no API key is configured."""
    risk = analysis.get("risk_score", 5)
    div  = analysis.get("diversification_score", 5)

    risk_label = "high" if risk > 7 else "moderate" if risk > 4 else "low"
    div_label  = "well-diversified" if div > 7 else "moderately diversified" if div > 4 else "concentrated"

    return f"""## 📊 Portfolio Analysis & Recommendations

### Portfolio Strengths
- Your portfolio demonstrates a **{risk_label} risk** profile with a risk score of {risk}/10.
- The allocation spans multiple asset classes, showing an intent to balance growth and stability.
- You have positioned in {analysis.get('num_sectors', 'multiple')} distinct sectors, which is a sound starting point.

### Risk Assessment
- With a risk score of **{risk}/10**, your portfolio is **{risk_label}-risk**.
- {'Consider reducing exposure to high-beta stocks (β > 1.5) which amplify market swings.' if risk > 6 else 'Your risk profile is appropriate for most long-term investors.'}
- Concentration in any single position above 20% of portfolio value warrants rebalancing.

### Diversification Recommendations
- Your portfolio is currently **{div_label}** (score: {div}/10).
- **Add exposure**: Consider international equities, REITs, or bonds to improve stability.
- **Reduce overlap**: If multiple holdings are in the same sector, consolidate into sector ETFs.
- Target: 8–12 distinct sectors with no single sector exceeding 25%.

### 🎯 Top 3 Action Items
1. **Rebalance overweighted positions** — Any holding above 15% of total value should be trimmed to lock in gains and reduce single-stock risk.
2. **Add defensive assets** — Allocate 10–15% to bonds, gold, or dividend-paying large caps to cushion downturns.
3. **Set up SIP/DCA** — Invest a fixed amount monthly to reduce timing risk and build positions systematically.

### Long-term Outlook (3–5 Years)
- Based on your current allocation, expected annualised returns range from **{analysis.get('estimated_returns', {}).get('conservative_1y', 8)}% (conservative)** to **{analysis.get('estimated_returns', {}).get('optimistic_1y', 18)}% (optimistic)**.
- Investors who maintain diversification and stay invested through volatility historically outperform those who time the market.
- Review and rebalance your portfolio **quarterly** to stay aligned with your financial goals.

---
*This analysis is for educational purposes only and does not constitute financial advice. Please consult a SEBI-registered advisor before making investment decisions.*
"""
