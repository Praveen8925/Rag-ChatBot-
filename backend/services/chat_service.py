from uuid import UUID
from models.chat import ChatRequest, ChatResponse
from services import rag_service, message_service
from services.session_service import should_generate_title, update_session_title
from services.title_service import generate_chat_title
from core.config import settings
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage

async def answer(req: ChatRequest, user_id: UUID) -> ChatResponse:
    # 1. Save user message
    await message_service.save_message(req.session_id, "user", req.content)

    # 2. Auto-generate title if this is the first message to "New Chat"
    try:
        if await should_generate_title(req.session_id, user_id):
            # Check if this is the first user message (no history yet)
            history = await message_service.get_messages(req.session_id)
            user_messages = [msg for msg in history if msg.role == "user"]

            if len(user_messages) == 1:  # Only the message we just saved
                generated_title = await generate_chat_title(req.content)
                await update_session_title(req.session_id, generated_title, user_id, auto_generated=True)
    except Exception as e:
        # Don't fail the chat if title generation fails
        print(f"Auto-title generation failed: {e}")

    # 3. Route to correct service
    if req.selected_doc_ids:
        result = await rag_service.answer(req, user_id)
    else:
        result = await normal_answer(req)

    # 4. Save assistant message
    await message_service.save_message(req.session_id, "assistant", result.message, result.sources)

    # 5. Return response
    return result

async def normal_answer(req: ChatRequest) -> ChatResponse:
    # 1. Fetch conversation history
    history = await message_service.get_messages(req.session_id)
    
    # 2. Build messages for LLM
    messages = [SystemMessage(content="You are a helpful AI assistant.")]
    for msg in history:
        if msg.role == "user":
            messages.append(HumanMessage(content=msg.content))
        else:
            # Using SystemMessage for assistant to avoid the model thinking it's a user turn
            messages.append(SystemMessage(content=msg.content))
    messages.append(HumanMessage(content=req.content))

    # 3. Call LLM
    llm = ChatNVIDIA(
        model=settings.LLM_MODEL,
        api_key=settings.NVIDIA_NIM_API_KEY,
        temperature=0.7,
    )
    response = llm.invoke(messages)

    return ChatResponse(message=response.content)

