# Railway Production Deploy Steps

## Goal

Deploy the app to Railway in production with three connected pieces:

1. Railway PostgreSQL database
2. FastAPI backend
3. Next.js frontend

The intended production connection flow is:

- Railway Postgres -> backend via `DATABASE_URL`
- backend -> frontend via `NEXT_PUBLIC_API_BASE_URL`
- frontend never connects directly to Postgres

## Production Architecture

Use three Railway services in one project:

1. `postgres`
2. `backend`
3. `frontend`

Responsibilities:

- `postgres`
  - stores application data
  - source of truth for patients, appointments, services, providers, and payments

- `backend`
  - owns database access
  - runs Alembic migrations
  - exposes API endpoints
  - exposes `/health`

- `frontend`
  - serves the user-facing UI
  - calls the backend using `NEXT_PUBLIC_API_BASE_URL`

## Before You Start

Make sure these repo pieces exist and are current:

- backend image workflow:
  - [`.github/workflows/publish-images.yml`](/Users/mike/dev/decoda-takehome/.github/workflows/publish-images.yml)
- backend Docker image:
  - [`Dockerfile.backend`](/Users/mike/dev/decoda-takehome/Dockerfile.backend)
- frontend Docker image:
  - [`frontend/Dockerfile`](/Users/mike/dev/decoda-takehome/frontend/Dockerfile)

Expected GHCR image names:

- `ghcr.io/<your-github-username>/decoda-takehome-backend:main`
- `ghcr.io/<your-github-username>/decoda-takehome-frontend:main`

## Step 1: Create the Railway Project

In Railway:

1. Create a new project
2. Create a production environment if needed

Recommended services you will add:

- one PostgreSQL service
- one backend service
- one frontend service

## Step 2: Provision Railway Postgres

Create a Railway-managed PostgreSQL service.

After creation:

1. open the Postgres service
2. open the `Variables` tab
3. copy the production `DATABASE_URL`

This `DATABASE_URL` is required in the Railway backend service variables.

## Step 3: Publish Images to GHCR

Push to `main`, or manually run:

- [`.github/workflows/publish-images.yml`](/Users/mike/dev/decoda-takehome/.github/workflows/publish-images.yml)

This should push:

- backend image to `ghcr.io/<your-github-username>/decoda-takehome-backend`
- frontend image to `ghcr.io/<your-github-username>/decoda-takehome-frontend`

Tags used now:

- `main`
- `sha-<commitsha>`

## Step 4: Create the Railway Backend Service

Create a new Railway service for the backend.

Configure it to deploy from the GHCR backend image:

- `ghcr.io/<your-github-username>/decoda-takehome-backend:main`

If the package is private:

- add GHCR pull credentials in Railway
- use a GitHub token with `read:packages`

Set backend variables in Railway:

- `DATABASE_URL=<Railway Postgres DATABASE_URL>`
- `APP_ENV=production`
- `CORS_ORIGINS=<frontend production URL>`

Set the backend deployment commands in Railway:

Custom start command:

- set it to:

```bash
sh -lc 'python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
```

Why this exact command:

- Railway custom start command overrides the Dockerfile `CMD`
- when only the Alembic command was provided, the container ran migrations and exited
- the shell wrapper is needed so `&&` is interpreted reliably in Railway's override field
- `python -m uvicorn` is more reliable than bare `uvicorn` inside the deployed container
- `${PORT:-8000}` still lets Railway inject the real runtime port, while keeping a sane fallback

Do not seed in startup.

## Step 5: Create the Railway Frontend Service

Create a new Railway service for the frontend.

Configure it to deploy from the GHCR frontend image:

- `ghcr.io/<your-github-username>/decoda-takehome-frontend:main`

Set frontend variables in Railway:

- `NEXT_PUBLIC_API_BASE_URL=<backend production URL>`

Important:

- this must be the backend public URL, not `localhost`
- the frontend does not need `DATABASE_URL`

## Step 6: Run Database Migrations

Once Railway Postgres exists and the backend service has `DATABASE_URL` set:

1. deploy the backend service
2. let the Railway custom start command run:

```bash
python -m alembic upgrade head
```

against the Railway production Postgres database.

When to do this:

- after provisioning a fresh production database
- whenever a deploy includes a new Alembic migration

## Step 7: Seed Production Data Once

Only do this when you are bootstrapping production for the first time, or intentionally resetting/reloading production data.

How to run the one-time seed in Railway:

1. open the Railway backend service
2. wait until the backend service has a running instance
3. open the service console / command runner
4. run:

```bash
python -m app.db.seed_db
```

Important:

- this is not a routine deploy step
- `seed_db` clears tables and reloads data
- treat this as a controlled import/reset operation
- this command works only after the backend image that includes `seed_data/` has been deployed

What success looks like:

- the command prints table counts at the end
- expected seeded counts are:
  - `patients: 4000`
  - `providers: 10`
  - `services: 10`
  - `appointments: 6000`
  - `appointment_services: 8398`
  - `payments: 5311`

## Step 8: Enable Railway Image Auto Updates

For both backend and frontend services in Railway:

1. open the service
2. confirm it is using the GHCR image
3. enable Image Auto Updates
4. point it at the moving tag:
   - `main`

That way:

- GitHub Actions pushes a new `:main` image
- Railway detects the updated tag
- Railway redeploys the service automatically

## Step 9: Verify the Production Connections

### Backend checks

Confirm:

- backend service is healthy
- `/health` returns `200`
- `/api/patients` returns DB-backed results
- `/api/summary` returns DB-backed results
- no DB connection errors in logs

### Frontend checks

Confirm:

- the frontend loads successfully
- patients page loads
- analytics page loads
- browser network calls go to the backend production URL
- no requests go to `localhost`

### Data checks

Confirm:

- migration succeeded
- seed succeeded if you ran it
- row counts look correct
- marketing source data appears in the UI

## Recommended Deployment Order

For first production bootstrap:

1. Create Railway project
2. Provision Railway Postgres
3. Publish backend/frontend images to GHCR
4. Create Railway backend service from backend image
5. Set backend `DATABASE_URL`, `APP_ENV`, and `CORS_ORIGINS`
6. Set the backend custom start command to:
   ```bash
   sh -lc 'python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
   ```
7. Create Railway frontend service from frontend image
8. Set `NEXT_PUBLIC_API_BASE_URL`
9. Deploy backend and let migrations run during startup
10. Run `python -m app.db.seed_db` once from the backend console
11. Verify backend and frontend
12. Enable Railway image auto updates

For a normal production code deploy later:

1. Push to `main`
2. Let tests pass
3. Let images publish to GHCR
4. Railway pulls updated backend/frontend images
5. If schema changed, let the backend start command run migrations before boot
6. Verify production

## Environment Variables Summary

### Backend Railway service

- `DATABASE_URL`
- `APP_ENV=production`
- `CORS_ORIGINS=<frontend production URL>`

### Frontend Railway service

- `NEXT_PUBLIC_API_BASE_URL=<backend production URL>`

### GitHub production environment

- none required for DB operations in this setup

## Common Mistakes to Avoid

Do not:

- point frontend at `localhost`
- give frontend direct DB access
- run seed automatically on every deploy
- hide migrations inside Docker build steps
- rely on app startup to create schema

Do:

- keep backend as the only DB client
- run migrations explicitly
- run seed only when intentionally bootstrapping/resetting
- use Railway Postgres as the single production database

## Quick Reference

### Deploy app code

- push to `main`
- GitHub publishes images
- Railway auto-updates backend/frontend from `:main`

### Apply schema changes

- deploy backend with the Railway custom start command:
  ```bash
  sh -lc 'python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
  ```

### Bootstrap production data

- run in the Railway backend console:
```bash
python -m app.db.seed_db
```
