from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ...core.auth import get_current_user  # type: ignore
from ...core.supa import rest_delete, rest_post


router = APIRouter(prefix="/api/v1", tags=["votes"])


@router.post("/votes", status_code=status.HTTP_204_NO_CONTENT)
async def upsert_vote(body: dict, user=Depends(get_current_user)):
    token: str = user["token"]
    sub: str = user["claims"].get("sub")
    post_id = body.get("post_id") if isinstance(body, dict) else None
    comment_id = body.get("comment_id") if isinstance(body, dict) else None
    value = body.get("value") if isinstance(body, dict) else None
    if value not in (-1, 1):
        raise HTTPException(status_code=400, detail="Invalid vote value")
    if (not post_id and not comment_id) or (post_id and comment_id):
        raise HTTPException(status_code=400, detail="Provide either post_id or comment_id")
    payload = {"user_id": sub, "post_id": post_id, "comment_id": comment_id, "value": value}
    await rest_post("/votes", token=token, json=payload)
    return None


@router.delete("/votes", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vote(
    post_id: Optional[str] = Query(default=None),
    comment_id: Optional[str] = Query(default=None),
    user=Depends(get_current_user),
):
    sub: str = user["claims"].get("sub")
    token: str = user["token"]
    if (not post_id and not comment_id) or (post_id and comment_id):
        raise HTTPException(status_code=400, detail="Provide either post_id or comment_id")
    if post_id:
        path = f"/votes?user_id=eq.{sub}&post_id=eq.{post_id}"
    else:
        path = f"/votes?user_id=eq.{sub}&comment_id=eq.{comment_id}"
    await rest_delete(path, token=token)
    return None


