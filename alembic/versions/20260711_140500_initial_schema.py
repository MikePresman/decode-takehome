"""initial schema

Revision ID: 20260711_140500
Revises:
Create Date: 2026-07-11 14:05:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260711_140500"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "patients",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=False),
        sa.Column("date_of_birth", sa.DateTime(timezone=False), nullable=False),
        sa.Column("gender", sa.Text(), nullable=False),
        sa.Column("address", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("source", sa.Text(), nullable=False),
        sa.Column("created_date", sa.DateTime(timezone=False), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "providers",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("first_name", sa.Text(), nullable=False),
        sa.Column("last_name", sa.Text(), nullable=False),
        sa.Column("email", sa.Text(), nullable=False),
        sa.Column("phone", sa.Text(), nullable=False),
        sa.Column("created_date", sa.DateTime(timezone=False), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "services",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("name", sa.Text(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("price", sa.Integer(), nullable=False),
        sa.Column("duration", sa.Integer(), nullable=False),
        sa.Column("created_date", sa.DateTime(timezone=False), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "appointments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("patient_id", sa.String(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("created_date", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_appointments_patient_id"), "appointments", ["patient_id"], unique=False)
    op.create_table(
        "appointment_services",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("appointment_id", sa.String(), nullable=False),
        sa.Column("service_id", sa.String(), nullable=False),
        sa.Column("provider_id", sa.String(), nullable=False),
        sa.Column("start", sa.DateTime(timezone=False), nullable=False),
        sa.Column("end", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "appointment_id",
            "service_id",
            "provider_id",
            "start",
            name="uq_appointment_services_natural_key",
        ),
    )
    op.create_index(
        op.f("ix_appointment_services_appointment_id"),
        "appointment_services",
        ["appointment_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_services_provider_id"),
        "appointment_services",
        ["provider_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_appointment_services_service_id"),
        "appointment_services",
        ["service_id"],
        unique=False,
    )
    op.create_table(
        "payments",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("patient_id", sa.String(), nullable=False),
        sa.Column("amount", sa.Integer(), nullable=False),
        sa.Column("date", sa.DateTime(timezone=False), nullable=False),
        sa.Column("method", sa.Text(), nullable=False),
        sa.Column("status", sa.Text(), nullable=False),
        sa.Column("provider_id", sa.String(), nullable=False),
        sa.Column("appointment_id", sa.String(), nullable=False),
        sa.Column("service_id", sa.String(), nullable=False),
        sa.Column("created_date", sa.DateTime(timezone=False), nullable=False),
        sa.ForeignKeyConstraint(["appointment_id"], ["appointments.id"]),
        sa.ForeignKeyConstraint(["patient_id"], ["patients.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"]),
        sa.ForeignKeyConstraint(["service_id"], ["services.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_payments_appointment_id"), "payments", ["appointment_id"], unique=False)
    op.create_index(op.f("ix_payments_patient_id"), "payments", ["patient_id"], unique=False)
    op.create_index(op.f("ix_payments_status"), "payments", ["status"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_payments_status"), table_name="payments")
    op.drop_index(op.f("ix_payments_patient_id"), table_name="payments")
    op.drop_index(op.f("ix_payments_appointment_id"), table_name="payments")
    op.drop_table("payments")
    op.drop_index(op.f("ix_appointment_services_service_id"), table_name="appointment_services")
    op.drop_index(op.f("ix_appointment_services_provider_id"), table_name="appointment_services")
    op.drop_index(op.f("ix_appointment_services_appointment_id"), table_name="appointment_services")
    op.drop_table("appointment_services")
    op.drop_index(op.f("ix_appointments_patient_id"), table_name="appointments")
    op.drop_table("appointments")
    op.drop_table("services")
    op.drop_table("providers")
    op.drop_table("patients")

