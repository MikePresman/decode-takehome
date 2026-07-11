from __future__ import annotations

import asyncio
import json
from collections.abc import Sequence
from datetime import datetime
from pathlib import Path

from sqlalchemy import DateTime, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AppointmentRecord,
    AppointmentServiceRecord,
    PatientRecord,
    PaymentRecord,
    ProviderRecord,
    ServiceRecord,
)
from app.db.session import SessionLocal

ROOT = Path(__file__).resolve().parent.parent.parent
SEED_DIR = ROOT / "seed_data"


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


def _load_seed_rows(filename: str) -> list[dict[str, object]]:
    path = SEED_DIR / filename
    with path.open() as handle:
        return json.load(handle)


def _coerce_row(payload: dict[str, object], orm_model: type) -> object:
    coerced: dict[str, object] = {}
    for column in orm_model.__table__.columns:
        if column.name not in payload:
            continue

        value = payload[column.name]
        if value is not None and isinstance(column.type, DateTime) and isinstance(value, str):
            value = datetime.fromisoformat(value)

        coerced[column.name] = value

    return orm_model(**coerced)


def _rows(filename: str, orm_model: type) -> list[object]:
    return [_coerce_row(item, orm_model) for item in _load_seed_rows(filename)]


async def _bulk_insert(session: AsyncSession, rows: Sequence[object]) -> None:
    session.add_all(rows)
    await session.flush()


async def seed_database() -> dict[str, int]:
    async with SessionLocal() as session:
        await _clear_tables(session)

        await _bulk_insert(session, _rows("patient.json", PatientRecord))
        await _bulk_insert(session, _rows("provider.json", ProviderRecord))
        await _bulk_insert(session, _rows("service.json", ServiceRecord))
        await _bulk_insert(session, _rows("appointment.json", AppointmentRecord))
        await _bulk_insert(session, _rows("appointment_service.json", AppointmentServiceRecord))
        await _bulk_insert(session, _rows("payment.json", PaymentRecord))

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
