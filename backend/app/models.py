from pydantic import BaseModel


class WSMessage(BaseModel):
    """WebSocket message from the client."""

    type: str
    content: str = ""
    audio_data: str | None = None


class SessionStats(BaseModel):
    """Real-time session statistics sent to the client."""

    message_count: int
    mastery_score: int
    weak_areas: list[dict]
    recommendation: str


class SessionSummary(BaseModel):
    """End-of-session summary."""

    topic: str
    mastery_score: int
    weak_areas: list[dict]
    recommendation: str
    summary: str
