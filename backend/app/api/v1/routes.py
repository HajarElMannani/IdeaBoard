from fastapi import APIRouter, Depends
from ...core.auth import get_current_user

router = APIRouter(prefix="/api/v1")

@router.get("/health")
async def health():
    return {"status": "ok"}

@router.get("/me")
async def me(user=Depends(get_current_user)):
    # returns Supabase-authenticated user claims
    return {"user": user}
