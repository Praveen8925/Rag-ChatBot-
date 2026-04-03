from uuid import UUID, uuid4
from typing import List
import os
import tempfile
import numpy as np
from fastapi import UploadFile

from core.supabase_client import supabase
from core.config import settings
from models.document import Document
from utils.file_parser import parse_file
from utils.text_splitter import split_text
from vector_store.faiss_store import faiss_store
from langchain_nvidia_ai_endpoints import NVIDIAEmbeddings


async def get_documents(user_id: UUID) -> List[Document]:
    response = supabase.table("documents").select("*").eq("user_id", str(user_id)).execute()
    return [Document(**doc) for doc in response.data]

async def upload_and_process_document(file: UploadFile, user_id: UUID) -> Document:
    # 1. Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        # 2. Parse text from file
        text = parse_file(tmp_path)

        # 3. Split text into chunks
        chunks = split_text(text)

        # 4. Embed chunks
        embeddings = NVIDIAEmbeddings(
            model=settings.EMBED_MODEL,
            api_key=settings.EMBED_API_KEY
        )
        vectors = np.array(embeddings.embed_documents(chunks), dtype=np.float32)

        # 5. Store in FAISS and Supabase
        doc_id = uuid4()
        faiss_key = str(doc_id) # Use the document's own ID as the key for FAISS grouping

        metadata_list = [{
            'doc_id': doc_id,
            'filename': file.filename,
            'page': i + 1,  # Simple page numbering per chunk
            'text': chunk
        } for i, chunk in enumerate(chunks)]

        faiss_store.add(vectors, metadata_list)

        # 6. Save document metadata to Supabase
        doc_to_insert = {
            "id": str(doc_id),
            "user_id": str(user_id),
            "filename": file.filename,
            "size": file.size,
            "faiss_key": faiss_key,
        }
        
        response = supabase.table("documents").insert(doc_to_insert).execute()
        
        if not response.data:
            raise Exception("Failed to save document metadata to Supabase.")

        return Document(**response.data[0])

    finally:
        # 7. Clean up temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


async def delete_document(doc_id: UUID, user_id: UUID):
    # First, remove from FAISS
    faiss_store.delete_by_doc_id(doc_id)

    # Then, remove from Supabase
    supabase.table("documents").delete().eq("id", str(doc_id)).eq("user_id", str(user_id)).execute()
