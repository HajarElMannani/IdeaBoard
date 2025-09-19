from fastapi import APIRouter, Depends, HTTPException, status

from ...core.auth import get_current_user  # type: ignore
from ...core.supa import rest_post


router = APIRouter(prefix="/api/v1", tags=["reports"])


@router.post("/reports", status_code=status.HTTP_204_NO_CONTENT)
async def create_report(body: dict, user=Depends(get_current_user)):
    token: str = user["token"]
    sub: str = user["claims"].get("sub")
    reason = (body.get("reason") or "").strip() if isinstance(body, dict) else ""
    post_id = body.get("post_id") if isinstance(body, dict) else None
    comment_id = body.get("comment_id") if isinstance(body, dict) else None
    if len(reason) < 3:
        raise HTTPException(status_code=400, detail="Reason must be at least 3 characters")
    if (not post_id and not comment_id) or (post_id and comment_id):
        raise HTTPException(status_code=400, detail="Provide either post_id or comment_id")
    payload = {"reporter_id": sub, "post_id": post_id, "comment_id": comment_id, "reason": reason}
    await rest_post("/reports", token=token, json=payload)
    return None


