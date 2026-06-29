# MoneySignal AI Ingestion Pipeline

MoneySignal AI uses a TradeSignal-style data path while keeping the current
MoneySignal product experience:

1. External financial sources
2. Backend ingestion services
3. SQLAlchemy database tables
4. FastAPI routes
5. Next.js dashboards and admin tools

## Sources

- SEC company ticker universe: ticker, company name, exchange, CIK
- SEC Form 4: insider transactions
- SEC 13F: institutional holdings
- Market data providers: Yahoo Finance by default, Alpha Vantage when configured

## Main Endpoints

- `GET /api/health`
- `GET /api/scheduler/status`
- `POST /api/scheduler/run-ingestion?form4_limit=5&thirteen_f_limit=3&refresh_market=true`
- `GET /api/scraper/history`
- `POST /api/scraper/sec-company-universe/import?limit=100&enrich_profile=false`
- `POST /api/scraper/sec-form4/{ticker}/ingest-recent?limit=10`
- `POST /api/scraper/sec-13f/{cik}/ingest-recent?limit=3`

## Full Pipeline

`run_full_ingestion_pipeline` performs:

- market snapshot refresh for tracked companies
- Form 4 ingestion for companies with CIKs
- 13F ingestion for known funds with CIKs
- signal generation through existing Form 4 and 13F ingestion services
- MoneySignal score recalculation
- scrape history logging through the existing `ScrapeHistory` model

Companies without CIKs are kept in the database and skipped for SEC filing
ingestion with a clear warning.

## Local Development

Keep `SCHEDULER_ENABLED=false` locally unless you intentionally want background
pipeline runs. Manual runs are available through `/admin/scraper` and the
`/api/scheduler/run-ingestion` endpoint.

## Deployment Notes

Do not commit real secrets. Use `apps/api/.env.example` and
`apps/web/.env.example` as templates.

For Render, set:

- `DATABASE_URL`
- `CORS_ORIGINS`
- `SEC_USER_AGENT`
- market/LLM API keys as needed

For Vercel, set:

- `NEXT_PUBLIC_API_BASE_URL`

Point `NEXT_PUBLIC_API_BASE_URL` at the deployed Render backend URL.
