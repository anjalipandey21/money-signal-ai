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
