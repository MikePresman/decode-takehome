# Analytics Dashboard Plan

## Objective

Build an analytics dashboard that is useful to a medical spa owner or manager, not just visually impressive.

The dashboard should answer:

- how the business is performing financially
- where patients are coming from
- which services are driving demand
- which providers are most utilized
- whether appointments, payments, and patient behavior point to operational issues

This plan covers:

- backend analytics endpoints
- reusable analytics services
- frontend dashboard implementation
- response contracts
- testing

## Product Goals

The analytics page should help management answer:

- Which channels bring in patients?
- Which channels produce revenue, not just volume?
- Which services are most in demand?
- Which providers are busiest?
- Are bookings, payments, and completion rates healthy?
- Are unpaid or cancelled appointments becoming a problem?

The page should optimize for fast comprehension on a laptop screen.

## Scope

### Backend

Build analytics endpoints for:

- top-line KPIs
- patient acquisition breakdown
- revenue totals and trends
- popular services
- busiest providers
- appointment status mix

### Frontend

Build a real analytics dashboard with:

- KPI cards
- revenue trend visualization
- patient source mix
- top services table/list
- busiest providers table/list
- appointment status breakdown

### Architecture

Separate analytics query logic from route handlers so the same logic can later support AI-based analytics.

## Guiding Principles

1. Favor business usefulness over chart variety.
2. Keep contracts stable and frontend-friendly.
3. Prefer DB-side aggregation over Python-side post-processing.
4. Reuse backend service functions and frontend display components where possible.
5. Keep derived business metrics centralized.

## Metrics Vocabulary

Define and reuse a small analytics vocabulary:

- total patients
- total revenue
- collection rate
- average revenue per patient
- average appointment value
- active patients
- new patients
- patients by source
- appointments by provider
- appointments by service
- appointment status mix

This vocabulary should appear consistently in:

- backend aggregation services
- API responses
- dashboard UI
- future AI query layer

## Proposed Backend Structure

Create or expand:

```text
app/services/
  dashboard.py
  analytics/
    __init__.py
    overview.py
    revenue.py
    acquisition.py
    services.py
    providers.py
    appointments.py
```

If we want to stay lighter-weight, we can keep one module for now:

- `app/services/dashboard.py`

But structure the code internally as reusable aggregation functions.

## Proposed API Shape

Option A:

- keep one dashboard endpoint:
  - `GET /api/summary`

Option B:

- split into targeted endpoints:
  - `GET /api/analytics/overview`
  - `GET /api/analytics/revenue`
  - `GET /api/analytics/acquisition`
  - `GET /api/analytics/services`
  - `GET /api/analytics/providers`
  - `GET /api/analytics/appointments`

### Recommendation

Use a hybrid approach:

- keep `GET /api/summary` for top-level dashboard composition
- let it return a stable object with named sections

Suggested response shape:

```json
{
  "overview": {
    "total_patients": 4000,
    "total_revenue_cents": 12345678,
    "collection_rate_pct": 82.4,
    "avg_revenue_per_patient_cents": 3086,
    "avg_appointment_value_cents": 18400,
    "active_patients": 1274,
    "new_patients_30d": 48
  },
  "revenue_trend": [
    { "period": "2026-01", "revenue_cents": 1200000, "appointment_count": 92 }
  ],
  "patient_sources": [
    { "source": "google", "patient_count": 640, "revenue_cents": 1800000 }
  ],
  "top_services": [
    { "service_id": "svc_1", "name": "Botox", "appointment_count": 220, "revenue_cents": 4200000 }
  ],
  "busiest_providers": [
    { "provider_id": "prv_1", "name": "Dr. Smith", "appointment_count": 180, "revenue_cents": 3100000 }
  ],
  "appointment_status_mix": [
    { "status": "completed", "count": 520 },
    { "status": "cancelled", "count": 41 },
    { "status": "no_show", "count": 18 }
  ]
}
```

Why this shape works:

- stable for frontend rendering
- stable for tests
- extensible for AI later

## Backend Aggregation Plan

### 1. Overview Metrics

Compute:

- total patients
- total paid revenue
- collection rate
- average revenue per patient
- average appointment value
- active patients
- new patients in last 30 days

### 2. Revenue Trend

Compute by month:

- paid revenue
- appointment count

This supports:

- revenue growth reading
- bookings vs revenue comparisons

### 3. Patient Acquisition Breakdown

Compute by source:

- patient count
- revenue contribution

This makes source analysis more useful than just percentage of patient volume.

### 4. Popular Services

Compute by service:

- appointment count
- paid revenue

Optional:

- average revenue per appointment

### 5. Busiest Providers

Compute by provider:

- appointment count
- paid revenue

Optional:

- average revenue per appointment

### 6. Appointment Status Mix

Compute:

- completed
- cancelled
- confirmed
- no_show
- other statuses present in seed data

This supports operational risk visibility.

## DB-Side Aggregation Rules

Prefer SQLAlchemy/Postgres-side aggregation for:

- counts
- sums
- averages
- grouping
- ordering
- limiting

Avoid Python-side processing except for:

- light serialization
- percent calculations from already-aggregated rows
- shaping final response objects

## Frontend Dashboard Plan

Replace the current mocked analytics page with live API data.

### Page Structure

1. Header
- page title
- short business-oriented subtitle

2. KPI cards
- revenue
- active patients
- collection rate
- average revenue per patient or average appointment value

3. Revenue trend
- line or area trend
- simple and legible

4. Patient source mix
- ranked list or segmented chart
- show counts and revenue

5. Top services
- ranked list/table

6. Busiest providers
- ranked list/table

7. Appointment status mix
- simple bars or segmented breakdown

### Recommendation On Charts

Do not add a charting library unless necessary.

Prefer:

- SVG line/area chart for revenue trend
- horizontal bars for sources/services/providers/status
- compact ranked lists

This keeps the page intentional, stable, and easier to test.

## Frontend Components To Build

Suggested reusable components:

```text
frontend/components/analytics/
  analytics-kpi-cards.tsx
  analytics-revenue-trend.tsx
  analytics-source-breakdown.tsx
  analytics-top-services.tsx
  analytics-top-providers.tsx
  analytics-status-mix.tsx
  analytics-error-state.tsx
  analytics-loading-state.tsx
```

## UX Requirements

We should explicitly satisfy:

### Loading States

- route-level loading UI for `/analytics`
- skeleton or placeholder cards/charts

### Error Handling

- route-level error boundary
- friendly message with retry action

### Filtering & Search

The analytics page may not need text search immediately.

For now:

- focus on clear presentation and stable sections
- if filters are added later, they should be intentional date/source/provider filters, not filler controls

### Data Density

- show actionable metrics, not too many tiles
- use separate sections for financial, acquisition, provider, and service insights
- avoid overwhelming the screen with decorative charts

## Testing Plan

### Backend Tests

Add or expand tests for:

- summary route contract
- aggregation service output shape
- revenue trend section
- source/service/provider/status sections

### Frontend Tests

Add tests for:

- KPI rendering
- top services/provider/source/status sections
- loading state
- error state

### Build Verification

Run:

- backend tests
- frontend tests
- frontend production build

## Implementation Phases

### Phase 1: Backend Contract

- expand `get_summary_metrics`
- return stable analytics sections
- add backend tests

### Phase 2: Frontend Data Layer

- add analytics response types
- add API fetch helpers

### Phase 3: Dashboard UI

- replace mock analytics page with live dashboard
- build reusable analytics components

### Phase 4: UX Hardening

- add loading/error routes
- tighten spacing and hierarchy for laptop readability

### Phase 5: Verification

- run tests
- run build
- review dashboard on realistic data

## Risks

1. Seed data may not support every "business" metric cleanly.
- We should prefer metrics the current relational model can defend.

2. Too much visual complexity can reduce clarity.
- Use a few strong sections, not many weak ones.

3. Backend responses can drift if not typed centrally.
- Keep response shape stable and section-based.

## Recommendation

The best next build sequence is:

1. expand backend summary contract
2. add analytics response types and components
3. replace mock page with real API data
4. add loading/error states
5. add tests

This satisfies the take-home better than continuing to polish the patient table first.
