from __future__ import annotations

from httpx import AsyncClient

import app.main


async def test_patients_supports_extended_query_params(monkeypatch, client: AsyncClient) -> None:
    captured: dict[str, object] = {}

    async def fake_patients(session, **kwargs):
        captured["session"] = session
        captured.update(kwargs)
        return {
            "total": 1,
            "limit": kwargs["limit"],
            "offset": kwargs["offset"],
            "items": [{"id": "pat_123", "full_name": "Pat Example", "status": "active"}],
        }

    monkeypatch.setattr(app.main, "get_patient_rows", fake_patients)

    response = await client.get(
        "/api/patients",
        params={
            "q": "smith",
            "source": "instagram",
            "status": "active",
            "gender": "female",
            "has_payments": "true",
            "sort": "last_appointment_date",
            "order": "asc",
            "limit": 10,
            "offset": 20,
        },
    )

    assert response.status_code == 200
    assert response.json()["items"][0]["status"] == "active"
    assert captured["q"] == "smith"
    assert captured["source"] == "instagram"
    assert captured["status"] == "active"
    assert captured["gender"] == "female"
    assert captured["has_payments"] is True
    assert captured["sort"] == "last_appointment_date"
    assert captured["order"] == "asc"
    assert captured["limit"] == 10
    assert captured["offset"] == 20


async def test_patient_detail_route(monkeypatch, client: AsyncClient) -> None:
    async def fake_detail(_session, patient_id: str):
        return {
            "patient": {"id": patient_id, "full_name": "Pat Example"},
            "summary": {
                "lifetime_value_cents": 12345,
                "status": "active",
                "unpaid_appointment_count": 1,
                "cancelled_appointment_count": 0,
                "no_show_appointment_count": 0,
            },
            "top_services": [],
            "top_providers": [],
            "recent_payments": [],
            "recent_appointments": [],
        }

    monkeypatch.setattr(app.main, "get_patient_detail", fake_detail)

    response = await client.get("/api/patients/pat_123")

    assert response.status_code == 200
    assert response.json()["patient"]["id"] == "pat_123"
    assert response.json()["summary"]["status"] == "active"
    assert response.json()["summary"]["unpaid_appointment_count"] == 1
