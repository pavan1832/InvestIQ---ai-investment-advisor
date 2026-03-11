# Vestara — Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Browser (React + TS)                  │
│  Login · Register · Dashboard · Upload · Insights       │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS / REST
                           ▼
┌─────────────────────────────────────────────────────────┐
│               FastAPI Backend (Python 3.12)             │
│                                                         │
│  /auth/register  /auth/login  /auth/me                  │
│  /portfolio/upload  /portfolio/analysis                 │
│  /portfolio/ai-recommendations  /portfolio/history      │
│                                                         │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────┐  │
│  │ Auth (JWT)   │  │ Portfolio Svc  │  │ AI Engine  │  │
│  │  passlib     │  │  pandas + pure │  │ LangChain  │  │
│  │  python-jose │  │  Python math   │  │ Gemini/GPT │  │
│  └──────────────┘  └────────────────┘  └────────────┘  │
└──────────┬──────────────────────────────────────────────┘
           │ asyncpg / SQLAlchemy
           ▼
┌──────────────────────┐
│   PostgreSQL 16      │
│  users               │
│  portfolios          │
│  portfolio_history   │
└──────────────────────┘
```

## Directory Layout

```
ai-investment-advisor/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, lifespan, CORS, routing
│   │   ├── config.py            # Pydantic Settings (reads .env)
│   │   ├── database.py          # Async SQLAlchemy engine + get_db
│   │   ├── auth/
│   │   │   ├── auth.py          # JWT helpers, password hashing, get_current_user
│   │   │   └── router.py        # /auth/register · /auth/login
│   │   ├── portfolio/
│   │   │   └── router.py        # /portfolio/* endpoints
│   │   ├── ai_engine/
│   │   │   └── ai_engine.py     # LangChain prompt builder + Gemini/OpenAI calls
│   │   ├── models/
│   │   │   └── models.py        # SQLAlchemy ORM models
│   │   └── services/
│   │       └── portfolio_analysis.py  # Pure math: risk, HHI, sector dist.
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── main.tsx             # React entry
│   │   ├── App.tsx              # Router + protected layout
│   │   ├── index.css            # Tailwind layers + custom utilities
│   │   ├── services/api.ts      # Axios instance + typed API helpers
│   │   ├── hooks/useAuth.tsx    # Auth context + localStorage persistence
│   │   ├── components/
│   │   │   ├── Sidebar.tsx      # Nav sidebar
│   │   │   └── ScoreGauge.tsx   # SVG ring gauge component
│   │   └── pages/
│   │       ├── Login.tsx
│   │       ├── Register.tsx
│   │       ├── Dashboard.tsx    # Main analytics view
│   │       ├── Upload.tsx       # CSV drag-and-drop
│   │       ├── Insights.tsx     # AI markdown output
│   │       └── History.tsx      # Time-series charts
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── Dockerfile
│
├── database/schema.sql
├── scripts/portfolio_cron.py
├── docker-compose.yml
└── README.md
```

## Key Design Decisions

### Backend
- **Async-first**: `asyncpg` + SQLAlchemy 2.0 async for non-blocking DB I/O
- **Dependency injection**: FastAPI `Depends()` for DB sessions and auth
- **Stateless JWT**: No server-side sessions; tokens carry user identity
- **Graceful AI fallback**: Mock insights when no API key is configured

### Portfolio Analysis
- **HHI-based diversification**: Herfindahl–Hirschman Index inverted and blended with sector count bonus
- **Weighted beta risk**: Value-weighted portfolio beta scaled to 0–10
- **Mock stock metadata**: 24 symbols with sector/beta/asset-class data; unknown symbols default to beta=1.0

### Frontend
- **Dark fintech aesthetic**: Deep navy background, brand-indigo accents, DM Serif Display headings
- **React Router v6**: Outlet-based protected layout; public routes redirect logged-in users
- **Recharts**: Pie (sectors), BarChart (allocation), AreaChart + LineChart (history)
- **Markdown rendering**: `react-markdown` for AI insights with Tailwind prose classes

### AI Integration
- **LangChain**: Abstraction layer over Gemini/OpenAI; swap provider via `AI_PROVIDER` env var
- **Structured prompt**: Portfolio metrics → specific, actionable advice in 5 sections
- **Async generation**: `ainvoke()` keeps FastAPI non-blocking during LLM calls

## Data Flow: Portfolio Upload

```
User drops CSV
    │
    ▼
POST /portfolio/upload (multipart)
    │
    ├─ Parse CSV with pandas (alias normalization, validation)
    ├─ analyze_portfolio() → metrics dict
    ├─ generate_ai_insights() → markdown string
    ├─ Save file to uploads/
    ├─ INSERT INTO portfolios
    └─ INSERT INTO portfolio_history (snapshot)
    │
    ▼
Return {portfolio_id, analysis, ai_insights}
    │
    ▼
Frontend redirects to /dashboard
```
