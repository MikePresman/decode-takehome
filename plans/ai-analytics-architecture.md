# AI Analytics Architecture

## Goal

Prepare the backend architecture for the interview extension:

- support arbitrary analytical questions about patients, appointments, services, providers, and payments
- avoid raw NL-to-SQL as the primary architecture
- make the interview implementation a composition task, not a redesign

This document defines the minimum architecture that is genuinely "AI-ready" without overbuilding.

## Current Foundation

The project already has the right base primitives:

- relational Postgres schema with normalized entities
- SQLAlchemy ORM models
- backend service layer in `app/services/`
- derived business logic already centralized in backend code
- frontend consuming APIs instead of embedding domain logic

This means the system is already AI-ready in foundation, but not yet AI-complete.

## Problem Framing

During the interview, the likely ask is not:

- "Can the model write ad hoc SQL?"

The real ask is closer to:

- "Can the application answer open-ended business questions safely and coherently?"

That means we need:

- stable business concepts
- reusable metrics
- reusable dimensions
- safe filtering and grouping rules
- a structured query interface the model can target

## Recommended Approach

Build a thin analytics layer between the ORM and the future AI entrypoint.

Architecture:

1. ORM models
2. domain analytics schema
3. structured analytics query spec
4. query runner / execution service
5. API endpoint for structured analytical queries
6. later: LLM maps user question -> structured query spec

The key design principle:

- the model should generate a constrained query plan, not raw SQL

## What To Build Ahead Of Time

### 1. Analytics Schema Registry

Create a central registry of allowed:

- entities
- metrics
- dimensions
- filters
- sort fields
- date grains

Examples:

- entity: `patients`
- entity: `appointments`
- metric: `patient_count`
- metric: `appointment_count`
- metric: `paid_revenue_cents`
- metric: `average_ticket_cents`
- metric: `no_show_count`
- metric: `lifetime_value_cents`
- dimension: `source`
- dimension: `status`
- dimension: `provider`
- dimension: `service`
- dimension: `month`

Why this matters:

- the LLM gets a safe vocabulary
- the backend gets a whitelist
- the UI and AI can share the same business definitions

Suggested file:

- `app/services/analytics/schema.py`

### 2. Structured Query Spec

Define an internal typed contract for analytical queries.

Suggested shape:

```python
from dataclasses import dataclass
from typing import Literal

@dataclass
class AnalyticsFilter:
    field: str
    op: Literal["eq", "in", "gte", "lte"]
    value: object

@dataclass
class AnalyticsQuery:
    entity: str
    metrics: list[str]
    dimensions: list[str]
    filters: list[AnalyticsFilter]
    sort: list[str]
    limit: int | None = None
    date_grain: str | None = None
```

Example query:

```python
AnalyticsQuery(
    entity="appointments",
    metrics=["appointment_count", "paid_revenue_cents"],
    dimensions=["source"],
    filters=[AnalyticsFilter(field="status", op="eq", value="completed")],
    sort=["-paid_revenue_cents"],
    limit=10,
)
```

Why this matters:

- easy for AI to target
- easy to validate
- easy to test
- avoids unsafe free-form SQL

Suggested file:

- `app/services/analytics/types.py`

### 3. Query Runner

Create one service that:

- validates the query spec
- resolves metrics and dimensions from the registry
- applies filters safely
- builds SQLAlchemy queries
- returns rows plus metadata

Suggested responsibilities:

- resolve base entity
- apply joins
- apply aggregations
- apply grouping
- apply sorting
- serialize rows

Suggested output shape:

```python
{
  "query": {...},
  "columns": ["source", "appointment_count", "paid_revenue_cents"],
  "rows": [
    {"source": "google", "appointment_count": 120, "paid_revenue_cents": 4500000}
  ],
  "meta": {
    "row_count": 1,
    "assumptions": []
  }
}
```

Suggested file:

- `app/services/analytics/query_runner.py`

### 4. Metrics Module

Centralize reusable business metrics as composable SQLAlchemy expressions.

Examples:

- `patient_count`
- `appointment_count`
- `completed_appointment_count`
- `cancelled_appointment_count`
- `no_show_count`
- `paid_revenue_cents`
- `unpaid_appointment_count`
- `average_ticket_cents`
- `repeat_visit_count`

Examples of reusable dimensions:

- `source`
- `patient_status`
- `provider_name`
- `service_name`
- `appointment_month`

Suggested files:

- `app/services/analytics/metrics.py`
- `app/services/analytics/dimensions.py`

### 5. Structured Analytics Endpoint

Add one endpoint for structured queries:

- `POST /api/analytics/query`

Input:

- validated analytics query spec

Output:

- rows
- column definitions
- metadata

This endpoint is the bridge between:

- current dashboard pages
- future AI workflow
- interview demo

Suggested file touchpoints:

- `app/main.py`
- `app/schemas/analytics.py` or similar

## What Not To Build Yet

Avoid these before the interview:

- direct NL-to-SQL
- arbitrary raw SQL execution
- agent orchestration
- vector retrieval for analytics
- a giant semantic layer platform
- dozens of metrics before the contract is stable

These add complexity without improving the interview outcome.

## Recommended MVP Scope

If we prepare only one small but strong slice, build support for these patterns:

1. top sources by patient count or revenue
2. busiest providers by appointment count
3. top services by repeat visits or revenue
4. recent patient behavior by status or recency
5. unpaid / no-show / inactive cohorts

That is enough to demonstrate the architecture clearly.

## Proposed Folder Layout

```text
app/
  services/
    analytics/
      __init__.py
      schema.py
      types.py
      metrics.py
      dimensions.py
      query_runner.py
```

Optional:

```text
app/
  schemas/
    analytics.py
```

## Validation Rules

The query layer should reject:

- unknown metrics
- unknown dimensions
- unsupported filter fields
- unsupported operators
- invalid sort fields
- invalid combinations of metrics and entity

This is important because the future AI layer will make mistakes.

## Why This Is Interview-Friendly

With this design, the interview conversation becomes:

1. parse a user question
2. map it into known metrics, dimensions, and filters
3. execute through the structured analytics layer
4. return results with traceable logic

That is much easier to explain and defend than:

1. send prompt to model
2. let it invent SQL
3. hope the result is correct

## Suggested Talking Points

If asked whether the system is AI-ready:

- "We separated relational storage, business logic, and query execution."
- "The next layer is a constrained analytics query contract."
- "An LLM can target that contract safely instead of generating raw SQL."
- "That gives us explainability, validation, and testability."

## Implementation Plan

Phase 1:

- scaffold `app/services/analytics/`
- define `AnalyticsQuery` and filter types
- define a small schema registry

Phase 2:

- implement a query runner for 3 to 5 supported analytical patterns
- add `POST /api/analytics/query`
- add backend tests

Phase 3:

- optionally add a simple UI playground page for structured analytics queries
- prepare example prompts and mapped specs for the interview

## Recommendation

The best preparation is not to build a full AI feature now.

The best preparation is to build:

- a constrained analytics schema
- a structured query contract
- a safe query runner

That gives the interview extension a strong architectural base and makes the arbitrary-question feature realistic to implement live.
