from __future__ import annotations

from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class PatientRecord(Base):
    __tablename__ = "patients"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    date_of_birth: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    gender: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(Text, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    appointments: Mapped[list["AppointmentRecord"]] = relationship(back_populates="patient")
    payments: Mapped[list["PaymentRecord"]] = relationship(back_populates="patient")


class ProviderRecord(Base):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    first_name: Mapped[str] = mapped_column(Text, nullable=False)
    last_name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    phone: Mapped[str] = mapped_column(Text, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    appointment_services: Mapped[list["AppointmentServiceRecord"]] = relationship(back_populates="provider")
    payments: Mapped[list["PaymentRecord"]] = relationship(back_populates="provider")


class ServiceRecord(Base):
    __tablename__ = "services"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    duration: Mapped[int] = mapped_column(Integer, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    appointment_services: Mapped[list["AppointmentServiceRecord"]] = relationship(back_populates="service")
    payments: Mapped[list["PaymentRecord"]] = relationship(back_populates="service")


class AppointmentRecord(Base):
    __tablename__ = "appointments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False, index=True)
    status: Mapped[str] = mapped_column(Text, nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    patient: Mapped["PatientRecord"] = relationship(back_populates="appointments")
    appointment_services: Mapped[list["AppointmentServiceRecord"]] = relationship(back_populates="appointment")
    payments: Mapped[list["PaymentRecord"]] = relationship(back_populates="appointment")


class AppointmentServiceRecord(Base):
    __tablename__ = "appointment_services"
    __table_args__ = (
        UniqueConstraint(
            "appointment_id",
            "service_id",
            "provider_id",
            "start",
            name="uq_appointment_services_natural_key",
        ),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), nullable=False, index=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("providers.id"), nullable=False, index=True)
    start: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    end: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    appointment: Mapped["AppointmentRecord"] = relationship(back_populates="appointment_services")
    service: Mapped["ServiceRecord"] = relationship(back_populates="appointment_services")
    provider: Mapped["ProviderRecord"] = relationship(back_populates="appointment_services")


class PaymentRecord(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    patient_id: Mapped[str] = mapped_column(ForeignKey("patients.id"), nullable=False, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)
    method: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(ForeignKey("providers.id"), nullable=False)
    appointment_id: Mapped[str] = mapped_column(ForeignKey("appointments.id"), nullable=False, index=True)
    service_id: Mapped[str] = mapped_column(ForeignKey("services.id"), nullable=False)
    created_date: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False)

    patient: Mapped["PatientRecord"] = relationship(back_populates="payments")
    provider: Mapped["ProviderRecord"] = relationship(back_populates="payments")
    appointment: Mapped["AppointmentRecord"] = relationship(back_populates="payments")
    service: Mapped["ServiceRecord"] = relationship(back_populates="payments")

