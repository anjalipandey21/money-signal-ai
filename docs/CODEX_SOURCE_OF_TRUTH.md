\# MoneySignal AI — Codex Source of Truth



\## Purpose



MoneySignal AI is an original fintech intelligence platform inspired by the architecture, workflows, and product feel of TradeSignal-style market intelligence tools.



The goal is to build a production-quality, AI-assisted market signal platform that collects public financial data, processes it through reliable backend pipelines, calculates signals/scores, and presents those insights in a clean dashboard.



TradeSignal is only a reference for structure, engineering maturity, and product direction. Do not copy TradeSignal code, branding, text, or proprietary implementation. Keep MoneySignal AI original.



\---



\## Project Identity



Project name: MoneySignal AI



Core idea:



```text

Public market data + SEC filings + institutional/insider activity

&#x20;       ↓

Reliable ingestion pipelines

&#x20;       ↓

Database-backed signal generation

&#x20;       ↓

AI-assisted insights and dashboard

```



MoneySignal AI should feel like a serious financial intelligence product, not a demo app.



\---



\## Repository Structure



Main repo path:



```text

G:\\Projects\\MoneySignal-AI\\money-signal-ai

```



Backend:



```text

apps/api

```



Frontend:



```text

apps/web

```



Backend stack:



```text

FastAPI

SQLAlchemy

Alembic

Supabase Postgres

Pydantic

Clerk auth verification

SEC ingestion services

Scheduler/background pipeline services

```



Frontend stack:



```text

Next.js

TypeScript

Tailwind CSS

Clerk

Dashboard/Admin UI

```



\---



\## Product Direction



MoneySignal AI should provide:



```text

Dashboard summary

Stocks list and stock detail pages

Signals feed

Watchlist

Alerts

Admin/Data Ops page

SEC Form 4 ingestion

13F institutional holdings ingestion

Market data refresh

MoneySignal scores

AI-generated insights

Data freshness and scrape history

```



The product should prioritize:



```text

Reliability

Clear data provenance

Secure admin controls

Database-driven behavior

Safe external API usage

Good observability

Clean frontend/backend contracts

```



\---



\## Architecture Principles



Codex must follow these rules:



1\. Keep MoneySignal AI original.

2\. Use TradeSignal only as an architectural/style reference.

3\. Do not copy TradeSignal code or branding.

4\. Keep backend behavior database-driven.

5\. Do not hardcode the company universe as the main pipeline source.

6\. Prefer small, safe, focused changes.

7\. Do not make broad rewrites unless explicitly requested.

8\. Do not introduce schema changes unless absolutely necessary.

9\. Do not add Alembic migrations unless clearly justified.

10\. Do not reintroduce `Base.metadata.create\_all()` in normal app startup.

11\. Never expose secrets, database URLs, API keys, Clerk keys, or tokens.

12\. Keep `/api/v1` as the canonical API prefix.

13\. Preserve existing route behavior unless a task explicitly says otherwise.

14\. Validate every change with compile/build/smoke checks.

15\. Frontend should use typed API contracts where possible.



\---



\## Authentication Source of Truth



MoneySignal AI uses Clerk-first authentication.



Current expected behavior:



```text

Frontend uses Clerk for login/session.

Backend verifies Clerk Bearer tokens.

Backend maps Clerk users to local User records.

Admin/protected endpoints require authenticated user.

Admin-only routes require role/is\_superuser.

```



Backend auth endpoints include:



```text

GET /api/v1/auth/me

POST /api/v1/auth/clerk-sync

```



Important:



```text

Do not restore mock localStorage auth.

Do not use demo-user for new authenticated backend features.

Do not expose Clerk secrets.

Watchlist/alerts may still have legacy/demo-user behavior unless a task explicitly migrates them.

```



\---



\## API Versioning



Canonical API prefix:



```text

/api/v1

```



Legacy `/api` aliases may exist only for compatibility if currently enabled.



Frontend API clients should call:



```text

/api/v1/...

```



Do not introduce new unversioned backend routes unless explicitly required.



\---



\## Database Source of Truth



Database is Supabase Postgres in real development.



Database setup uses:



```text

SQLAlchemy models

Alembic migrations

DATABASE\_URL from environment

```



Normal application startup must not create or modify tables automatically.



Correct behavior:



```text

Alembic manages schema.

App startup performs lightweight DB connectivity check only.

DB health can be checked independently.

```



Health endpoints:



```text

GET /api/v1/health

GET /api/v1/health/db

```



DB startup config:



```text

REQUIRE\_DB\_ON\_STARTUP=false

```



If `REQUIRE\_DB\_ON\_STARTUP=true`, backend should fail clearly when DB is unavailable.



\---



\## Dynamic Company Universe



The company universe must be dynamic and database-driven.



Main source:



```text

companies table

```



The full ingestion pipeline should read current Company rows from the database.



Do not drive the pipeline from a hardcoded list like:



```text

AAPL, MSFT, NVDA, GOOGL, META

```



Core/demo tickers may be used only for prioritization or display ordering, not as the full universe.



Current known universe snapshot:



```text

Total companies: 655

Companies with CIK: 547

Companies without CIK: 108

Form 4 eligible: 417

Market refresh eligible: 448

```



Stats endpoint:



```text

GET /api/v1/stocks/universe/stats

```



Expected response shape:



```json

{

&#x20; "totalCompanies": 655,

&#x20; "companiesWithCik": 547,

&#x20; "companiesWithoutCik": 108,

&#x20; "eligibleForForm4": 417,

&#x20; "eligibleForMarketRefresh": 448,

&#x20; "byExchange": \[]

}

```



These numbers are dynamic and may change after future imports.



\---



\## SEC Data Source



SEC means U.S. Securities and Exchange Commission.



MoneySignal AI uses SEC public data for:



```text

Company universe/ticker mapping

Form 4 insider trades

13F institutional holdings

```



Important SEC concepts:



```text

CIK = SEC company/fund identifier

Form 4 = insider buy/sell transactions

13F = institutional fund holdings

Accession number = unique SEC filing identifier

```



All SEC network calls must go through the centralized SEC client.



Centralized SEC client responsibilities:



```text

User-Agent enforcement

Timeouts

Retry/backoff

Rate limiting

Safe logging

get\_json / get\_text / get\_bytes helpers

```



Do not add direct SEC calls using:



```text

requests.get

httpx.get outside sec\_client.py

urllib for SEC URLs

raw ad hoc sec.gov fetches

```



SEC config should include:



```text

SEC\_USER\_AGENT

SEC\_REQUEST\_TIMEOUT\_SECONDS

SEC\_MAX\_RETRIES

SEC\_BACKOFF\_BASE\_SECONDS

SEC\_MIN\_REQUEST\_INTERVAL\_SECONDS

```



Use a real contact email in `SEC\_USER\_AGENT` for production/local serious testing.



Do not hammer SEC.



\---



\## Main Ingestion Pipeline



The full pipeline endpoint:



```text

POST /api/v1/scheduler/run-ingestion

```



Protected behavior:



```text

Without token: 401 Unauthorized

With authenticated admin token: allowed

```



Pipeline status endpoint:



```text

GET /api/v1/scheduler/status

```



Pipeline should support bounded runs using limits:



```text

form4\_limit

thirteen\_f\_limit

market\_limit

```



Main pipeline stages:



```text

1\. Read dynamic company universe from DB

2\. Refresh bounded market data

3\. Fetch/process Form 4 insider trades

4\. Fetch/process 13F institutional holdings

5\. Recalculate MoneySignal scores/signals

6\. Save scrape/ingestion history

7\. Expose latest status/result to admin UI

```



Pipeline should never require processing the full universe during tests.



For local testing, prefer tiny limits:



```text

form4\_limit=3

thirteen\_f\_limit=1

market\_limit=3

```



\---



\## Form 4 Pipeline Source of Truth



Form 4 tracks insider transactions.



Examples:



```text

CEO buys shares

Director sells shares

Officer exercises options

Major shareholder reports transaction

```



MoneySignal AI stores clean, economically meaningful Form 4 trades.



Priority 9 hardening is complete.



Expected Form 4 behavior:



```text

Prevent duplicate insider trades

Skip missing/zero/negative price

Skip missing/zero/negative shares

Skip zero/negative transaction value

Skip missing transaction date

Skip missing transaction code

Handle malformed/no ownershipDocument safely

Do not expose huge XML/HTML in UI/logs

```



Form 4 duplicate checks should use stable trade-level fields such as:



```text

company

insider

accession number

transaction date

transaction code

shares

price

derivative flag

```



Form 4 result counters should include:



```text

attempted

processed

created

updated

skipped

failed

duplicateSkipped

invalidSkipped

missingPriceSkipped

zeroValueSkipped

parserWarningCount

skipReasons

```



Application-level duplicate checks are acceptable for now. A future DB unique constraint may be added only with a careful migration.



\---



\## 13F Pipeline Source of Truth



13F tracks institutional holdings from large funds.



Examples:



```text

Berkshire Hathaway holdings

BlackRock holdings

Vanguard holdings

Citadel holdings

Bridgewater holdings

```



13F data should become a clean institutional ownership signal.



Priority 10 goal:



```text

Add holdings-level duplicate checks

Add filing-level duplicate checks

Improve parser validation

Improve institutional filing reporting

Skip invalid holdings

Avoid huge SEC document exposure

```



Expected 13F duplicate key should consider fields such as:



```text

fund/fund CIK

filing/accession number

report period

issuer name

CUSIP

class title

shares

value

put\_call

investment discretion

```



Do not rely only on issuer name.



Expected invalid skip reasons:



```text

missing\_issuer

missing\_cusip

missing\_shares

zero\_or\_negative\_shares

missing\_value

zero\_or\_negative\_value

missing\_report\_period

missing\_accession\_number

parser\_error

```



Expected 13F stage counters:



```text

attempted

processed

created

updated

skipped

failed

filingsCreated

filingsDuplicateSkipped

holdingsCreated

holdingsUpdated

duplicateSkipped

invalidSkipped

parserWarningCount

skipReasons

```



Do not change Form 4 logic while working on 13F unless absolutely necessary.



\---



\## Market Data Source of Truth



Market refresh should be bounded and safe.



Expected behavior:



```text

Use market\_limit

Skip OTC/pink/grey where appropriate

Skip invalid tickers

Skip warrants/units/rights/slash/caret tickers where appropriate

Prioritize core/common stocks

Do not block the whole pipeline on one bad ticker

```



Market refresh should not be confused with SEC fetching. SEC client rules apply only to SEC requests.



\---



\## Admin/Data Ops UI



Admin page:



```text

/apps/web/src/app/admin/scraper/page.tsx

```



Expected page:



```text

Company Universe summary

Run Full Pipeline controls

Latest result/status

Scrape history

Form 4 tools

13F tools

SEC company universe tools

```



Admin UI should be clear and operational.



It should show:



```text

Total companies

Companies with CIK

Form 4 eligible

Market eligible

Pipeline status

Stage results

Errors/warnings

Data freshness

```



Do not break admin page rendering when adding new backend counters.



\---



\## Local Development Ports



Normal local setup:



```text

Frontend: http://localhost:3000

Backend: http://127.0.0.1:8001

```



Backend command:



```powershell

cd G:\\Projects\\MoneySignal-AI\\money-signal-ai\\apps\\api

.\\.venv\\Scripts\\activate

.\\.venv\\Scripts\\python.exe -m uvicorn app.main:app --reload --port 8001

```



Frontend command:



```powershell

cd G:\\Projects\\MoneySignal-AI\\money-signal-ai\\apps\\web

npm run dev

```



Port 8002 is only a temporary workaround when port 8001 is stuck with a stale process.



Do not permanently switch the project to 8002 unless explicitly requested.



If port 8001 is stuck:



```powershell

netstat -ano | findstr :8001

taskkill /PID <REAL\_PID> /F

```



Do not literally run `<REAL\_PID>` or `<PID\_NUMBER>`.



\---



\## Known Local Warnings



This warning is currently expected and harmless:



```text

pkg\_resources is deprecated as an API

```



Reason:



```text

APScheduler 3.10.1 uses pkg\_resources

setuptools==80.9.0 is pinned so it still works

```



Do not treat this as a breaking backend error.



Future cleanup may upgrade/replace APScheduler.



\---



\## Validation Commands



Backend validation from `apps/api`:



```powershell

.\\.venv\\Scripts\\python.exe -m compileall -q app

.\\.venv\\Scripts\\alembic.exe current

.\\.venv\\Scripts\\alembic.exe heads

```



Backend smoke checks:



```powershell

curl.exe http://127.0.0.1:8001/api/v1/health

curl.exe http://127.0.0.1:8001/api/v1/health/db

curl.exe http://127.0.0.1:8001/api/v1/stocks

curl.exe http://127.0.0.1:8001/api/v1/stocks/universe/stats

curl.exe -i -X POST http://127.0.0.1:8001/api/v1/scheduler/run-ingestion

```



Expected protected route behavior without token:



```text

401 Unauthorized

```



Frontend validation from `apps/web`:



```powershell

npm run lint

npx tsc --noEmit

npm run build -- --webpack

```



Known Windows issue:



```text

.next EPERM cache lock can block builds

```



If TypeScript and lint pass, and build only fails due to `.next` EPERM locking, treat it as a local Windows cache issue, not a confirmed source error.



\---



\## Security Rules



Never expose:



```text

DATABASE\_URL

Supabase password

Clerk secret key

JWT secret

OpenAI key

API keys

Bearer tokens

Full .env contents

```



Do not commit:



```text

apps/api/.env

apps/web/.env.local

node\_modules

.venv

.next

```



Secrets should stay local.



If secrets were accidentally pasted/shared, recommend rotating them.



\---



\## Current Roadmap Status



Completed:



```text

Priority 1: Auth

Priority 2: Admin Security

Priority 3: API Versioning

Priority 4: FE/BE Contract + Ingestion endpoint

Priority 5: Duplicate Routes verification

Priority 6: Database/Alembic

Priority 7: DB Reliability

Priority 8: SEC Client Reliability

Priority 8.5: Dynamic Company Universe

Priority 9: Form 4 Pipeline Hardening

```



Current/next:



```text

Priority 10: 13F Pipeline Hardening

```



Upcoming priorities:



```text

Scheduler reliability

Scrape history improvements

Market data hardening

Caching

Frontend mock data removal

Frontend state improvements

Data health UI

Observability/logging

Rate limiting

Tests

Infra

Docs

AI layer

User scoping

Production safety

```



\---



\## Codex Working Rules



Before changing code, Codex should:



```text

1\. Inspect relevant files first.

2\. Identify current behavior.

3\. Make the smallest safe change.

4\. Avoid unrelated refactors.

5\. Preserve existing API contracts unless the task says otherwise.

6\. Avoid schema/migration changes unless necessary.

7\. Validate with compile/lint/smoke checks.

8\. Summarize changed files and behavior.

9\. Clearly state what was not changed.

```



Every Codex summary should include:



```text

Changed files

What changed

Validation results

Any skipped validation

Any risks or follow-ups

Confirmation that secrets/schema/auth/frontend were not changed when out of scope

```



\---



\## Product Quality Bar



MoneySignal AI should look and feel like a real production portfolio project.



The end goal is not just working code.



The end goal is:



```text

A credible fintech AI platform

Clean backend architecture

Reliable ingestion pipelines

Secure admin operations

Dynamic database-driven data

Clear dashboard UX

Strong engineering story for interviews

```



When in doubt, prefer reliability, clarity, and safe incremental progress over flashy features.



