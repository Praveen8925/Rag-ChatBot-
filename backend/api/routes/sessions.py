from fastapi import APIRouter, Depends, HTTPException
from typing import List
from uuid import UUID

from models.session import Session
from models.chat import ChatMessage
from services.session_service import (
    get_sessions,
    create_session as create_session_service,
    delete_session as delete_session_service,
    update_session_title as update_session_title_service
)
from services.message_service import get_messages
from api.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UpdateSessionRequest(BaseModel):
    title: str

@router.get("/api/sessions", response_model=List[Session])
async def list_sessions(user=Depends(get_current_user)):
    return await get_sessions(user.id)

@router.post("/api/sessions", response_model=Session)
async def create_new_session(user=Depends(get_current_user)):
    return await create_session_service(user.id)

@router.get("/api/sessions/{session_id}/messages", response_model=List[ChatMessage])
async def get_session_messages(session_id: UUID, user=Depends(get_current_user)):
    return await get_messages(session_id)

@router.put("/api/sessions/{session_id}")
async def update_session(session_id: UUID, request: UpdateSessionRequest, user=Depends(get_current_user)):
    try:
        # Manual updates (not auto-generated)
        session = await update_session_title_service(session_id, request.title, user.id, auto_generated=False)
        return session
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/api/sessions/{session_id}")
async def delete_a_session(session_id: UUID, user=Depends(get_current_user)):
    await delete_session_service(session_id, user.id)
    return {"message": "Session deleted successfully"}
