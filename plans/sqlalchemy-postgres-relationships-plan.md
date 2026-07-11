# SQLAlchemy + PostgreSQL Relationship Plan

This document focuses on the low-level database relationship basics for the Beauty Med Spa data model. It is intentionally narrower than the full implementation plan. The goal is to lock the relational shape first so later API and analytics work sits on a stable foundation.

## 1. Core relationship shape

The seed data implies this canonical structure:

- One `patient` has many `appointments`
- One `appointment` has many `appointment_services`
- One `appointment_service` points to one `service`
- One `appointment_service` points to one `provider`
- One `appointment` has zero or one `payment` in the current seed data
- One `payment` belongs to one `appointment`

That means the real service-provider assignment does **not** live directly on `appointments`. It lives on the join table `appointment_services`.

## 2. Why the join table is required

The business rule says:

- each appointment can include multiple services
- services can be associated with different providers

That immediately rules out putting a single `service_id` or `provider_id` on `appointments`.

Example:

- Appointment `A1`
- Service line 1: Botox by Provider Elena
- Service line 2: Hydrafacial by Provider Natasha

This is one appointment, but two service-provider combinations. The correct model is:

- `appointments`
- `appointment_services`

where each row in `appointment_services` represents one service line scheduled inside the appointment.

## 3. Recommended Postgres tables

### `patients`

Purpose:
- Stores the patient master record

Key columns:
- `id text primary key`
- demographic/contact columns
- `source text not null`
- `created_at timestamptz not null`

Relationships:
- `patients.id -> appointments.patient_id`

### `appointments`

Purpose:
- Stores the appointment header

Key columns:
- `id text primary key`
- `patient_id text not null references patients(id)`
- `status text not null`
- `created_at timestamptz not null`

Relationships:
- many appointments belong to one patient
- one appointment has many appointment service rows
- one appointment has zero or one payment in the seed

### `services`

Purpose:
- Catalog of billable services

Key columns:
- `id text primary key`
- `name text not null`
- `description text not null`
- `price_cents integer not null`
- `duration_minutes integer not null`
- `created_at timestamptz not null`

Relationships:
- one service can appear in many appointment service rows

### `providers`

Purpose:
- Staff/providers who perform services

Key columns:
- `id text primary key`
- identifying/contact columns
- `created_at timestamptz not null`

Relationships:
- one provider can appear in many appointment service rows

### `appointment_services`

Purpose:
- Join table between appointments and services, with provider and scheduled time attached to each service line

Key columns:
- `appointment_id text not null references appointments(id)`
- `service_id text not null references services(id)`
- `provider_id text not null references providers(id)`
- `start_at timestamptz not null`
- `end_at timestamptz not null`

Recommended key:
- add surrogate `id bigserial primary key` for ORM simplicity
- also add `unique (appointment_id, service_id, provider_id, start_at)`

Why a surrogate key is useful:
- easier SQLAlchemy relationships
- easier future references from payments, notes, or audit rows
- avoids awkward composite foreign keys if the model grows

### `payments`

Purpose:
- Records payment state for an appointment

Key columns:
- `id text primary key`
- `appointment_id text not null references appointments(id)`
- `patient_id text not null references patients(id)`
- `provider_id text not null references providers(id)`
- `service_id text not null references services(id)`
- `amount_cents integer not null`
- `payment_date timestamptz not null`
- `method text not null`
- `status text not null`
- `created_at timestamptz not null`

Important note:
- `provider_id` and `service_id` on `payments` are denormalized convenience fields in the seed
- they describe the primary service/provider for that payment
- the authoritative list of services on the appointment still lives in `appointment_services`

## 4. Cardinality decisions

These are the specific low-level cardinalities we should implement.

### Patient -> Appointment

- one-to-many
- patient may have zero appointments
- appointment must have exactly one patient

### Appointment -> AppointmentService

- one-to-many
- appointment should have at least one service row from a business perspective
- the database alone will not enforce "at least one child row" cleanly during inserts, so enforce that in the seed/import layer and service layer

### Service -> AppointmentService

- one-to-many
- a service can appear in many appointments

### Provider -> AppointmentService

- one-to-many
- a provider can perform many services across many appointments

### Appointment -> Payment

- current seed shape is effectively one-to-zero-or-one
- domain may later become one-to-many if partial payments, refunds, or multiple tenders are introduced

Recommendation:
- model it as one-to-many in SQLAlchemy/Postgres unless the product requirement explicitly says one appointment can only ever have one payment
- add a unique constraint on `payments.appointment_id` only if we want to freeze the current seed assumption

## 5. Seed-data facts that affect schema design

Validated from the current JSON seed:

- all foreign keys resolve cleanly
- every appointment has at least one `appointment_service`
- `2051` appointments have multiple services
- `5311` appointments have exactly one payment
- `689` appointments have no payment
- no appointment currently has multiple payments
- every payment's `patient_id` matches the appointment's patient
- every payment's `service_id` and `provider_id` correspond to a service-provider line on that appointment

This supports keeping `payments.appointment_id` as the main ownership link while treating `patient_id`, `service_id`, and `provider_id` as consistency-checked denormalized fields.

## 6. Recommended SQLAlchemy ORM relationships

The clean ORM graph should look like this:

- `Patient.appointments -> relationship("Appointment", back_populates="patient")`
- `Appointment.patient -> relationship("Patient", back_populates="appointments")`
- `Appointment.appointment_services -> relationship("AppointmentService", back_populates="appointment")`
- `Appointment.payments -> relationship("Payment", back_populates="appointment")`
- `AppointmentService.appointment -> relationship("Appointment", back_populates="appointment_services")`
- `AppointmentService.service -> relationship("Service", back_populates="appointment_services")`
- `AppointmentService.provider -> relationship("Provider", back_populates="appointment_services")`
- `Service.appointment_services -> relationship("AppointmentService", back_populates="service")`
- `Provider.appointment_services -> relationship("AppointmentService", back_populates="provider")`
- `Payment.appointment -> relationship("Appointment", back_populates="payments")`
- `Payment.patient -> relationship("Patient")`
- `Payment.service -> relationship("Service")`
- `Payment.provider -> relationship("Provider")`

Important modeling choice:

- do **not** model `Appointment.services` as a plain many-to-many `secondary` relationship only
- keep `AppointmentService` as a first-class ORM model because it contains business data (`provider_id`, `start_at`, `end_at`)

We can add an association proxy later if we want a convenience accessor for `appointment.services`.

## 7. Constraints and indexes

Minimum constraints:

- foreign keys on every relationship column
- `check (amount_cents >= 0)`
- `check (duration_minutes > 0)`
- `check (end_at > start_at)`

Minimum indexes:

- `appointments(patient_id)`
- `appointment_services(appointment_id)`
- `appointment_services(service_id)`
- `appointment_services(provider_id)`
- `payments(appointment_id)`
- `payments(patient_id)`
- `payments(status)`
- optional compound indexes for analytics:
  - `appointment_services(provider_id, start_at)`
  - `appointment_services(service_id, start_at)`
  - `payments(status, payment_date)`

## 8. Normalization stance

Recommended rule:

- `appointment_services` is the source of truth for what happened in an appointment
- `payments` is the source of truth for money movement
- `payments.patient_id`, `payments.provider_id`, and `payments.service_id` are useful for read performance and easier reporting, but should be validated against the owning appointment during ingestion

This gives us a pragmatic design:

- normalized enough for correctness
- simple enough for analytics queries
- still compatible with the exact seed payload

## 9. Product-driven answers to the remaining schema questions

These answers should be driven by the actual product requirements:

- read-only dashboard
- front-desk patient lookup
- manager-facing analytics
- later AI-style arbitrary question answering
- moderate data volume (`4000` patients, `6000` appointments, `8398` appointment-service rows, `5311` payments)

That combination favors:

- predictable query shapes
- simple joins
- strong constraints where they reflect the seed and the product
- not over-engineering for write-heavy workflows we do not need

### 1. Should `payments` be strictly one per appointment?

Recommended answer:
- no, allow multiple payments per appointment

Why:
- this is the safer domain assumption because real med spa workflows can include deposits, follow-up charges, retries, partial collections, and refunds later
- the seed currently has only one payment per paid appointment, but the schema should not hard-code that as a permanent business rule unless the product explicitly says it
- the read-only analytics layer can still answer revenue and collection questions cleanly by aggregating payments per appointment, patient, provider, or service

Recommended implementation:
- keep `payments.appointment_id` as `NOT NULL`
- do **not** add `UNIQUE (appointment_id)`
- model `Appointment.payments` as a one-to-many relationship
- keep `payment.status` so future failed or reversed attempts remain representable

Tradeoff:
- appointment-level revenue queries must aggregate instead of assuming one row
- that is a reasonable cost and keeps the schema future-safe

### 2. Should we use Postgres enums or plain text columns first?

Recommended answer:
- use plain text columns first

Why:
- plain text is simpler to migrate, seed, inspect, and query while the product is still taking shape
- the API and ingestion layer can still validate allowed values using Python enums or literal types
- this keeps Postgres friction lower for the take-home without losing correctness at the application boundary

Tradeoff:
- the database itself will not enforce category membership unless we add check constraints
- that is acceptable here because the data is seeded and the app is read-only

### 3. Should `appointment_services` use a surrogate PK or composite PK?

Recommended answer:
- use a surrogate primary key

Why:
- `appointment_services` is not a pure join table; it is an association object with business meaning
- it carries:
  - `provider_id`
  - `start_at`
  - `end_at`
- it may later become the anchor for more derived relationships:
  - utilization metrics
  - service-line notes
  - per-line revenue allocation
  - AI explanations about what happened in a visit
- a surrogate key keeps SQLAlchemy simpler and avoids composite foreign keys if we expand the model

Recommended implementation:
- `id bigserial primary key`
- also add `UNIQUE (appointment_id, service_id, provider_id, start_at)`

That preserves natural uniqueness without forcing every downstream reference to carry a multi-column key.

### 4. Should seed IDs remain the primary keys directly?

Recommended answer:
- yes, preserve seed IDs as the primary keys for this take-home

Why:
- the system is seed-driven and read-only
- the IDs are already stable, globally distinct by prefix, and present across all files
- preserving them makes import logic straightforward
- preserving them simplifies debugging and data verification because every row can be traced directly back to the original JSON
- AI-oriented and analytics tooling often benefits from transparent identifiers during development and demos

Tradeoff:
- text primary keys are a little heavier than internal bigint keys
- but at this scale the performance cost is negligible compared with the clarity gained

If this became a longer-lived production system with high write volume, internal numeric keys plus external source IDs might be worth revisiting. It is not necessary here.

## 10. Final recommended baseline

Given the actual requirements, the best baseline is:

- preserve seed string IDs as the primary keys
- use `appointment_services` as a first-class table with a surrogate primary key
- allow multiple payments per appointment
- use plain text columns for categorical fields
- validate all denormalized payment references during import
- index around the actual product queries:
  - patient lookup and sorting
  - patient source filtering
  - appointment-to-patient traversal
  - service/provider analytics
  - paid revenue queries

This gives us a schema optimized for:

- front-desk search and scanning
- owner/manager analytics
- clean aggregation queries
- a later AI layer that can reason over a well-constrained relational model
