from fastapi import APIRouter, Depends
from models.chat import ChatRequest, ChatResponse
from services.chat_service import answer
from api.dependencies import get_current_user

router = APIRouter()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest, user=Depends(get_current_user)):
    return await answer(req, user.id)
