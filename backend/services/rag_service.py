import numpy as np
from uuid import UUID
from typing import List

from models.chat import ChatRequest, ChatResponse, Source
from core.config import settings
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings, ChatNVIDIA
from langchain_core.messages import SystemMessage, HumanMessage
from vector_store.faiss_store import faiss_store

SYSTEM_PROMPT = """You are a document assistant. Answer ONLY using the provided context.
If the answer is not found in the context, respond with exactly:
"I don't have enough information to answer that."
Do not use outside knowledge. Do not guess."""

async def answer(req: ChatRequest, user_id: UUID) -> ChatResponse:
    # 1. Embed the user query
    embeddings = NVIDIAEmbeddings(model=settings.EMBED_MODEL, api_key=settings.EMBED_API_KEY)
    query_embedding = np.array(embeddings.embed_query(req.content), dtype=np.float32).reshape(1, -1)

    # 2. Retrieve top-k chunks from FAISS
    chunks = faiss_store.search(
        query_vector=query_embedding,
        doc_ids=req.selected_doc_ids,
        top_k=5
    )

    if not chunks:
        return ChatResponse(message="I don't have enough information to answer that.")

    # 3. Build context string
    context = "\n\n".join([c['text'] for c in chunks])

    # 4. Call LLM with system prompt + context + user question
    llm = ChatNVIDIA(
        model=settings.LLM_MODEL,
        api_key=settings.NVIDIA_NIM_API_KEY,
        temperature=0.2,
    )
    
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {req.content}")
    ])

    # 5. Return response with source references
    sources = [Source(filename=c['filename'], page=c['page']) for c in chunks]
    return ChatResponse(message=response.content, sources=sources)
