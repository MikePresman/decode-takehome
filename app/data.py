from __future__ import annotations

import json
from collections import Counter
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from statistics import mean

from models import Appointment, AppointmentService, Patient, Payment, Provider, Service


@dataclass(frozen=True)
class DataStore:
    patients: list[Patient]
    appointments: list[Appointment]
    appointment_services: list[AppointmentService]
    payments: list[Payment]
    providers: list[Provider]
    services: list[Service]


ROOT = Path(__file__).resolve().parent.parent
SEED_DIR = ROOT / "seed_data"


def _load_records(filename: str, model: type) -> list:
    path = SEED_DIR / filename
    with path.open() as handle:
        rows = json.load(handle)
    return [model(**row) for row in rows]


@lru_cache(maxsize=1)
def load_data() -> DataStore:
    return DataStore(
        patients=_load_records("patient.json", Patient),
        appointments=_load_records("appointment.json", Appointment),
        appointment_services=_load_records("appointment_service.json", AppointmentService),
        payments=_load_records("payment.json", Payment),
        providers=_load_records("provider.json", Provider),
        services=_load_records("service.json", Service),
    )


def patient_rows() -> list[dict[str, object]]:
    store = load_data()
    appointments_by_patient = Counter(item.patient_id for item in store.appointments)
    paid_by_patient = Counter()
    total_paid_by_patient = Counter()

    for payment in store.payments:
        if payment.status == "paid":
            paid_by_patient[payment.patient_id] += 1
            total_paid_by_patient[payment.patient_id] += payment.amount

    rows = []
    for patient in store.patients:
        rows.append(
            {
                "id": patient.id,
                "first_name": patient.first_name,
                "last_name": patient.last_name,
                "full_name": f"{patient.first_name} {patient.last_name}",
                "email": patient.email,
                "phone": patient.phone,
                "source": patient.source,
                "gender": patient.gender,
                "created_date": patient.created_date.isoformat(),
                "appointment_count": appointments_by_patient[patient.id],
                "paid_appointment_count": paid_by_patient[patient.id],
                "lifetime_value_cents": total_paid_by_patient[patient.id],
            }
        )
    return rows


def summary_metrics() -> dict[str, object]:
    store = load_data()
    paid_payments = [payment for payment in store.payments if payment.status == "paid"]
    source_counts = Counter(patient.source for patient in store.patients)
    service_counts = Counter(item.service_id for item in store.appointment_services)
    provider_counts = Counter(item.provider_id for item in store.appointment_services)
    service_names = {service.id: service.name for service in store.services}
    provider_names = {
        provider.id: f"{provider.first_name} {provider.last_name}"
        for provider in store.providers
    }

    return {
        "totals": {
            "patients": len(store.patients),
            "appointments": len(store.appointments),
            "providers": len(store.providers),
            "services": len(store.services),
            "paid_revenue_cents": sum(payment.amount for payment in paid_payments),
            "avg_paid_ticket_cents": round(mean(payment.amount for payment in paid_payments))
            if paid_payments
            else 0,
        },
        "patient_sources": dict(source_counts.most_common()),
        "top_services": [
            {"service_id": service_id, "name": service_names.get(service_id, service_id), "count": count}
            for service_id, count in service_counts.most_common(5)
        ],
        "busiest_providers": [
            {
                "provider_id": provider_id,
                "name": provider_names.get(provider_id, provider_id),
                "count": count,
            }
            for provider_id, count in provider_counts.most_common(5)
        ],
    }
