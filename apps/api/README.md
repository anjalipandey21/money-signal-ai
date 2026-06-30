# MoneySignal API

## Database Migrations

MoneySignal uses Alembic for schema migrations. Application startup does not
create or alter tables automatically.

Database startup checks are non-destructive. By default,
`REQUIRE_DB_ON_STARTUP=false`, so the API can start even if the database is
temporarily unavailable; DB-backed routes will fail cleanly and
`GET /api/v1/health/db` will report the outage. Set
`REQUIRE_DB_ON_STARTUP=true` when deployment should fail fast if the database
cannot be reached.

From PowerShell:

```powershell
cd apps/api
$env:DATABASE_URL = "postgresql://user:password@host:5432/moneysignal"
alembic upgrade head
```

Check database connectivity without exposing credentials:

```powershell
cd apps/api
curl http://127.0.0.1:8001/api/v1/health/db
```

## Scheduler Reliability

Full ingestion runs use process-local single-run protection. If a run is
already active, `POST /api/v1/scheduler/run-ingestion` returns the existing
run id instead of starting a duplicate task. `INGESTION_MAX_RUNTIME_SECONDS`
defaults to `1200`; after that window the status endpoint marks the run stale
for the admin UI, while the background task is allowed to finish naturally.

## Cache Settings

MoneySignal supports a production-style cache layer with Redis when `REDIS_URL`
is configured and a bounded in-memory TTL fallback for local development. Cache
errors fail open; API routes should continue to work if Redis is unavailable.

```powershell
cd apps/api
$env:CACHE_ENABLED = "true"
$env:CACHE_BACKEND = "auto"
$env:REDIS_URL = "redis://localhost:6379/0"
$env:CACHE_KEY_PREFIX = "moneysignal"
$env:CACHE_DEFAULT_TTL_SECONDS = "60"
$env:QUOTES_READ_CACHE_TTL_SECONDS = "30"
```

Health and stats are available without exposing cached values or Redis secrets:

```powershell
curl http://127.0.0.1:8001/api/v1/health/cache
```

Read endpoints cache only successful global/public responses. Admin mutations
and ingestion runs invalidate affected namespaces after data changes.
## Market Data Settings

Market quotes are fetched through the configured provider order with bounded
retries, fallback between available providers, quote validation, and freshness
metadata. `MARKET_DATA_PROVIDER=auto` tries Yahoo Finance first, then Alpha
Vantage when `ALPHA_VANTAGE_API_KEY` is configured.

```powershell
cd apps/api
$env:MARKET_DATA_PROVIDER = "auto"
$env:MARKET_REQUEST_TIMEOUT_SECONDS = "10"
$env:MARKET_MAX_RETRIES = "2"
$env:MARKET_BACKOFF_BASE_SECONDS = "0.5"
$env:MARKET_QUOTE_STALE_MINUTES = "60"
$env:MARKET_MAX_BATCH_SIZE = "25"
```

Invalid, stale, or unsupported quote data is skipped and reported in ingestion
stage details instead of being saved as a market snapshot.
## SEC Client Settings

SEC archive and submissions requests are centralized, rate-limited, retried for
transient failures, and bounded by request timeouts. Set a real production
contact in `SEC_USER_AGENT`; the default is only a local-development fallback.

```powershell
cd apps/api
$env:SEC_USER_AGENT = "MoneySignalAI/0.1 ops@example.com"
$env:SEC_REQUEST_TIMEOUT_SECONDS = "15"
$env:SEC_MAX_RETRIES = "3"
$env:SEC_BACKOFF_BASE_SECONDS = "1"
$env:SEC_MIN_REQUEST_INTERVAL_SECONDS = "0.2"
```

For a local SQLite validation database:

```powershell
cd apps/api
$env:DATABASE_URL = "sqlite:///" + ($env:TEMP -replace "\\", "/") + "/moneysignal-local.db"
alembic upgrade head
```

To create a new migration after changing SQLAlchemy models:

```powershell
cd apps/api
alembic revision --autogenerate -m "describe schema change"
```

If an existing database already has the current schema because it was created
before Alembic was added, baseline it without running table creation:

```powershell
cd apps/api
alembic stamp head
```

Do not run the initial migration against an existing database that already has
these tables. Use `alembic stamp head` for that case, then apply future
migrations normally with `alembic upgrade head`.
