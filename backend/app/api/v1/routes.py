from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import Dict, List, Optional
from uuid import uuid4
from datetime import datetime
from ...core.auth import get_current_user

router = APIRouter(prefix="/api/v1")

@router.get("/health")
async def health():
    return {"status": "ok"}

class Post(BaseModel):
    id: str
    author_id: str
    title: str
    body: str
    tags: Optional[List[str]] = None
    status: str = Field(default="published")
    up_count: int = 0
    down_count: int = 0
    created_at: str


class Comment(BaseModel):
    id: str
    post_id: str
    author_id: str
    body: str
    status: str = Field(default="published")
    up_count: int = 0
    down_count: int = 0
    created_at: str


class PaginatedPosts(BaseModel):
    items: List[Post]
    page: int
    page_size: int
    total: int


class PaginatedComments(BaseModel):
    items: List[Comment]
    page: int
    page_size: int
    total: int


class PostCreate(BaseModel):
    title: str
    body: str
    tags: Optional[List[str]] = None


class CommentCreate(BaseModel):
    body: str


class VoteUpsert(BaseModel):
    post_id: Optional[str] = None
    comment_id: Optional[str] = None
    value: int


# In-memory stores for demo/MVP
_posts: Dict[str, Post] = {}
_comments_by_post: Dict[str, List[Comment]] = {}


@router.get("/me")
async def me(user=Depends(get_current_user)):
    sub = user.get("sub")
    email = user.get("email")
    role = user.get("role") or "user"
    if not sub:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"id": sub, "email": email, "role": role}


@router.get("/posts")
async def list_posts(
    sort: Optional[str] = Query(default="new"),
    status_param: Optional[str] = Query(alias="status", default="published"),
    tag: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    # Filter by status
    posts = [p for p in _posts.values() if p.status == status_param]
    # Filter by tag
    if tag:
        posts = [p for p in posts if (p.tags and tag in p.tags)]
    # Sort
    if sort == "top":
        posts.sort(key=lambda p: (p.up_count - p.down_count, p.created_at), reverse=True)
    else:
        posts.sort(key=lambda p: p.created_at, reverse=True)
    total = len(posts)
    start = (page - 1) * page_size
    end = start + page_size
    items = posts[start:end]
    return PaginatedPosts(items=items, page=page, page_size=page_size, total=total)


@router.post("/posts", status_code=status.HTTP_201_CREATED)
async def create_post(payload: PostCreate, user=Depends(get_current_user)):
    now = datetime.utcnow().isoformat()
    post = Post(
        id=str(uuid4()),
        author_id=user.get("sub"),
        title=payload.title,
        body=payload.body,
        tags=payload.tags or [],
        status="published",
        up_count=0,
        down_count=0,
        created_at=now,
    )
    _posts[post.id] = post
    _comments_by_post.setdefault(post.id, [])
    return post


@router.get("/posts/{post_id}")
async def get_post(post_id: str):
    post = _posts.get(post_id)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/posts/{post_id}/comments")
async def list_comments(
    post_id: str,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    comments = [c for c in _comments_by_post.get(post_id, []) if c.status == "published"]
    comments.sort(key=lambda c: c.created_at, reverse=True)
    total = len(comments)
    start = (page - 1) * page_size
    end = start + page_size
    items = comments[start:end]
    return PaginatedComments(items=items, page=page, page_size=page_size, total=total)


@router.post("/posts/{post_id}/comments", status_code=status.HTTP_201_CREATED)
async def create_comment(post_id: str, payload: CommentCreate, user=Depends(get_current_user)):
    if post_id not in _posts:
        raise HTTPException(status_code=404, detail="Post not found")
    now = datetime.utcnow().isoformat()
    comment = Comment(
        id=str(uuid4()),
        post_id=post_id,
        author_id=user.get("sub"),
        body=payload.body,
        status="published",
        created_at=now,
    )
    _comments_by_post.setdefault(post_id, []).append(comment)
    return comment


@router.post("/votes", status_code=status.HTTP_204_NO_CONTENT)
async def upsert_vote(v: VoteUpsert, user=Depends(get_current_user)):
    if v.value not in (-1, 1):
        raise HTTPException(status_code=400, detail="Invalid vote value")
    if (not v.post_id and not v.comment_id) or (v.post_id and v.comment_id):
        raise HTTPException(status_code=400, detail="Provide either post_id or comment_id")
    if v.post_id:
        p = _posts.get(v.post_id)
        if not p:
            raise HTTPException(status_code=404, detail="Post not found")
        if v.value == 1:
            p.up_count += 1
        else:
            p.down_count += 1
        _posts[p.id] = p
        return
    if v.comment_id:
        # Optional: implement comment votes (affects counts only)
        for comments in _comments_by_post.values():
            for c in comments:
                if c.id == v.comment_id:
                    if v.value == 1:
                        c.up_count += 1
                    else:
                        c.down_count += 1
                    return
        raise HTTPException(status_code=404, detail="Comment not found")


class ReportCreate(BaseModel):
    post_id: Optional[str] = None
    comment_id: Optional[str] = None
    reason: str


@router.post("/reports", status_code=status.HTTP_204_NO_CONTENT)
async def create_report(payload: ReportCreate, user=Depends(get_current_user)):
    reason = (payload.reason or "").strip()
    if len(reason) < 3:
        raise HTTPException(status_code=400, detail="Reason must be at least 3 characters")
    # In-memory no-op; in real impl, persist for moderation
    if (not payload.post_id and not payload.comment_id) or (payload.post_id and payload.comment_id):
        raise HTTPException(status_code=400, detail="Provide either post_id or comment_id")
    return
