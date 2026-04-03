from uuid import UUID
from typing import List
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
