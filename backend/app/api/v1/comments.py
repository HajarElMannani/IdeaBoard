from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from ...core.auth import get_current_user  # type: ignore
from ...core.supa import range_headers, rest_get, rest_post


router = APIRouter(prefix="/api/v1", tags=["comments"])


@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    params = {"post_id": f"eq.{post_id}", "order": "created_at.desc"}
    headers = range_headers(page, page_size)
    data, total = await rest_get("/comments", token="", params=params, headers=headers)
    return {"items": data or [], "page": page, "page_size": page_size, "total": total or (len(data) if data else 0)}


@router.post("/posts/{post_id}/comments", status_code=201)
async def create_comment(post_id: str, body: dict, user=Depends(get_current_user)):
    token: str = user["token"]
    claims = user["claims"]
    payload = {
        "post_id": post_id,
        "author_id": claims.get("sub"),
        "body": body.get("body") if isinstance(body, dict) else None,
    }
    created = await rest_post("/comments", token=token, json=payload)
    if isinstance(created, list):
        return created[0] if created else created
    return created


