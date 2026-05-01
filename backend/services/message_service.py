"""
Message Service - Handles chat messages.
FEATURES:
- Message storage and retrieval
- Triggers automatic title generation for first messages to "New Chat" sessions
"""

from uuid import UUID
from typing import List, Optional
from core.supabase_client import supabase
from models.chat import ChatMessage, Source

async def get_messages(session_id: UUID) -> List[ChatMessage]:
    response = supabase.table("messages").select("*").eq("session_id", str(session_id)).order("created_at").execute()
    return [ChatMessage(**msg) for msg in response.data]

async def save_message(session_id: UUID, role: str, content: str, sources: Optional[List[Source]] = None):
    message_to_insert = {
        "session_id": str(session_id),
        "role": role,
        "content": content,
    }
    if sources:
        message_to_insert["sources"] = [{"filename": s.filename, "page": s.page} for s in sources]

    supabase.table("messages").insert(message_to_insert).execute()
