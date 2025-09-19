from fastapi import APIRouter, Depends, HTTPException
from ...core.auth import get_current_user
from .posts import router as posts_router
from .comments import router as comments_router
from .votes import router as votes_router
from .reports import router as reports_router

# NOTE: Child routers already declare prefix "/api/v1". This top-level router
# should NOT add another prefix to avoid double "/api/v1/api/v1".
router = APIRouter()

# Mount resource routers that implement the OpenAPI:
#   GET/POST /api/v1/posts
#   GET    /api/v1/posts/{post_id}
#   GET/POST /api/v1/posts/{post_id}/comments
#   POST/DELETE /api/v1/votes
#   POST /api/v1/reports
router.include_router(posts_router)
router.include_router(comments_router)
router.include_router(votes_router)
router.include_router(reports_router)


@router.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@router.get("/api/v1/me")
async def me(user=Depends(get_current_user)):
    # get_current_user returns { claims, token }
    claims = user.get("claims") if isinstance(user, dict) else user
    if not isinstance(claims, dict):
        raise HTTPException(status_code=401, detail="Invalid token")
    sub = claims.get("sub")
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {
        "id": sub,
        "email": claims.get("email"),
        "role": claims.get("role") or "user",
    }
