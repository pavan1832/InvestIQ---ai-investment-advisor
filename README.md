# Vestara — AI-Powered Personal Investment Advisor

> **Portfolio project** · FastAPI · React/TypeScript · PostgreSQL · LangChain · Tailwind CSS

A production-grade fintech platform that analyses stock portfolios and delivers AI-generated investment insights. Built to demonstrate full-stack engineering, AI integration, and secure API design.

---

## ✨ Features

| Feature | Details |
|---|---|
| **JWT Auth** | Register / login with bcrypt-hashed passwords and HS256 tokens |
| **CSV Upload** | Drag-and-drop portfolio file with column alias normalisation |
| **Portfolio Analysis** | Risk score (weighted beta), diversification (HHI), sector & asset allocation |
| **AI Insights** | LangChain → Gemini 1.5 Flash / GPT-4o-mini with graceful mock fallback |
| **History Tracking** | Daily snapshots, area + line charts via Recharts |
| **Dark Fintech UI** | DM Serif Display headings, brand-indigo palette, SVG score gauges |
| **Docker Ready** | One-command `docker compose up` |

---

## 🏗 Tech Stack

**Backend**
- Python 3.12, FastAPI, SQLAlchemy 2.0 (async), asyncpg
- LangChain, `langchain-google-genai`, `langchain-openai`
- JWT via `python-jose`, passwords via `passlib[bcrypt]`
- pandas for CSV processing

**Frontend**
- React 18, TypeScript, Vite
- Tailwind CSS, Recharts, React Router v6, Axios
- `react-markdown` for AI output rendering

**Infrastructure**
- PostgreSQL 16
- Docker + docker-compose
- Deployable on Render (backend) + Vercel (frontend)

---

## 🚀 Quick Start

### Option A — Docker (recommended)

```bash
git clone https://github.com/your-username/ai-investment-advisor
cd ai-investment-advisor

# Set your API key (optional — mock insights work without it)
export GEMINI_API_KEY=your-key-here

docker compose up --build
```

- Frontend → http://localhost:3000  
- Backend API → http://localhost:8000  
- Swagger docs → http://localhost:8000/docs

### Option B — Local development

**Prerequisites**: Python 3.12+, Node 20+, PostgreSQL 16+

**Backend**

```bash
cd backend
python -m venv venv && source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env: set DATABASE_URL, SECRET_KEY, GEMINI_API_KEY

# Create DB
psql -U postgres -c "CREATE DATABASE investment_advisor;"
psql -U postgres -d investment_advisor -f ../database/schema.sql

uvicorn app.main:app --reload --port 8000
```

**Frontend**

```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_URL=http://localhost:8000" > .env.local
npm run dev
```

---

## 📁 CSV Format

Upload a `.csv` with these columns (order and case don't matter):

| Column | Aliases | Description |
|--------|---------|-------------|
| `symbol` | `ticker`, `stock`, `name` | Stock ticker symbol |
| `quantity` | `qty`, `shares`, `units` | Number of shares |
| `price` | `cost`, `nav`, `current_price` | Price per share |

**Example:**

```csv
symbol,quantity,price
RELIANCE,50,2900.50
TCS,30,4200.00
HDFCBANK,100,1650.75
AAPL,20,185.00
```

A sample CSV can be downloaded from the Upload page.

---

## 🔌 API Reference

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/auth/register` | `{email, password, full_name?}` | Create account |
| `POST` | `/auth/login` | `{email, password}` | Get JWT token |
| `GET` | `/auth/me` | — | Current user (Bearer) |

### Portfolio

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/portfolio/upload` | ✅ | Upload CSV, run analysis |
| `GET` | `/portfolio/analysis` | ✅ | Latest portfolio metrics |
| `GET` | `/portfolio/ai-recommendations` | ✅ | LLM-generated advice |
| `GET` | `/portfolio/history` | ✅ | Historical snapshots |

Full interactive docs at `/docs` (Swagger) or `/redoc`.

---

## 📊 Portfolio Analysis Logic

### Risk Score (0–10)
Weighted average beta across all holdings, scaled to `[0, 10]`:
```
weighted_beta = Σ (weight_i × beta_i)
risk_score = clamp(weighted_beta / 2.5, 0, 1) × 10
```

### Diversification Score (0–10)
Inverted Herfindahl–Hirschman Index + sector count bonus:
```
HHI = Σ weight_i²                    # lower = more diversified
sector_bonus = min(num_sectors / 8, 1)
score = (1 - HHI) × 7 + sector_bonus × 3
```

### Estimated Returns
Expected annual return range mapped from risk score:
```
base = 8% + (risk_score / 10) × 12%   # 8–20%
conservative = base × 0.7
optimistic   = base × 1.4
```

---

## ⏰ Cron Job

Daily portfolio refresh (recalculates metrics, appends history snapshot):

```bash
# Manual run
python scripts/portfolio_cron.py

# Add to crontab (2 AM daily)
crontab -e
0 2 * * * cd /path/to/project && python scripts/portfolio_cron.py >> /var/log/vestara_cron.log 2>&1

# Or use a Render Cron Job (see deployment section)
```

---

## ☁️ Deployment

### Backend → Render

1. Push repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add a **PostgreSQL** database on Render, copy the connection string
5. Set environment variables:
   ```
   DATABASE_URL=postgresql+asyncpg://...  (Render postgres URL)
   SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))")>
   GEMINI_API_KEY=...
   AI_PROVIDER=gemini
   ```
6. Run schema: use Render's psql shell → `\i database/schema.sql`

### Frontend → Vercel

1. Import the repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Build settings auto-detected (Vite)
4. Add environment variable:
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```
5. Deploy — Vercel handles the rest

### Cron Job → Render Cron Job

Create a separate Render **Cron Job** service pointing to `scripts/portfolio_cron.py` with schedule `0 2 * * *`.

---

## 🔐 Security Notes

- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens expire after 24 hours
- CORS configured for specific origins in production
- File uploads validated for extension and size (10 MB max)
- No raw SQL — all queries via SQLAlchemy ORM

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | asyncpg-compatible postgres URL |
| `SECRET_KEY` | ✅ | — | JWT signing secret (32+ chars) |
| `GEMINI_API_KEY` | ☐ | `""` | Google AI Studio key |
| `OPENAI_API_KEY` | ☐ | `""` | OpenAI key (fallback) |
| `AI_PROVIDER` | ☐ | `gemini` | `gemini` or `openai` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ☐ | `1440` | Token TTL |
| `UPLOAD_DIR` | ☐ | `uploads` | Local CSV storage path |
| `DEBUG` | ☐ | `false` | Enable SQLAlchemy echo |

---

## 🧪 Test Data

Use the **Download Sample CSV** button on the Upload page, or use this:

```csv
symbol,quantity,price
RELIANCE,50,2900.50
TCS,30,4200.00
HDFCBANK,100,1650.75
INFY,80,1850.25
HINDUNILVR,40,2450.00
ICICIBANK,120,1100.50
TATAMOTORS,200,850.25
SUNPHARMA,60,1350.00
WIPRO,150,560.75
ZOMATO,500,195.50
AAPL,20,185.00
MSFT,15,415.00
NVDA,10,875.00
```

---

## 📄 License

MIT — free to use in portfolio projects and interviews.
