from __future__ import annotations

from fastapi import Depends, FastAPI, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.dependencies import get_db_session
from app.services.analytics import get_summary_metrics
from app.services.dashboard import get_metadata
from app.services.patients import get_patient_detail, get_patient_rows


app = FastAPI(
    title="Beauty Med Spa Dashboard API",
    version="0.1.0",
    description="Minimal API surface prepared for Railway deployment.",
)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/summary")
async def get_summary(session: AsyncSession = Depends(get_db_session)) -> dict[str, object]:
    return await get_summary_metrics(session)


@app.get("/api/patients")
async def get_patients(
    q: str | None = Query(default=None, description="Search by name, email, or phone."),
    source: str | None = Query(default=None, description="Filter by acquisition source."),
    status: str | None = Query(default=None, description="Filter by operational patient status."),
    gender: str | None = Query(default=None, description="Filter by patient gender."),
    has_payments: bool | None = Query(default=None, description="Filter by whether the patient has any paid appointments."),
    sort: str = Query(
        default="created_date",
        pattern="^(created_date|full_name|lifetime_value_cents|appointment_count|last_appointment_date)$",
    ),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=50, ge=1, le=250),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_db_session),
) -> dict[str, object]:
    return await get_patient_rows(
        session,
        q=q,
        source=source,
        status=status,
        gender=gender,
        has_payments=has_payments,
        sort=sort,
        order=order,
        limit=limit,
        offset=offset,
    )


@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str, session: AsyncSession = Depends(get_db_session)) -> dict[str, object]:
    return await get_patient_detail(session, patient_id)


@app.get("/api/metadata")
async def metadata(session: AsyncSession = Depends(get_db_session)) -> dict[str, object]:
    return await get_metadata(session)
