from __future__ import annotations

from fastapi import FastAPI, Query

from app.data import load_data, patient_rows, summary_metrics


app = FastAPI(
    title="Beauty Med Spa Dashboard API",
    version="0.1.0",
    description="Minimal API surface prepared for Railway deployment.",
)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/summary")
async def get_summary() -> dict[str, object]:
    return summary_metrics()


@app.get("/api/patients")
async def get_patients(
    q: str | None = Query(default=None, description="Search by name, email, or phone."),
    source: str | None = Query(default=None, description="Filter by acquisition source."),
    sort: str = Query(default="created_date", pattern="^(created_date|full_name|lifetime_value_cents|appointment_count)$"),
    order: str = Query(default="desc", pattern="^(asc|desc)$"),
    limit: int = Query(default=50, ge=1, le=250),
    offset: int = Query(default=0, ge=0),
) -> dict[str, object]:
    rows = patient_rows()

    if q:
        needle = q.lower()
        rows = [
            row
            for row in rows
            if needle in str(row["full_name"]).lower()
            or needle in str(row["email"]).lower()
            or needle in str(row["phone"]).lower()
        ]

    if source:
        rows = [row for row in rows if row["source"] == source]

    reverse = order == "desc"
    rows.sort(key=lambda row: row[sort], reverse=reverse)

    return {
        "total": len(rows),
        "limit": limit,
        "offset": offset,
        "items": rows[offset : offset + limit],
    }


@app.get("/api/metadata")
async def get_metadata() -> dict[str, object]:
    store = load_data()
    return {
        "sources": sorted({patient.source for patient in store.patients}),
        "service_count": len(store.services),
        "provider_count": len(store.providers),
    }
