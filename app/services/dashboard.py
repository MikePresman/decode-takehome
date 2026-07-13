from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import PatientRecord, ProviderRecord, ServiceRecord


async def get_metadata(session: AsyncSession) -> dict[str, object]:
    source_rows = await session.scalars(select(PatientRecord.source).distinct().order_by(PatientRecord.source.asc()))
    service_count = await session.scalar(select(func.count()).select_from(ServiceRecord))
    provider_count = await session.scalar(select(func.count()).select_from(ProviderRecord))

    return {
        "sources": list(source_rows),
        "service_count": int(service_count or 0),
        "provider_count": int(provider_count or 0),
    }
