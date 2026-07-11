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

## 9. Immediate open questions for the next pass

These are the right follow-up questions once the low-level shape is accepted:

1. Should `payments` remain one-to-many with `appointments`, or should we enforce one payment per appointment?
2. Do we want Postgres enums for status/method/source, or plain text plus app-level validation?
3. Should `appointment_services` use a surrogate key or a composite primary key?
4. Do we want to preserve the seed IDs as primary keys directly, or add internal UUID/bigint keys and store seed IDs separately?

## 10. Recommended baseline decision

If we want the safest path for the take-home, the baseline should be:

- preserve seed string IDs as primary keys
- use `appointment_services` as a first-class table with a surrogate primary key
- model `appointments -> payments` as one-to-many in ORM
- do **not** add a uniqueness constraint on `payments.appointment_id` yet
- validate seed consistency during import
- use text columns plus SQLAlchemy/Pydantic enum validation first, then tighten to Postgres enums later if needed

This keeps the schema simple, correct, and flexible enough for both the dashboard and the later AI-query discussion.
