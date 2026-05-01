"""
Session Service - Manages chat sessions.
FEATURES:
- Manual title editing via user actions
- Automatic title generation from first user message
"""

from uuid import UUID
from typing import List, Optional
from core.supabase_client import supabase
from models.session import Session

async def get_sessions(user_id: UUID) -> List[Session]:
    response = supabase.table("sessions").select("*").eq("user_id", str(user_id)).execute()
    return [Session(**session) for session in response.data]

async def create_session(user_id: UUID) -> Session:
    response = supabase.table("sessions").insert({"user_id": str(user_id), "title": "New Chat"}).execute()
    return Session(**response.data[0])

async def delete_session(session_id: UUID, user_id: UUID):
    supabase.table("sessions").delete().eq("id", str(session_id)).eq("user_id", str(user_id)).execute()

async def update_session_title(session_id: UUID, title: str, user_id: UUID, auto_generated: bool = False) -> Session:
    # Validate title is not empty
    if not title or not title.strip():
        raise ValueError("Title cannot be empty")

    # Allow both manual updates and automatic generation
    response = supabase.table("sessions").update({"title": title.strip()}).eq("id", str(session_id)).eq("user_id", str(user_id)).execute()

    if not response.data:
        raise ValueError("Session not found or update failed")

    return Session(**response.data[0])

async def get_session_by_id(session_id: UUID, user_id: UUID) -> Optional[Session]:
    """Get a session by ID for the user"""
    response = supabase.table("sessions").select("*").eq("id", str(session_id)).eq("user_id", str(user_id)).execute()
    if response.data:
        return Session(**response.data[0])
    return None

async def should_generate_title(session_id: UUID, user_id: UUID) -> bool:
    """Check if session title should be auto-generated (title is still 'New Chat')"""
    session = await get_session_by_id(session_id, user_id)
    return session is not None and session.title == "New Chat"
