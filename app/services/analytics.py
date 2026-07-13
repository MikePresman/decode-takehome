from __future__ import annotations

from datetime import datetime, timedelta

from sqlalchemy import case, distinct, func, literal, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    AppointmentRecord,
    AppointmentServiceRecord,
    PatientRecord,
    PaymentRecord,
    ProviderRecord,
    ServiceRecord,
)


ACTIVE_WINDOW_DAYS = 120
NEW_PATIENT_WINDOW_DAYS = 30


def _utc_now() -> datetime:
    return datetime.utcnow()


async def get_overview_metrics(session: AsyncSession) -> dict[str, object]:
    now = _utc_now()
    active_since = now - timedelta(days=ACTIVE_WINDOW_DAYS)
    new_since = now - timedelta(days=NEW_PATIENT_WINDOW_DAYS)

    total_patients = int(await session.scalar(select(func.count()).select_from(PatientRecord)) or 0)
    total_appointments = int(await session.scalar(select(func.count()).select_from(AppointmentRecord)) or 0)
    total_providers = int(await session.scalar(select(func.count()).select_from(ProviderRecord)) or 0)
    total_services = int(await session.scalar(select(func.count()).select_from(ServiceRecord)) or 0)

    paid_revenue_cents = int(
        await session.scalar(
            select(func.coalesce(func.sum(PaymentRecord.amount), 0)).where(PaymentRecord.status == "paid")
        )
        or 0
    )

    paid_appointment_count = int(
        await session.scalar(
            select(
                func.count(
                    distinct(case((PaymentRecord.status == "paid", PaymentRecord.appointment_id)))
                )
            )
        )
        or 0
    )

    active_patients = int(
        await session.scalar(
            select(func.count(distinct(AppointmentRecord.patient_id))).where(
                AppointmentRecord.created_date >= active_since
            )
        )
        or 0
    )

    new_patients_30d = int(
        await session.scalar(
            select(func.count()).select_from(PatientRecord).where(PatientRecord.created_date >= new_since)
        )
        or 0
    )

    total_payments = int(await session.scalar(select(func.count()).select_from(PaymentRecord)) or 0)
    paid_payments = int(
        await session.scalar(
            select(func.count()).select_from(PaymentRecord).where(PaymentRecord.status == "paid")
        )
        or 0
    )

    collection_rate_pct = round((paid_payments / total_payments) * 100, 1) if total_payments else 0.0
    avg_revenue_per_patient_cents = round(paid_revenue_cents / total_patients) if total_patients else 0
    avg_appointment_value_cents = round(paid_revenue_cents / paid_appointment_count) if paid_appointment_count else 0

    return {
        "total_patients": total_patients,
        "total_appointments": total_appointments,
        "total_providers": total_providers,
        "total_services": total_services,
        "total_revenue_cents": paid_revenue_cents,
        "collection_rate_pct": collection_rate_pct,
        "avg_revenue_per_patient_cents": int(avg_revenue_per_patient_cents),
        "avg_appointment_value_cents": int(avg_appointment_value_cents),
        "active_patients": active_patients,
        "new_patients_30d": new_patients_30d,
    }


async def get_revenue_trend(session: AsyncSession) -> list[dict[str, object]]:
    period = func.to_char(PaymentRecord.date, literal("YYYY-MM"))
    result = await session.execute(
        select(
            period.label("period"),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).label("revenue_cents"),
            func.count(
                distinct(case((PaymentRecord.status == "paid", PaymentRecord.appointment_id)))
            ).label("appointment_count"),
        )
        .group_by(period)
        .order_by(period.asc())
    )

    return [
        {
            "period": period_value,
            "revenue_cents": int(revenue_cents),
            "appointment_count": int(appointment_count),
        }
        for period_value, revenue_cents, appointment_count in result.all()
    ]


async def get_patient_acquisition_breakdown(session: AsyncSession) -> list[dict[str, object]]:
    result = await session.execute(
        select(
            PatientRecord.source.label("source"),
            func.count(distinct(PatientRecord.id)).label("patient_count"),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).label("revenue_cents"),
        )
        .select_from(PatientRecord)
        .outerjoin(PaymentRecord, PaymentRecord.patient_id == PatientRecord.id)
        .group_by(PatientRecord.source)
        .order_by(func.count(distinct(PatientRecord.id)).desc(), PatientRecord.source.asc())
    )

    rows = result.all()
    total_patients = sum(int(patient_count) for _, patient_count, _ in rows)

    return [
        {
            "source": source,
            "patient_count": int(patient_count),
            "revenue_cents": int(revenue_cents),
            "share_pct": round((int(patient_count) / total_patients) * 100, 1) if total_patients else 0.0,
        }
        for source, patient_count, revenue_cents in rows
    ]


async def get_popular_services(session: AsyncSession, *, limit: int = 5) -> list[dict[str, object]]:
    result = await session.execute(
        select(
            AppointmentServiceRecord.service_id,
            ServiceRecord.name,
            func.count(distinct(AppointmentServiceRecord.appointment_id)).label("appointment_count"),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).label("revenue_cents"),
        )
        .select_from(AppointmentServiceRecord)
        .join(ServiceRecord, ServiceRecord.id == AppointmentServiceRecord.service_id)
        .outerjoin(
            PaymentRecord,
            (PaymentRecord.service_id == AppointmentServiceRecord.service_id)
            & (PaymentRecord.appointment_id == AppointmentServiceRecord.appointment_id),
        )
        .group_by(AppointmentServiceRecord.service_id, ServiceRecord.name)
        .order_by(
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).desc(),
            func.count(distinct(AppointmentServiceRecord.appointment_id)).desc(),
            ServiceRecord.name.asc(),
        )
        .limit(limit)
    )

    return [
        {
            "service_id": service_id,
            "name": name,
            "appointment_count": int(appointment_count),
            "revenue_cents": int(revenue_cents),
        }
        for service_id, name, appointment_count, revenue_cents in result.all()
    ]


async def get_busiest_providers(session: AsyncSession, *, limit: int = 5) -> list[dict[str, object]]:
    provider_name = func.concat(ProviderRecord.first_name, literal(" "), ProviderRecord.last_name)
    result = await session.execute(
        select(
            AppointmentServiceRecord.provider_id,
            provider_name.label("name"),
            func.count(distinct(AppointmentServiceRecord.appointment_id)).label("appointment_count"),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).label("revenue_cents"),
        )
        .select_from(AppointmentServiceRecord)
        .join(ProviderRecord, ProviderRecord.id == AppointmentServiceRecord.provider_id)
        .outerjoin(
            PaymentRecord,
            (PaymentRecord.provider_id == AppointmentServiceRecord.provider_id)
            & (PaymentRecord.appointment_id == AppointmentServiceRecord.appointment_id),
        )
        .group_by(AppointmentServiceRecord.provider_id, ProviderRecord.first_name, ProviderRecord.last_name)
        .order_by(
            func.count(distinct(AppointmentServiceRecord.appointment_id)).desc(),
            func.coalesce(
                func.sum(case((PaymentRecord.status == "paid", PaymentRecord.amount), else_=0)),
                0,
            ).desc(),
            ProviderRecord.last_name.asc(),
            ProviderRecord.first_name.asc(),
        )
        .limit(limit)
    )

    return [
        {
            "provider_id": provider_id,
            "name": name,
            "appointment_count": int(appointment_count),
            "revenue_cents": int(revenue_cents),
        }
        for provider_id, name, appointment_count, revenue_cents in result.all()
    ]


async def get_appointment_status_mix(session: AsyncSession) -> list[dict[str, object]]:
    result = await session.execute(
        select(
            AppointmentRecord.status,
            func.count().label("count"),
        )
        .group_by(AppointmentRecord.status)
        .order_by(func.count().desc(), AppointmentRecord.status.asc())
    )

    return [
        {"status": status, "count": int(count)}
        for status, count in result.all()
    ]


async def get_summary_metrics(session: AsyncSession) -> dict[str, object]:
    overview = await get_overview_metrics(session)
    revenue_trend = await get_revenue_trend(session)
    patient_sources = await get_patient_acquisition_breakdown(session)
    top_services = await get_popular_services(session)
    busiest_providers = await get_busiest_providers(session)
    appointment_status_mix = await get_appointment_status_mix(session)

    return {
        "overview": overview,
        "revenue_trend": revenue_trend,
        "patient_sources": patient_sources,
        "top_services": top_services,
        "busiest_providers": busiest_providers,
        "appointment_status_mix": appointment_status_mix,
    }
