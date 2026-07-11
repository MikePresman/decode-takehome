# Deployment Plan

## Goal

Deploy the application to Railway as three separate services:

1. `postgres`
2. `backend`
3. `frontend`

This keeps the database, API, and web app isolated so they can be configured, deployed, and debugged independently.

## Target Architecture

### Postgres

- Use Railway-managed PostgreSQL
- Store all relational application data here
- Serve as the single source of truth for patients, appointments, services, providers, and payments

### Backend

- Deploy the FastAPI app as its own Railway service
- Connect to Railway Postgres through `DATABASE_URL`
- Own migrations, seed/import commands, and API routes
- Expose a `/health` endpoint for Railway healthchecks

### Frontend

- Deploy the Next.js app as its own Railway service
- Serve the user-facing dashboard
- Call the backend via `NEXT_PUBLIC_API_BASE_URL`
- Never connect directly to Postgres

## Why Separate Services

- Frontend and backend use different runtimes and build steps
- Database concerns should stay isolated from app deploys
- Healthchecks and environment variables are simpler
- Failures are easier to debug
- Backend and frontend can be redeployed independently

## Prerequisites

Before deployment, the repo should support:

1. A production-ready backend service
2. A production-ready frontend build
3. A real PostgreSQL schema
4. A migration flow
5. A seed/import flow for `seed_data/`

## Phase 1: Repo Preparation

### Backend

Prepare the Python app so it can run cleanly in production:

- move production backend code under `backend/`
- load configuration from environment variables
- use PostgreSQL instead of in-memory JSON for production reads
- add migrations
- add an explicit seed/import command
- keep `/health`

Minimum backend requirements:

- `DATABASE_URL`-driven config
- async DB session management
- migration command
- seed/import command
- healthcheck endpoint
- production start command

### Frontend

Prepare the Next.js app so it can build and run on Railway:

- ensure `pnpm install` works non-interactively
- ensure `pnpm build` succeeds
- ensure `pnpm start` works with Railway `PORT`
- remove any hardcoded `localhost` assumptions
- read backend URL from `NEXT_PUBLIC_API_BASE_URL`

Minimum frontend requirements:

- production build passes
- runtime API base URL comes from env
- patients and analytics views work against deployed backend

## Phase 2: Postgres Service

Provision Railway Postgres first.

### Steps

1. Create a Railway PostgreSQL service
2. Capture the Railway-provided `DATABASE_URL`
3. Run migrations against the new database
4. Run the seed/import process once
5. Verify row counts and basic query health

### Rules

- do not seed on every deploy
- do not create schema during normal app startup
- keep migrations explicit and repeatable
- use Railway Postgres as the only production database

## Phase 3: Backend Service

Deploy the backend as a dedicated Railway service.

### Required environment variables

- `DATABASE_URL`
- `APP_ENV=production`
- `PORT` supplied by Railway
- `CORS_ORIGINS=<frontend-public-url>`

### Backend start sequence

1. install Python dependencies
2. run migrations
3. optionally run one explicit seed/import job if this is the first deploy
4. start FastAPI with `uvicorn` on `0.0.0.0:$PORT`

### Verification

- service boots successfully
- `/health` returns `200`
- database connection succeeds
- patient list endpoint returns live DB data
- analytics endpoint returns live DB data

## Phase 4: Frontend Service

Deploy the frontend as a dedicated Railway service.

### Required environment variables

- `NEXT_PUBLIC_API_BASE_URL=<backend-public-url>`

### Frontend start sequence

1. install Node dependencies
2. run `pnpm build`
3. run `pnpm start --hostname 0.0.0.0 --port $PORT`

### Verification

- homepage loads
- patients page loads and fetches backend data
- analytics page loads and fetches backend data
- no broken requests to `localhost`

## Deployment Order

Deploy in this order:

1. Postgres
2. Backend
3. Frontend

This avoids frontend or backend booting against an unavailable database.

## Railway Configuration Checklist

### Postgres

- Railway Postgres service exists
- `DATABASE_URL` is available
- migrations applied successfully
- seed/import completed successfully

### Backend

- service root and start command are correct
- healthcheck points to `/health`
- `DATABASE_URL` is set
- `CORS_ORIGINS` includes the frontend public URL

### Frontend

- service root is `frontend/`
- build command is correct
- start command is correct
- `NEXT_PUBLIC_API_BASE_URL` points at the backend public URL

## Operational Decisions

Lock these decisions now:

1. Use three Railway services, not one
2. Use Railway-managed Postgres, not a self-hosted DB
3. Keep seeding/import as an explicit operation
4. Keep frontend isolated from direct DB access
5. Keep backend as the only service that talks to Postgres

## Risks and Failure Modes

### Database not ready

- backend deploy fails because migrations or connections cannot complete

Mitigation:

- deploy Postgres first
- run migrations before validating backend boot

### Frontend points to localhost

- deployed app loads but API calls fail

Mitigation:

- use `NEXT_PUBLIC_API_BASE_URL`
- verify browser network requests after deploy

### Seed/import tied to app boot

- repeated deploys re-import or corrupt data

Mitigation:

- keep seed/import as a separate command
- run it once per environment intentionally

### Mixed local and production assumptions

- app builds locally but fails on Railway

Mitigation:

- test production build commands directly
- keep runtime configuration env-driven

## Immediate Next Steps

1. Finalize the Postgres schema
2. Implement migrations
3. Implement the seed/import command
4. Move backend into a production-ready `backend/` structure
5. Verify frontend production build
6. Create the three Railway services
7. Deploy and verify in order
