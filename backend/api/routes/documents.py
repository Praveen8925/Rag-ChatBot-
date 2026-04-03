from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
from uuid import UUID

from models.document import Document
from services.document_service import (
    get_documents as get_documents_service, 
    delete_document as delete_document_service,
    upload_and_process_document
)
from api.dependencies import get_current_user

router = APIRouter()

@router.get("/api/documents", response_model=List[Document])
async def list_documents(user=Depends(get_current_user)):
    return await get_documents_service(user.id)

@router.post("/api/documents/upload", response_model=Document)
async def upload_document(file: UploadFile = File(...), user=Depends(get_current_user)):
    try:
        return await upload_and_process_document(file, user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")


@router.delete("/api/documents/{doc_id}")
async def delete_a_document(doc_id: UUID, user=Depends(get_current_user)):
    try:
        await delete_document_service(doc_id, user.id)
        return {"message": "Document deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {e}")
