from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime
from typing import List, Optional

class Source(BaseModel):
    filename: str
    page: int

class ChatMessage(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    sources: Optional[List[Source]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ChatRequest(BaseModel):
    session_id: UUID
    content: str
    selected_doc_ids: List[UUID] = []

class ChatResponse(BaseModel):
    message: str
    sources: Optional[List[Source]] = None
