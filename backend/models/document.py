from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

class Document(BaseModel):
    id: UUID
    user_id: UUID
    filename: str
    size: int
    uploaded_at: datetime
    faiss_key: str

    model_config = ConfigDict(from_attributes=True)
