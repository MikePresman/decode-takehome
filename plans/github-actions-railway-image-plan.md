# GitHub Actions + Railway Image Plan

## Goal

Add a CI/CD path with three pieces:

1. GitHub Actions workflow for tests
2. GitHub Actions workflow for building and publishing deployable container images
3. Railway configuration so backend and frontend services automatically redeploy when a new image is pushed

This also needs an explicit production database lifecycle:

4. PostgreSQL service provisioning
5. controlled Alembic migration execution in Railway
6. one-time seed/import execution from the Railway backend console

This plan assumes:

- backend and frontend remain separate deployable services
- PostgreSQL remains a Railway-managed database
- GitHub Container Registry (`ghcr.io`) is the image registry
- Railway deploys from images rather than building directly from the repo

## Current State

Today the repo has:

- backend service code at the repo root
- frontend service code under `frontend/`
- local test commands:
  - `tests backend`
  - `tests frontend`
  - `tests`
- Railway source-based startup config via `railway.json` and `Procfile`
- no `.github/workflows/` directory yet
- no Dockerfiles yet

Current database commands:

- `./scripts/db-migrate.sh`
- `./scripts/db-seed.sh`

## Target CI/CD Shape

### Workflow 1: `test.yml`

Purpose:

- run on every pull request
- run on pushes to `main`
- fail fast before images are published

Jobs:

1. `backend-tests`
   - checkout repo
   - set up Python
   - create venv or use `actions/setup-python` cache
   - install `requirements.txt`
   - run `./scripts/test-backend.sh`

2. `frontend-tests`
   - checkout repo
   - set up Node
   - enable pnpm
   - install frontend dependencies
   - run `pnpm test` in `frontend/`

Optional next additions:

- `frontend-build` with `pnpm build`
- `backend-import-check` or migration smoke test

### Workflow 2: `publish-images.yml`

Purpose:

- build production images after tests pass
- push them to GHCR
- produce stable tags Railway can watch

Trigger:

- push to `main`
- optional release tags like `v*`
- optional manual `workflow_dispatch`

Dependencies:

- either re-run tests in this workflow
- or use `workflow_run` after successful `test.yml`

Recommended image set:

1. backend image
   - `ghcr.io/<org-or-user>/decoda-takehome-backend`
2. frontend image
   - `ghcr.io/<org-or-user>/decoda-takehome-frontend`

Recommended tags:

- immutable git SHA tag on every build
  - example: `:sha-<gitsha>`
- moving environment tag for Railway auto updates
  - example: `:main` or `:latest`
- optional release tag on versioned releases
  - example: `:v1.2.0`

Jobs:

1. `build-backend-image`
   - checkout repo
   - log in to GHCR with `GITHUB_TOKEN`
   - build backend Dockerfile
   - push `sha-*` tag
   - push `main` or `latest` tag on `main`

2. `build-frontend-image`
   - same flow for frontend

Recommended actions:

- `docker/setup-buildx-action`
- `docker/login-action`
- `docker/metadata-action`
- `docker/build-push-action`

## Production Database Plan

### A. PostgreSQL database

Provision one Railway-managed PostgreSQL service for production.

Requirements:

- backend service gets `DATABASE_URL` from the Railway Postgres service
- frontend never talks directly to Postgres
- backend is the only service that owns schema and seed operations

Recommended service topology:

1. `postgres`
2. `backend`
3. `frontend`

### B. Running migrations

Migrations should be explicit, repeatable, and decoupled from image boot.

Do not:

- run Alembic in the Docker build
- run Alembic automatically inside container startup on every boot

Recommended production options:

1. Railway custom start command that runs migration before `uvicorn`
2. Railway one-off command run from the backend image
3. manual external workflow

Best default for this repo:

- use a Railway custom start command that runs Alembic before server startup

Why:

- keeps schema advancement close to the backend deploy
- avoids hiding migrations inside Docker build
- avoids a separate DB ops workflow
- reflects the Railway behavior actually verified in this repo

### C. Seeding production

Production seeding should be an explicit operation, not part of normal CI/CD.

Recommended rule:

- run seed exactly once when bootstrapping the production environment
- after that, do not run seed on routine app deploys

If you ever need to re-seed:

- treat it as a deliberate data reset/import event
- require a manual console command
- verify counts after completion

Because `app.db.seed_db` clears tables before reload, it is not a harmless idempotent background task for a live environment. It is a controlled import/reset tool.

## Dockerfile Plan

This repo needs two explicit production Dockerfiles before image publishing can be added.

### Backend Dockerfile

Suggested file:

- `Dockerfile.backend`

Requirements:

- Python base image
- install `requirements.txt`
- copy app code
- expose runtime port
- start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

Important:

- migrations should not run inside the image build
- migrations should run as a deploy-time concern, not a build-time concern

### Frontend Dockerfile

Suggested file:

- `frontend/Dockerfile`

Requirements:

- Node base image
- install with pnpm
- run `pnpm build`
- start with `pnpm start --hostname 0.0.0.0 --port $PORT`

Recommended:

- multi-stage build
- only copy the built runtime artifacts into the final image

## Railway Plan

### Step 1: Switch service source type

For backend and frontend Railway services:

- stop using GitHub source builds as the long-term deploy path
- configure each service to deploy from a Docker image instead

Target images:

- backend -> `ghcr.io/<org-or-user>/decoda-takehome-backend:<channel-tag>`
- frontend -> `ghcr.io/<org-or-user>/decoda-takehome-frontend:<channel-tag>`

### Step 2: Add GHCR access

If GHCR packages are private:

- add Railway registry credentials for `ghcr.io`
- use a GitHub Personal Access Token with `read:packages`

If GHCR packages are public:

- credentials may not be needed for pulls

### Step 3: Enable Railway image auto updates

Railway supports image auto updates for `ghcr.io` images.

For non-semver tags like `latest`, `main`, or `staging`, Railway watches the configured tag and redeploys when a new image is pushed to that same tag.

Recommended setting:

- backend tag: `:main` or `:latest`
- frontend tag: `:main` or `:latest`
- auto updates: enabled
- maintenance window: `Anytime` for fastest deploys, or a scheduled window if you want controlled rollout

### Step 4: Keep database deployment separate

Do not couple database seeding to image pushes.

Recommended production flow:

- app images deploy automatically
- DB migrations run in a controlled step
- seed/import remains explicit and one-time per environment

### Step 5: Production runbook

Recommended first production bootstrap order:

1. Provision Railway Postgres
2. Set backend `DATABASE_URL`
3. Run migrations
4. Run seed/import once
5. Deploy backend image
6. Deploy frontend image
7. Verify `/health`, `/api/patients`, `/api/summary`, and frontend pages

## Recommended Deployment Strategy

### Safer option

Use two tag types:

- immutable tag: `sha-<gitsha>`
- moving deploy channel tag: `main`

Benefits:

- Railway can follow the moving `main` tag automatically
- you still know exactly which image digest came from which commit

### If you want "latest"

It works, but it is weaker operationally than `main` or explicit release tags.

Why:

- `latest` is easy to overwrite
- `latest` is less informative in logs and incident debugging
- `main` or `production` communicates intent better

Recommendation:

- prefer `main` for branch deploys
- prefer semver tags for releases

## GitHub Secrets / Config Needed

### GitHub repository settings

Likely needed:

- `packages: write` permission for the workflow token
- workflow permissions set so `GITHUB_TOKEN` can publish to GHCR

Optional if using Railway API-triggered deploy steps later:

- `RAILWAY_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_ENVIRONMENT_ID`
- per-service IDs if needed

### Railway settings

Needed:

- backend service image source set to GHCR image
- frontend service image source set to GHCR image
- GHCR credentials if packages are private
- image auto updates enabled

## Proposed File Additions

### GitHub Actions

- `.github/workflows/test.yml`
- `.github/workflows/publish-images.yml`

### Container config

- `Dockerfile.backend`
- `frontend/Dockerfile`
- `.dockerignore`
- `frontend/.dockerignore`

### Docs

- README section for:
  - CI expectations
  - image names
  - Railway service image configuration

## Suggested Rollout Order

1. Add Dockerfiles and verify local image builds
2. Add `test.yml`
3. Add `publish-images.yml`
4. Publish images to GHCR manually once
5. Provision Railway Postgres
6. Point Railway backend service at the GHCR backend image
7. Point Railway frontend service at the GHCR frontend image
8. Configure Railway backend custom start command to:
   ```bash
   sh -lc 'python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
   ```
9. Run production seed/import once from the backend console
10. Enable Railway image auto updates on the chosen moving tag
11. Verify a push to `main` produces:
   - green tests
   - new image push
   - Railway redeploy from the new image

12. Verify database-backed endpoints against production data

## Open Decisions

These should be locked before implementation:

1. Tag strategy:
   - `latest`
   - `main`
   - `production`
2. Registry visibility:
   - public GHCR
   - private GHCR
3. Migration execution:
   - Railway custom start command
   - manual Railway command
   - external workflow
4. Production seed execution:
   - Railway one-off command
   - Railway service console
   - never automatic
5. Frontend deployment mode:
   - static app behind Node runtime
   - full Next runtime image

## Recommended Decisions

For this repo, the most practical default is:

1. use `ghcr.io`
2. publish `sha-*` and `main` tags
3. configure Railway services to track the `main` tag
4. enable Railway image auto updates with an `Anytime` or off-hours maintenance window
5. keep migrations explicit in the verified Railway custom start command
6. keep production seeding manual and one-time only from the backend console

## Why Railway Will Pull the Latest Image

Per Railway's current docs:

- `ghcr.io` supports image auto updates
- for non-semver tags like `latest` or `staging`, Railway watches that tag and redeploys when a new image is pushed to it

That means Railway does **not** need a GitHub source build if the service is configured to use the GHCR image directly and image auto updates are enabled.

## Sources

- Railway docs: Image Auto Updates  
  https://docs.railway.com/deployments/image-auto-updates
- Railway docs: Private Registries  
  https://docs.railway.com/builds/private-registries
- Railway docs: Manage Services with the Public API  
  https://docs.railway.com/integrations/api/manage-services
