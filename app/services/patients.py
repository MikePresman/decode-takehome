from __future__ import annotations

from datetime import date, datetime

from fastapi import HTTPException
from sqlalchemy import case, distinct, func, literal, or_, select
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
NEW_PATIENT_MAX_APPOINTMENTS = 1

PATIENT_SORT_COLUMNS = {
    "created_date": "created_date",
    "full_name": "full_name",
    "lifetime_value_cents": "lifetime_value_cents",
    "appointment_count": "appointment_count",
    "last_appointment_date": "last_appointment_date",
}


def _as_date(value: date | datetime | None) -> date | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.date()
    return value


def _days_since(value: date | datetime | None) -> int | None:
    if value is None:
        return None
    normalized = _as_date(value)
    if normalized is None:
        return None
    return (date.today() - normalized).days


def _derive_status(
    *,
    created_date: date,
    appointment_count: int,
    paid_appointment_count: int,
    last_appointment_date: date | None,
) -> str:
    days_since_last_appointment = _days_since(last_appointment_date)
    days_since_created = _days_since(created_date)

    if appointment_count > 0 and paid_appointment_count == 0:
        return "never_paid"

    if days_since_created is not None and days_since_created <= NEW_PATIENT_WINDOW_DAYS and appointment_count <= NEW_PATIENT_MAX_APPOINTMENTS:
        return "new"

    if days_since_last_appointment is not None and days_since_last_appointment <= ACTIVE_WINDOW_DAYS:
        return "active"

    return "inactive"


def _patient_listing_query():
    appointment_counts = (
        select(
            AppointmentRecord.patient_id.label("patient_id"),
            func.count().label("appointment_count"),
            func.max(AppointmentRecord.created_date).label("last_appointment_date"),
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
            func.max(case((PaymentRecord.status == "paid", PaymentRecord.date), else_=None)).label("last_paid_date"),
        )
        .group_by(PaymentRecord.patient_id)
        .subquery()
    )

    provider_ranked = (
        select(
            AppointmentRecord.patient_id.label("patient_id"),
            func.concat(ProviderRecord.first_name, literal(" "), ProviderRecord.last_name).label("provider_name"),
            func.row_number()
            .over(
                partition_by=AppointmentRecord.patient_id,
                order_by=(
                    func.count().desc(),
                    ProviderRecord.last_name.asc(),
                    ProviderRecord.first_name.asc(),
                ),
            )
            .label("provider_rank"),
        )
        .select_from(AppointmentServiceRecord)
        .join(AppointmentRecord, AppointmentRecord.id == AppointmentServiceRecord.appointment_id)
        .join(ProviderRecord, ProviderRecord.id == AppointmentServiceRecord.provider_id)
        .group_by(
            AppointmentRecord.patient_id,
            ProviderRecord.id,
            ProviderRecord.first_name,
            ProviderRecord.last_name,
        )
        .subquery()
    )

    preferred_providers = (
        select(
            provider_ranked.c.patient_id,
            provider_ranked.c.provider_name.label("preferred_provider_name"),
        )
        .where(provider_ranked.c.provider_rank == 1)
        .subquery()
    )

    service_ranked = (
        select(
            AppointmentRecord.patient_id.label("patient_id"),
            ServiceRecord.name.label("service_name"),
            func.row_number()
            .over(
                partition_by=AppointmentRecord.patient_id,
                order_by=(func.count().desc(), ServiceRecord.name.asc()),
            )
            .label("service_rank"),
        )
        .select_from(AppointmentServiceRecord)
        .join(AppointmentRecord, AppointmentRecord.id == AppointmentServiceRecord.appointment_id)
        .join(ServiceRecord, ServiceRecord.id == AppointmentServiceRecord.service_id)
        .group_by(AppointmentRecord.patient_id, ServiceRecord.id, ServiceRecord.name)
        .subquery()
    )

    top_services = (
        select(
            service_ranked.c.patient_id,
            service_ranked.c.service_name.label("top_service_name"),
        )
        .where(service_ranked.c.service_rank == 1)
        .subquery()
    )

    return (
        select(
            PatientRecord.id.label("id"),
            PatientRecord.first_name.label("first_name"),
            PatientRecord.last_name.label("last_name"),
            func.concat(PatientRecord.first_name, literal(" "), PatientRecord.last_name).label("full_name"),
            PatientRecord.email.label("email"),
            PatientRecord.phone.label("phone"),
            PatientRecord.address.label("address"),
            PatientRecord.date_of_birth.label("date_of_birth"),
            PatientRecord.source.label("source"),
            PatientRecord.gender.label("gender"),
            PatientRecord.created_date.label("created_date"),
            func.coalesce(appointment_counts.c.appointment_count, 0).label("appointment_count"),
            func.coalesce(payment_aggregates.c.paid_appointment_count, 0).label("paid_appointment_count"),
            func.coalesce(payment_aggregates.c.lifetime_value_cents, 0).label("lifetime_value_cents"),
            appointment_counts.c.last_appointment_date.label("last_appointment_date"),
            payment_aggregates.c.last_paid_date.label("last_paid_date"),
            preferred_providers.c.preferred_provider_name.label("preferred_provider_name"),
            top_services.c.top_service_name.label("top_service_name"),
        )
        .select_from(PatientRecord)
        .outerjoin(appointment_counts, appointment_counts.c.patient_id == PatientRecord.id)
        .outerjoin(payment_aggregates, payment_aggregates.c.patient_id == PatientRecord.id)
        .outerjoin(preferred_providers, preferred_providers.c.patient_id == PatientRecord.id)
        .outerjoin(top_services, top_services.c.patient_id == PatientRecord.id)
    )


def _serialize_patient_row(row: dict[str, object]) -> dict[str, object]:
    created_date = row["created_date"]
    last_appointment_date = row["last_appointment_date"]
    last_paid_date = row["last_paid_date"]

    normalized_created_date = _as_date(created_date if isinstance(created_date, (date, datetime)) else None)
    normalized_last_appointment_date = _as_date(
        last_appointment_date if isinstance(last_appointment_date, (date, datetime)) else None
    )
    normalized_last_paid_date = _as_date(last_paid_date if isinstance(last_paid_date, (date, datetime)) else None)

    if normalized_created_date is None:
        raise TypeError("created_date must be a date")

    return {
        **row,
        "created_date": created_date.isoformat(),
        "date_of_birth": row["date_of_birth"].isoformat() if row["date_of_birth"] is not None else None,
        "last_appointment_date": last_appointment_date.isoformat()
        if isinstance(last_appointment_date, (date, datetime))
        else None,
        "last_paid_date": last_paid_date.isoformat() if isinstance(last_paid_date, (date, datetime)) else None,
        "days_since_last_appointment": _days_since(normalized_last_appointment_date),
        "status": _derive_status(
            created_date=normalized_created_date,
            appointment_count=int(row["appointment_count"]),
            paid_appointment_count=int(row["paid_appointment_count"]),
            last_appointment_date=normalized_last_appointment_date,
        ),
    }


async def get_patient_rows(
    session: AsyncSession,
    *,
    q: str | None,
    source: str | None,
    status: str | None,
    gender: str | None,
    has_payments: bool | None,
    sort: str,
    order: str,
    limit: int,
    offset: int,
) -> dict[str, object]:
    base_query = _patient_listing_query()

    if q:
        needle = f"%{q.lower()}%"
        full_name = func.lower(func.concat(PatientRecord.first_name, literal(" "), PatientRecord.last_name))
        base_query = base_query.where(
            or_(
                full_name.like(needle),
                func.lower(PatientRecord.email).like(needle),
                func.lower(PatientRecord.phone).like(needle),
            )
        )

    if source:
        base_query = base_query.where(PatientRecord.source == source)

    if gender:
        base_query = base_query.where(PatientRecord.gender == gender)

    rows_subquery = base_query.subquery()
    total_result = await session.execute(select(rows_subquery))
    all_items = [_serialize_patient_row(dict(row)) for row in total_result.mappings()]

    if has_payments is True:
        all_items = [item for item in all_items if item["paid_appointment_count"] > 0]
    elif has_payments is False:
        all_items = [item for item in all_items if item["paid_appointment_count"] == 0]

    if status:
        all_items = [item for item in all_items if item["status"] == status]

    all_items.sort(
        key=lambda item: (item[sort] is None, item[sort], item["id"]),
        reverse=order == "desc",
    )

    return {
        "total": len(all_items),
        "limit": limit,
        "offset": offset,
        "items": all_items[offset : offset + limit],
    }


async def get_patient_detail(session: AsyncSession, patient_id: str) -> dict[str, object]:
    listing_query = _patient_listing_query().where(PatientRecord.id == patient_id)
    listing_result = await session.execute(listing_query)
    row = listing_result.mappings().first()

    if row is None:
        raise HTTPException(status_code=404, detail="Patient not found")

    patient = _serialize_patient_row(dict(row))

    top_services_result = await session.execute(
        select(
            AppointmentServiceRecord.service_id,
            ServiceRecord.name,
            func.count().label("count"),
        )
        .join(AppointmentRecord, AppointmentRecord.id == AppointmentServiceRecord.appointment_id)
        .join(ServiceRecord, ServiceRecord.id == AppointmentServiceRecord.service_id)
        .where(AppointmentRecord.patient_id == patient_id)
        .group_by(AppointmentServiceRecord.service_id, ServiceRecord.name)
        .order_by(func.count().desc(), ServiceRecord.name.asc())
        .limit(5)
    )

    top_providers_result = await session.execute(
        select(
            AppointmentServiceRecord.provider_id,
            func.concat(ProviderRecord.first_name, literal(" "), ProviderRecord.last_name).label("name"),
            func.count().label("count"),
        )
        .join(AppointmentRecord, AppointmentRecord.id == AppointmentServiceRecord.appointment_id)
        .join(ProviderRecord, ProviderRecord.id == AppointmentServiceRecord.provider_id)
        .where(AppointmentRecord.patient_id == patient_id)
        .group_by(AppointmentServiceRecord.provider_id, ProviderRecord.first_name, ProviderRecord.last_name)
        .order_by(func.count().desc(), ProviderRecord.last_name.asc(), ProviderRecord.first_name.asc())
        .limit(5)
    )

    recent_payments_result = await session.execute(
        select(
            PaymentRecord.id,
            PaymentRecord.amount,
            PaymentRecord.date,
            PaymentRecord.method,
            PaymentRecord.status,
            PaymentRecord.service_id,
            PaymentRecord.provider_id,
            ServiceRecord.name.label("service_name"),
            func.concat(ProviderRecord.first_name, literal(" "), ProviderRecord.last_name).label("provider_name"),
        )
        .join(ServiceRecord, ServiceRecord.id == PaymentRecord.service_id)
        .join(ProviderRecord, ProviderRecord.id == PaymentRecord.provider_id)
        .where(PaymentRecord.patient_id == patient_id)
        .order_by(PaymentRecord.date.desc(), PaymentRecord.id.desc())
        .limit(10)
    )

    recent_appointments_result = await session.execute(
        select(
            AppointmentRecord.id,
            AppointmentRecord.created_date,
            AppointmentRecord.status,
        )
        .where(AppointmentRecord.patient_id == patient_id)
        .order_by(AppointmentRecord.created_date.desc(), AppointmentRecord.id.desc())
        .limit(10)
    )

    appointment_status_counts_result = await session.execute(
        select(
            AppointmentRecord.status,
            func.count().label("count"),
        )
        .where(AppointmentRecord.patient_id == patient_id)
        .group_by(AppointmentRecord.status)
    )

    recent_appointment_rows = [
        {
            "id": appointment_id,
            "created_date": created_date.isoformat(),
            "status": appointment_status,
        }
        for appointment_id, created_date, appointment_status in recent_appointments_result.all()
    ]

    appointment_ids = [row["id"] for row in recent_appointment_rows]
    appointment_context_by_id: dict[str, dict[str, list[str]]] = {
        appointment_id: {"service_names": [], "provider_names": []}
        for appointment_id in appointment_ids
    }

    if appointment_ids:
        appointment_context_result = await session.execute(
            select(
                AppointmentServiceRecord.appointment_id,
                ServiceRecord.name.label("service_name"),
                func.concat(ProviderRecord.first_name, literal(" "), ProviderRecord.last_name).label("provider_name"),
            )
            .join(ServiceRecord, ServiceRecord.id == AppointmentServiceRecord.service_id)
            .join(ProviderRecord, ProviderRecord.id == AppointmentServiceRecord.provider_id)
            .where(AppointmentServiceRecord.appointment_id.in_(appointment_ids))
            .order_by(AppointmentServiceRecord.appointment_id, ServiceRecord.name.asc(), ProviderRecord.last_name.asc())
        )

        for appointment_id, service_name, provider_name in appointment_context_result.all():
            context = appointment_context_by_id[appointment_id]
            if service_name not in context["service_names"]:
                context["service_names"].append(service_name)
            if provider_name not in context["provider_names"]:
                context["provider_names"].append(provider_name)

    appointment_status_counts = {
        status: count for status, count in appointment_status_counts_result.all()
    }
    cancelled_appointment_count = int(appointment_status_counts.get("cancelled", 0))
    no_show_appointment_count = int(appointment_status_counts.get("no_show", 0))
    completed_appointment_count = int(appointment_status_counts.get("completed", 0))
    unpaid_appointment_count = max(int(patient["appointment_count"]) - int(patient["paid_appointment_count"]), 0)
    last_payment_method = None
    recent_payment_rows = []

    for payment_id, amount, payment_date, method, payment_status, service_id, provider_id, service_name, provider_name in recent_payments_result.all():
        recent_payment_rows.append(
            {
                "id": payment_id,
                "amount": amount,
                "date": payment_date.isoformat(),
                "method": method,
                "status": payment_status,
                "service_id": service_id,
                "service_name": service_name,
                "provider_id": provider_id,
                "provider_name": provider_name,
            }
        )
        if last_payment_method is None and payment_status == "paid":
            last_payment_method = method

    recent_appointment_rows = [
        {
            **row,
            "service_names": appointment_context_by_id[row["id"]]["service_names"],
            "provider_names": appointment_context_by_id[row["id"]]["provider_names"],
        }
        for row in recent_appointment_rows
    ]

    return {
        "patient": {
            "id": patient["id"],
            "first_name": patient["first_name"],
            "last_name": patient["last_name"],
            "full_name": patient["full_name"],
            "email": patient["email"],
            "phone": patient["phone"],
            "address": patient["address"],
            "date_of_birth": patient["date_of_birth"],
            "gender": patient["gender"],
            "source": patient["source"],
            "created_date": patient["created_date"],
        },
        "summary": {
            "appointment_count": patient["appointment_count"],
            "completed_appointment_count": completed_appointment_count,
            "cancelled_appointment_count": cancelled_appointment_count,
            "no_show_appointment_count": no_show_appointment_count,
            "paid_appointment_count": patient["paid_appointment_count"],
            "unpaid_appointment_count": unpaid_appointment_count,
            "lifetime_value_cents": patient["lifetime_value_cents"],
            "last_appointment_date": patient["last_appointment_date"],
            "last_paid_date": patient["last_paid_date"],
            "days_since_last_appointment": patient["days_since_last_appointment"],
            "days_since_last_payment": _days_since(
                row["last_paid_date"] if isinstance(row["last_paid_date"], (date, datetime)) else None
            ),
            "last_payment_method": last_payment_method,
            "preferred_provider_name": patient["preferred_provider_name"],
            "top_service_name": patient["top_service_name"],
            "status": patient["status"],
        },
        "top_services": [
            {"service_id": service_id, "name": name, "count": count}
            for service_id, name, count in top_services_result.all()
        ],
        "top_providers": [
            {"provider_id": provider_id, "name": name, "count": count}
            for provider_id, name, count in top_providers_result.all()
        ],
        "recent_payments": recent_payment_rows,
        "recent_appointments": recent_appointment_rows,
    }
