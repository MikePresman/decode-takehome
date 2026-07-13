from __future__ import annotations

from httpx import AsyncClient

import app.main


async def test_healthcheck(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_summary_uses_async_service(monkeypatch, client: AsyncClient) -> None:
    async def fake_summary(_session):
        return {
            "overview": {
                "total_patients": 4000,
                "total_appointments": 8200,
                "total_providers": 12,
                "total_services": 18,
                "total_revenue_cents": 12500000,
                "collection_rate_pct": 82.4,
                "avg_revenue_per_patient_cents": 3125,
                "avg_appointment_value_cents": 18400,
                "active_patients": 1274,
                "new_patients_30d": 48,
            },
            "revenue_trend": [{"period": "2026-01", "revenue_cents": 1200000, "appointment_count": 92}],
            "patient_sources": [{"source": "google", "patient_count": 640, "revenue_cents": 1800000, "share_pct": 38.0}],
            "top_services": [{"service_id": "svc_1", "name": "Botox", "appointment_count": 220, "revenue_cents": 4200000}],
            "busiest_providers": [{"provider_id": "prv_1", "name": "Dr. Smith", "appointment_count": 180, "revenue_cents": 3100000}],
            "appointment_status_mix": [{"status": "completed", "count": 520}],
        }

    monkeypatch.setattr(app.main, "get_summary_metrics", fake_summary)

    response = await client.get("/api/summary")

    assert response.status_code == 200
    payload = response.json()
    assert payload["overview"]["total_patients"] == 4000
    assert payload["revenue_trend"][0]["period"] == "2026-01"
    assert payload["patient_sources"][0]["source"] == "google"


async def test_metadata_uses_async_service(monkeypatch, client: AsyncClient) -> None:
    async def fake_metadata(_session):
        return {"sources": ["google", "instagram"], "service_count": 10, "provider_count": 10}

    monkeypatch.setattr(app.main, "get_metadata", fake_metadata)

    response = await client.get("/api/metadata")

    assert response.status_code == 200
    assert response.json()["sources"] == ["google", "instagram"]
