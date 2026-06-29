"""Initial schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-06-28
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "companies",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ticker", sa.String(length=20), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cik", sa.String(length=50), nullable=True),
        sa.Column("cusip", sa.String(length=20), nullable=True),
        sa.Column("sector", sa.String(length=100), nullable=True),
        sa.Column("industry", sa.String(length=150), nullable=True),
        sa.Column("exchange", sa.String(length=50), nullable=True),
        sa.Column("market_cap", sa.BigInteger(), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_companies_cik", "companies", ["cik"], unique=False)
    op.create_index("ix_companies_cusip", "companies", ["cusip"], unique=True)
    op.create_index("ix_companies_id", "companies", ["id"], unique=False)
    op.create_index("ix_companies_ticker", "companies", ["ticker"], unique=True)

    op.create_table(
        "funds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("cik", sa.String(length=50), nullable=True),
        sa.Column("manager_name", sa.String(length=255), nullable=True),
        sa.Column("fund_type", sa.String(length=100), nullable=True),
        sa.Column("website", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_funds_cik", "funds", ["cik"], unique=False)
    op.create_index("ix_funds_id", "funds", ["id"], unique=False)
    op.create_index("ix_funds_name", "funds", ["name"], unique=False)

    op.create_table(
        "processed_filings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("source_type", sa.String(length=100), nullable=False),
        sa.Column("form_type", sa.String(length=50), nullable=True),
        sa.Column("accession_number", sa.String(length=100), nullable=True),
        sa.Column("filing_url", sa.String(length=1000), nullable=True),
        sa.Column("ticker", sa.String(length=20), nullable=True),
        sa.Column("filing_date", sa.Date(), nullable=True),
        sa.Column("processing_status", sa.String(length=50), nullable=True),
        sa.Column("records_created", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.String(length=1000), nullable=True),
        sa.Column("processed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "accession_number",
            name="uq_processed_filing_accession_number",
        ),
        sa.UniqueConstraint("filing_url", name="uq_processed_filing_url"),
    )
    op.create_index(
        "ix_processed_filings_accession_number",
        "processed_filings",
        ["accession_number"],
        unique=False,
    )
    op.create_index(
        "ix_processed_filings_filing_url",
        "processed_filings",
        ["filing_url"],
        unique=False,
    )
    op.create_index(
        "ix_processed_filings_id",
        "processed_filings",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_processed_filings_source_type",
        "processed_filings",
        ["source_type"],
        unique=False,
    )
    op.create_index(
        "ix_processed_filings_ticker",
        "processed_filings",
        ["ticker"],
        unique=False,
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("username", sa.String(length=100), nullable=True),
        sa.Column("full_name", sa.String(length=255), nullable=True),
        sa.Column("avatar_url", sa.String(length=500), nullable=True),
        sa.Column("role", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("is_superuser", sa.Boolean(), nullable=False),
        sa.Column("clerk_uid", sa.String(length=255), nullable=False),
        sa.Column("auth_provider", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_clerk_uid", "users", ["clerk_uid"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_id", "users", ["id"], unique=False)
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "ai_insights",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("signal_id", sa.Integer(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("why_it_matters", sa.Text(), nullable=True),
        sa.Column("watch_next", sa.Text(), nullable=True),
        sa.Column("limitations", sa.Text(), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_ai_insights_company_id",
        "ai_insights",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_ai_insights_created_at",
        "ai_insights",
        ["created_at"],
        unique=False,
    )
    op.create_index("ix_ai_insights_id", "ai_insights", ["id"], unique=False)
    op.create_index(
        "ix_ai_insights_signal_id",
        "ai_insights",
        ["signal_id"],
        unique=False,
    )

    op.create_table(
        "fund_filings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("fund_id", sa.Integer(), nullable=False),
        sa.Column("form_type", sa.String(length=50), nullable=False),
        sa.Column("filing_date", sa.Date(), nullable=False),
        sa.Column("period_end_date", sa.Date(), nullable=True),
        sa.Column("accession_number", sa.String(length=100), nullable=True),
        sa.Column("filing_url", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["fund_id"], ["funds.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_fund_filings_accession_number",
        "fund_filings",
        ["accession_number"],
        unique=True,
    )
    op.create_index(
        "ix_fund_filings_fund_id",
        "fund_filings",
        ["fund_id"],
        unique=False,
    )
    op.create_index("ix_fund_filings_id", "fund_filings", ["id"], unique=False)

    op.create_table(
        "insiders",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("relationship_to_company", sa.String(length=100), nullable=True),
        sa.Column("insider_cik", sa.String(length=50), nullable=True),
        sa.Column("is_director", sa.Boolean(), nullable=True),
        sa.Column("is_officer", sa.Boolean(), nullable=True),
        sa.Column("is_ten_percent_owner", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_insiders_company_id",
        "insiders",
        ["company_id"],
        unique=False,
    )
    op.create_index("ix_insiders_id", "insiders", ["id"], unique=False)
    op.create_index(
        "ix_insiders_insider_cik",
        "insiders",
        ["insider_cik"],
        unique=False,
    )
    op.create_index("ix_insiders_name", "insiders", ["name"], unique=False)

    op.create_table(
        "market_snapshots",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("symbol", sa.String(length=20), nullable=False),
        sa.Column("price", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("change_amount", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("change_percent", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("currency", sa.String(length=10), nullable=False),
        sa.Column("provider", sa.String(length=50), nullable=False),
        sa.Column("market_time", sa.DateTime(), nullable=True),
        sa.Column("fetched_at", sa.DateTime(), nullable=False),
        sa.Column("raw_payload", sa.JSON(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_market_snapshots_company_id",
        "market_snapshots",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_market_snapshots_fetched_at",
        "market_snapshots",
        ["fetched_at"],
        unique=False,
    )
    op.create_index(
        "ix_market_snapshots_id",
        "market_snapshots",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_market_snapshots_symbol",
        "market_snapshots",
        ["symbol"],
        unique=False,
    )

    op.create_table(
        "money_signal_scores",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Numeric(precision=5, scale=2), nullable=False),
        sa.Column("score_label", sa.String(length=100), nullable=True),
        sa.Column("institutional_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("insider_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("political_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("activist_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("buyback_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("freshness_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("confidence_score", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("breakdown_json", sa.JSON(), nullable=True),
        sa.Column("calculated_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_money_signal_scores_calculated_at",
        "money_signal_scores",
        ["calculated_at"],
        unique=False,
    )
    op.create_index(
        "ix_money_signal_scores_company_id",
        "money_signal_scores",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_money_signal_scores_id",
        "money_signal_scores",
        ["id"],
        unique=False,
    )

    op.create_table(
        "scrape_history",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=True),
        sa.Column("ticker", sa.String(length=20), nullable=False),
        sa.Column("source_type", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("filings_found", sa.Integer(), nullable=True),
        sa.Column("filings_processed", sa.Integer(), nullable=True),
        sa.Column("filings_skipped", sa.Integer(), nullable=True),
        sa.Column("filings_failed", sa.Integer(), nullable=True),
        sa.Column("records_created", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_scrape_history_company_id",
        "scrape_history",
        ["company_id"],
        unique=False,
    )
    op.create_index("ix_scrape_history_id", "scrape_history", ["id"], unique=False)
    op.create_index(
        "ix_scrape_history_ticker",
        "scrape_history",
        ["ticker"],
        unique=False,
    )

    op.create_table(
        "signals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("signal_type", sa.String(length=100), nullable=False),
        sa.Column("source_type", sa.String(length=100), nullable=False),
        sa.Column("source_id", sa.Integer(), nullable=True),
        sa.Column("source_name", sa.String(length=255), nullable=True),
        sa.Column("direction", sa.String(length=50), nullable=False),
        sa.Column("strength", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("confidence", sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column("score_impact", sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=True),
        sa.Column("detected_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_signals_company_id",
        "signals",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_signals_detected_at",
        "signals",
        ["detected_at"],
        unique=False,
    )
    op.create_index("ix_signals_id", "signals", ["id"], unique=False)
    op.create_index(
        "ix_signals_signal_type",
        "signals",
        ["signal_type"],
        unique=False,
    )
    op.create_index(
        "ix_signals_source_id",
        "signals",
        ["source_id"],
        unique=False,
    )
    op.create_index(
        "ix_signals_source_type",
        "signals",
        ["source_type"],
        unique=False,
    )

    op.create_table(
        "watchlists",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=100), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "company_id", name="uq_user_company_watchlist"),
    )
    op.create_index(
        "ix_watchlists_company_id",
        "watchlists",
        ["company_id"],
        unique=False,
    )
    op.create_index("ix_watchlists_id", "watchlists", ["id"], unique=False)
    op.create_index("ix_watchlists_user_id", "watchlists", ["user_id"], unique=False)

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.String(length=100), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("signal_id", sa.Integer(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=True),
        sa.Column("alert_type", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("read_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["signal_id"], ["signals.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_company_id", "alerts", ["company_id"], unique=False)
    op.create_index("ix_alerts_created_at", "alerts", ["created_at"], unique=False)
    op.create_index("ix_alerts_id", "alerts", ["id"], unique=False)
    op.create_index("ix_alerts_signal_id", "alerts", ["signal_id"], unique=False)
    op.create_index("ix_alerts_status", "alerts", ["status"], unique=False)
    op.create_index("ix_alerts_user_id", "alerts", ["user_id"], unique=False)

    op.create_table(
        "fund_holdings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("fund_id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("filing_id", sa.Integer(), nullable=True),
        sa.Column("quarter", sa.String(length=20), nullable=True),
        sa.Column("shares", sa.Numeric(precision=20, scale=4), nullable=True),
        sa.Column("market_value", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("portfolio_weight", sa.Numeric(precision=8, scale=4), nullable=True),
        sa.Column("previous_shares", sa.Numeric(precision=20, scale=4), nullable=True),
        sa.Column("share_change", sa.Numeric(precision=20, scale=4), nullable=True),
        sa.Column("change_percent", sa.Numeric(precision=10, scale=4), nullable=True),
        sa.Column("position_status", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["filing_id"], ["fund_filings.id"]),
        sa.ForeignKeyConstraint(["fund_id"], ["funds.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_fund_holdings_company_id",
        "fund_holdings",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_fund_holdings_filing_id",
        "fund_holdings",
        ["filing_id"],
        unique=False,
    )
    op.create_index(
        "ix_fund_holdings_fund_id",
        "fund_holdings",
        ["fund_id"],
        unique=False,
    )
    op.create_index(
        "ix_fund_holdings_id",
        "fund_holdings",
        ["id"],
        unique=False,
    )

    op.create_table(
        "insider_trades",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("company_id", sa.Integer(), nullable=False),
        sa.Column("insider_id", sa.Integer(), nullable=False),
        sa.Column("transaction_date", sa.Date(), nullable=False),
        sa.Column("filing_date", sa.Date(), nullable=True),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("transaction_code", sa.String(length=20), nullable=True),
        sa.Column("shares", sa.Numeric(precision=20, scale=4), nullable=True),
        sa.Column("price_per_share", sa.Numeric(precision=18, scale=4), nullable=True),
        sa.Column("total_value", sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column("shares_owned_after", sa.Numeric(precision=20, scale=4), nullable=True),
        sa.Column("ownership_type", sa.String(length=100), nullable=True),
        sa.Column("derivative_transaction", sa.Boolean(), nullable=True),
        sa.Column("accession_number", sa.String(length=100), nullable=True),
        sa.Column("sec_filing_url", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
        sa.ForeignKeyConstraint(["insider_id"], ["insiders.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_insider_trades_accession_number",
        "insider_trades",
        ["accession_number"],
        unique=False,
    )
    op.create_index(
        "ix_insider_trades_company_id",
        "insider_trades",
        ["company_id"],
        unique=False,
    )
    op.create_index(
        "ix_insider_trades_id",
        "insider_trades",
        ["id"],
        unique=False,
    )
    op.create_index(
        "ix_insider_trades_insider_id",
        "insider_trades",
        ["insider_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_insider_trades_insider_id", table_name="insider_trades")
    op.drop_index("ix_insider_trades_id", table_name="insider_trades")
    op.drop_index("ix_insider_trades_company_id", table_name="insider_trades")
    op.drop_index("ix_insider_trades_accession_number", table_name="insider_trades")
    op.drop_table("insider_trades")

    op.drop_index("ix_fund_holdings_id", table_name="fund_holdings")
    op.drop_index("ix_fund_holdings_fund_id", table_name="fund_holdings")
    op.drop_index("ix_fund_holdings_filing_id", table_name="fund_holdings")
    op.drop_index("ix_fund_holdings_company_id", table_name="fund_holdings")
    op.drop_table("fund_holdings")

    op.drop_index("ix_alerts_user_id", table_name="alerts")
    op.drop_index("ix_alerts_status", table_name="alerts")
    op.drop_index("ix_alerts_signal_id", table_name="alerts")
    op.drop_index("ix_alerts_id", table_name="alerts")
    op.drop_index("ix_alerts_created_at", table_name="alerts")
    op.drop_index("ix_alerts_company_id", table_name="alerts")
    op.drop_table("alerts")

    op.drop_index("ix_watchlists_user_id", table_name="watchlists")
    op.drop_index("ix_watchlists_id", table_name="watchlists")
    op.drop_index("ix_watchlists_company_id", table_name="watchlists")
    op.drop_table("watchlists")

    op.drop_index("ix_signals_source_type", table_name="signals")
    op.drop_index("ix_signals_source_id", table_name="signals")
    op.drop_index("ix_signals_signal_type", table_name="signals")
    op.drop_index("ix_signals_id", table_name="signals")
    op.drop_index("ix_signals_detected_at", table_name="signals")
    op.drop_index("ix_signals_company_id", table_name="signals")
    op.drop_table("signals")

    op.drop_index("ix_scrape_history_ticker", table_name="scrape_history")
    op.drop_index("ix_scrape_history_id", table_name="scrape_history")
    op.drop_index("ix_scrape_history_company_id", table_name="scrape_history")
    op.drop_table("scrape_history")

    op.drop_index("ix_money_signal_scores_id", table_name="money_signal_scores")
    op.drop_index(
        "ix_money_signal_scores_company_id",
        table_name="money_signal_scores",
    )
    op.drop_index(
        "ix_money_signal_scores_calculated_at",
        table_name="money_signal_scores",
    )
    op.drop_table("money_signal_scores")

    op.drop_index("ix_market_snapshots_symbol", table_name="market_snapshots")
    op.drop_index("ix_market_snapshots_id", table_name="market_snapshots")
    op.drop_index("ix_market_snapshots_fetched_at", table_name="market_snapshots")
    op.drop_index("ix_market_snapshots_company_id", table_name="market_snapshots")
    op.drop_table("market_snapshots")

    op.drop_index("ix_insiders_name", table_name="insiders")
    op.drop_index("ix_insiders_insider_cik", table_name="insiders")
    op.drop_index("ix_insiders_id", table_name="insiders")
    op.drop_index("ix_insiders_company_id", table_name="insiders")
    op.drop_table("insiders")

    op.drop_index("ix_fund_filings_id", table_name="fund_filings")
    op.drop_index("ix_fund_filings_fund_id", table_name="fund_filings")
    op.drop_index("ix_fund_filings_accession_number", table_name="fund_filings")
    op.drop_table("fund_filings")

    op.drop_index("ix_ai_insights_signal_id", table_name="ai_insights")
    op.drop_index("ix_ai_insights_id", table_name="ai_insights")
    op.drop_index("ix_ai_insights_created_at", table_name="ai_insights")
    op.drop_index("ix_ai_insights_company_id", table_name="ai_insights")
    op.drop_table("ai_insights")

    op.drop_index("ix_users_username", table_name="users")
    op.drop_index("ix_users_id", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_clerk_uid", table_name="users")
    op.drop_table("users")

    op.drop_index("ix_processed_filings_ticker", table_name="processed_filings")
    op.drop_index(
        "ix_processed_filings_source_type",
        table_name="processed_filings",
    )
    op.drop_index("ix_processed_filings_id", table_name="processed_filings")
    op.drop_index(
        "ix_processed_filings_filing_url",
        table_name="processed_filings",
    )
    op.drop_index(
        "ix_processed_filings_accession_number",
        table_name="processed_filings",
    )
    op.drop_table("processed_filings")

    op.drop_index("ix_funds_name", table_name="funds")
    op.drop_index("ix_funds_id", table_name="funds")
    op.drop_index("ix_funds_cik", table_name="funds")
    op.drop_table("funds")

    op.drop_index("ix_companies_ticker", table_name="companies")
    op.drop_index("ix_companies_id", table_name="companies")
    op.drop_index("ix_companies_cusip", table_name="companies")
    op.drop_index("ix_companies_cik", table_name="companies")
    op.drop_table("companies")
