from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DashboardSignalResponse(BaseModel):
    id: int
    ticker: str
    company_name: str
    sector: str
    signal_type: str
    source_type: str
    source_name: str
    signal_strength: str
    money_signal_score: int
    explanation: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)