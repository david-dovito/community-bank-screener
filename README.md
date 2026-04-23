# Community Bank Screener

Full-stack screener for 4,500+ US community banks and credit unions. No paid APIs.

**Data sources**
- FDIC BankFind Suite API — institutions, financials (call reports), branches, history
- NCUA quarterly ZIP files — credit union call reports

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI, Python 3.12, httpx, pandas |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Tables | TanStack Table v8 |
| Charts | Recharts |
| Maps | react-leaflet + OpenStreetMap |
| Data fetching | React Query v5 |

## Features

- **Screener** — 20+ filters: asset size, ROA, ROE, NIM, efficiency ratio, NPL ratio, loan-to-deposit, capital ratio, state, charter type, M&A probability score
- **Tear sheets** — individual bank page with 20-year historical charts and branch map
- **Peer comparison** — side-by-side table + radar + bar charts for up to 5 banks
- **Branch map** — state-level heatmap of all branches via Leaflet
- **Credit union screener** — NCUA quarterly data
- **Mutual-to-stock tracker** — info page with EDGAR filing links (v0.2: automated)
- **CSV export** — download screener results
- **Bot protection** — User-Agent blocklist + IP rate limiting (60 req/min)

## Local development

```bash
# Backend
cd backend
pip install -e .
uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. The Next.js dev server proxies `/api/*` to the backend.

## Docker

```bash
docker compose up --build
```

## Screener filters reference

| Filter | Field | Notes |
|---|---|---|
| State | `state[]` | Multi-select, 2-letter code |
| Asset min/max | `asset_min`, `asset_max` | Thousands USD |
| Charter class | `charter_class[]` | N, SM, NM, SB, SA |
| ROA | `roa_min`, `roa_max` | Percent |
| ROE | `roe_min`, `roe_max` | Percent |
| NIM | `nim_min`, `nim_max` | Percent |
| Efficiency ratio | `efficiency_min`, `efficiency_max` | Percent |
| NPL ratio | `npl_min`, `npl_max` | Percent |
| Tier 1 capital | `tier1_min` | Percent |
| Loan-to-deposit | `loan_to_deposit_min`, `loan_to_deposit_max` | Percent |
| M&A probability | `ma_prob_min` | 0–100 score |

## API docs

FastAPI auto-generates docs at http://localhost:8000/docs
