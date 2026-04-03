from fastapi import Depends, HTTPException, Header
from core.supabase_client import supabase

async def get_current_user(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    try:
        response = supabase.auth.get_user(token)
        if not response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return response.user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
