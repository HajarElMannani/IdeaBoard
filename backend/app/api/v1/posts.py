from typing import Literal, Optional

from fastapi import APIRouter, HTTPException, Query

from ...core.supa import extract_total, range_headers, rest_get, rest_post
from ...core.auth import get_current_user  # type: ignore
from fastapi import Depends


router = APIRouter(prefix="/api/v1", tags=["posts"])


@router.get("/posts")
async def list_posts(
    sort: Literal["new", "top"] = Query("new"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Literal["published", "hidden", "deleted"] = Query("published"),
    tag: Optional[str] = None,
):
    params: dict[str, str] = {"status": f"eq.{status}"}
    if tag:
        # array-contains: cs{"tag"}
        params["tags"] = f"cs.{{{tag}}}"
    order = "created_at.desc" if sort == "new" else "up_count.desc,down_count.asc"
    params["order"] = order

    headers = range_headers(page, page_size)
    data, total = await rest_get("/posts", token="", params=params, headers=headers)
    return {"items": data or [], "page": page, "page_size": page_size, "total": total or (len(data) if data else 0)}


@router.post("/posts", status_code=201)
async def create_post(body: dict, user=Depends(get_current_user)):
    token: str = user["token"]
    claims = user["claims"]
    payload = {
        "author_id": claims.get("sub"),
        "title": (body.get("title") if isinstance(body, dict) else None),
        "body": (body.get("body") if isinstance(body, dict) else None),
        "tags": (body.get("tags") if isinstance(body, dict) else []),
    }
    created = await rest_post("/posts", token=token, json=payload)
    # PostgREST returns a list when no single object preference; handle both
    if isinstance(created, list):
        return created[0] if created else created
    return created


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    params = {"id": f"eq.{post_id}", "limit": 1}
    data, _ = await rest_get("/posts", token="", params=params)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    return data[0]


