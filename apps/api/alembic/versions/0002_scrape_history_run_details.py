"""Add scrape history run details.

Revision ID: 0002_scrape_history_run_details
Revises: 0001_initial_schema
Create Date: 2026-06-29
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_scrape_history_run_details"
down_revision: Union[str, None] = "0001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "scrape_history",
        sa.Column("run_id", sa.String(length=64), nullable=True),
    )
    op.add_column(
        "scrape_history",
        sa.Column("trigger_source", sa.String(length=50), nullable=True),
    )
    op.add_column(
        "scrape_history",
        sa.Column("triggered_by", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "scrape_history",
        sa.Column("duration_seconds", sa.Float(), nullable=True),
    )
    op.add_column(
        "scrape_history",
        sa.Column("details_json", sa.JSON(), nullable=True),
    )
    op.create_index(
        "ix_scrape_history_run_id",
        "scrape_history",
        ["run_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_scrape_history_run_id", table_name="scrape_history")
    op.drop_column("scrape_history", "details_json")
    op.drop_column("scrape_history", "duration_seconds")
    op.drop_column("scrape_history", "triggered_by")
    op.drop_column("scrape_history", "trigger_source")
    op.drop_column("scrape_history", "run_id")
