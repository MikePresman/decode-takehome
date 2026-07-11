from __future__ import annotations

import asyncio
from collections.abc import Sequence

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.data import load_data
from app.db.models import (
    AppointmentRecord,
    AppointmentServiceRecord,
    PatientRecord,
    PaymentRecord,
    ProviderRecord,
    ServiceRecord,
)
from app.db.session import SessionLocal

STORE = load_data()


async def _clear_tables(session: AsyncSession) -> None:
    for model in (
        PaymentRecord,
        AppointmentServiceRecord,
        AppointmentRecord,
        ServiceRecord,
        ProviderRecord,
        PatientRecord,
    ):
        await session.execute(delete(model))


def _patient_rows() -> list[PatientRecord]:
    return [
        PatientRecord(
            id=patient.id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            date_of_birth=patient.date_of_birth,
            gender=patient.gender,
            address=patient.address,
            phone=patient.phone,
            email=patient.email,
            source=patient.source,
            created_date=patient.created_date,
        )
        for patient in STORE.patients
    ]


def _provider_rows() -> list[ProviderRecord]:
    return [
        ProviderRecord(
            id=provider.id,
            first_name=provider.first_name,
            last_name=provider.last_name,
            email=provider.email,
            phone=provider.phone,
            created_date=provider.created_date,
        )
        for provider in STORE.providers
    ]


def _service_rows() -> list[ServiceRecord]:
    return [
        ServiceRecord(
            id=service.id,
            name=service.name,
            description=service.description,
            price=service.price,
            duration=service.duration,
            created_date=service.created_date,
        )
        for service in STORE.services
    ]


def _appointment_rows() -> list[AppointmentRecord]:
    return [
        AppointmentRecord(
            id=appointment.id,
            patient_id=appointment.patient_id,
            status=appointment.status,
            created_date=appointment.created_date,
        )
        for appointment in STORE.appointments
    ]


def _appointment_service_rows() -> list[AppointmentServiceRecord]:
    return [
        AppointmentServiceRecord(
            appointment_id=row.appointment_id,
            service_id=row.service_id,
            provider_id=row.provider_id,
            start=row.start,
            end=row.end,
        )
        for row in STORE.appointment_services
    ]


def _payment_rows() -> list[PaymentRecord]:
    return [
        PaymentRecord(
            id=payment.id,
            patient_id=payment.patient_id,
            amount=payment.amount,
            date=payment.date,
            method=payment.method,
            status=payment.status,
            provider_id=payment.provider_id,
            appointment_id=payment.appointment_id,
            service_id=payment.service_id,
            created_date=payment.created_date,
        )
        for payment in STORE.payments
    ]


async def _bulk_insert(session: AsyncSession, rows: Sequence[object]) -> None:
    session.add_all(rows)
    await session.flush()


async def seed_database() -> dict[str, int]:
    async with SessionLocal() as session:
        await _clear_tables(session)

        await _bulk_insert(session, _patient_rows())
        await _bulk_insert(session, _provider_rows())
        await _bulk_insert(session, _service_rows())
        await _bulk_insert(session, _appointment_rows())
        await _bulk_insert(session, _appointment_service_rows())
        await _bulk_insert(session, _payment_rows())

        await session.commit()

    async with SessionLocal() as session:
        counts = {
            "patients": await session.scalar(select(func.count()).select_from(PatientRecord)),
            "providers": await session.scalar(select(func.count()).select_from(ProviderRecord)),
            "services": await session.scalar(select(func.count()).select_from(ServiceRecord)),
            "appointments": await session.scalar(select(func.count()).select_from(AppointmentRecord)),
            "appointment_services": await session.scalar(select(func.count()).select_from(AppointmentServiceRecord)),
            "payments": await session.scalar(select(func.count()).select_from(PaymentRecord)),
        }

    return {key: int(value or 0) for key, value in counts.items()}


def main() -> None:
    counts = asyncio.run(seed_database())
    for table_name, count in counts.items():
        print(f"{table_name}: {count}")


if __name__ == "__main__":
    main()
