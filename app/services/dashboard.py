from __future__ import annotations

from sqlalchemy import case, distinct, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AppointmentRecord,
    AppointmentServiceRecord,
    PatientRecord,
    PaymentRecord,
    ProviderRecord,
    ServiceRecord,
)


PATIENT_SORT_COLUMNS = {
    "created_date": "created_date",
    "full_name": "full_name",
    "lifetime_value_cents": "lifetime_value_cents",
    "appointment_count": "appointment_count",
}


def _patient_listing_query():
    appointment_counts = (
        select(
            AppointmentRecord.patient_id.label("patient_id"),
            func.count().label("appointment_count"),
        )
        .group_by(AppointmentRecord.patient_id)
        .subquery()
    )

    payment_aggregates = (
        select(
            PaymentRecord.patient_id.label("patient_id"),
            func.count(
                distinct(case((PaymentRecord.status == "paid", PaymentRecord.appointment_id)))
            ).label("paid_appointment_count"),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).label("lifetime_value_cents"),
        )
        .group_by(PaymentRecord.patient_id)
        .subquery()
    )

    return (
        select(
            PatientRecord.id.label("id"),
            PatientRecord.first_name.label("first_name"),
            PatientRecord.last_name.label("last_name"),
            func.concat(PatientRecord.first_name, " ", PatientRecord.last_name).label("full_name"),
            PatientRecord.email.label("email"),
            PatientRecord.phone.label("phone"),
            PatientRecord.source.label("source"),
            PatientRecord.gender.label("gender"),
            PatientRecord.created_date.label("created_date"),
            func.coalesce(appointment_counts.c.appointment_count, 0).label("appointment_count"),
            func.coalesce(payment_aggregates.c.paid_appointment_count, 0).label("paid_appointment_count"),
            func.coalesce(payment_aggregates.c.lifetime_value_cents, 0).label("lifetime_value_cents"),
        )
        .select_from(PatientRecord)
        .outerjoin(appointment_counts, appointment_counts.c.patient_id == PatientRecord.id)
        .outerjoin(payment_aggregates, payment_aggregates.c.patient_id == PatientRecord.id)
    )


async def get_patient_rows(
    session: AsyncSession,
    *,
    q: str | None,
    source: str | None,
    sort: str,
    order: str,
    limit: int,
    offset: int,
) -> dict[str, object]:
    base_query = _patient_listing_query()

    if q:
        needle = f"%{q.lower()}%"
        full_name = func.lower(func.concat(PatientRecord.first_name, " ", PatientRecord.last_name))
        base_query = base_query.where(
            or_(
                full_name.like(needle),
                func.lower(PatientRecord.email).like(needle),
                func.lower(PatientRecord.phone).like(needle),
            )
        )

    if source:
        base_query = base_query.where(PatientRecord.source == source)

    rows_subquery = base_query.subquery()
    sort_column = getattr(rows_subquery.c, PATIENT_SORT_COLUMNS[sort])
    if order == "desc":
        sort_column = sort_column.desc()
    else:
        sort_column = sort_column.asc()

    total = await session.scalar(select(func.count()).select_from(rows_subquery))
    result = await session.execute(
        select(rows_subquery).order_by(sort_column, rows_subquery.c.id).offset(offset).limit(limit)
    )

    items = []
    for row in result.mappings():
        item = dict(row)
        item["created_date"] = item["created_date"].isoformat()
        items.append(item)

    return {
        "total": int(total or 0),
        "limit": limit,
        "offset": offset,
        "items": items,
    }


async def get_summary_metrics(session: AsyncSession) -> dict[str, object]:
    totals = {
        "patients": int(await session.scalar(select(func.count()).select_from(PatientRecord)) or 0),
        "appointments": int(await session.scalar(select(func.count()).select_from(AppointmentRecord)) or 0),
        "providers": int(await session.scalar(select(func.count()).select_from(ProviderRecord)) or 0),
        "services": int(await session.scalar(select(func.count()).select_from(ServiceRecord)) or 0),
        "paid_revenue_cents": int(
            await session.scalar(
                select(func.coalesce(func.sum(PaymentRecord.amount), 0)).where(PaymentRecord.status == "paid")
            )
            or 0
        ),
        "avg_paid_ticket_cents": int(
            round(
                float(
                    await session.scalar(
                        select(func.coalesce(func.avg(PaymentRecord.amount), 0)).where(PaymentRecord.status == "paid")
                    )
                    or 0
                )
            )
        ),
    }

    source_rows = await session.execute(
        select(PatientRecord.source, func.count().label("count"))
        .group_by(PatientRecord.source)
        .order_by(func.count().desc(), PatientRecord.source.asc())
    )

    service_rows = await session.execute(
        select(
            AppointmentServiceRecord.service_id,
            ServiceRecord.name,
            func.count().label("count"),
        )
        .join(ServiceRecord, ServiceRecord.id == AppointmentServiceRecord.service_id)
        .group_by(AppointmentServiceRecord.service_id, ServiceRecord.name)
        .order_by(func.count().desc(), ServiceRecord.name.asc())
        .limit(5)
    )

    provider_rows = await session.execute(
        select(
            AppointmentServiceRecord.provider_id,
            func.concat(ProviderRecord.first_name, " ", ProviderRecord.last_name).label("name"),
            func.count().label("count"),
        )
        .join(ProviderRecord, ProviderRecord.id == AppointmentServiceRecord.provider_id)
        .group_by(AppointmentServiceRecord.provider_id, ProviderRecord.first_name, ProviderRecord.last_name)
        .order_by(func.count().desc(), ProviderRecord.last_name.asc(), ProviderRecord.first_name.asc())
        .limit(5)
    )

    return {
        "totals": totals,
        "patient_sources": {
            source: count for source, count in source_rows.all()
        },
        "top_services": [
            {"service_id": service_id, "name": name, "count": count}
            for service_id, name, count in service_rows.all()
        ],
        "busiest_providers": [
            {"provider_id": provider_id, "name": name, "count": count}
            for provider_id, name, count in provider_rows.all()
        ],
    }


async def get_metadata(session: AsyncSession) -> dict[str, object]:
    source_rows = await session.scalars(select(PatientRecord.source).distinct().order_by(PatientRecord.source.asc()))
    service_count = await session.scalar(select(func.count()).select_from(ServiceRecord))
    provider_count = await session.scalar(select(func.count()).select_from(ProviderRecord))

    return {
        "sources": list(source_rows),
        "service_count": int(service_count or 0),
        "provider_count": int(provider_count or 0),
    }
