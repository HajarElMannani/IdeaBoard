from __future__ import annotations

import httpx
from typing import Any, Dict, Mapping, Optional, Tuple

from .config import settings


def _rest_base_url() -> str:
    base = settings.SUPABASE_URL.rstrip("/")
    return f"{base}/rest/v1"


def _normalize_path(path: str) -> str:
    if not path:
        return ""
    if path.startswith("/"):
        return path
    return f"/{path}"


def range_headers(page: int, page_size: int) -> Dict[str, str]:
    if page < 1:
        page = 1
    if page_size < 1:
        page_size = 1
    start = (page - 1) * page_size
    end = start + page_size - 1
    return {
        "Range": f"items={start}-{end}",
        "Prefer": "count=exact",
    }


def extract_total(content_range: Optional[str]) -> Optional[int]:
    # Content-Range example: "0-19/123" or "*/0"
    if not content_range or "/" not in content_range:
        return None
    try:
        total_part = content_range.split("/")[-1]
        return int(total_part) if total_part.isdigit() else None
    except Exception:
        return None


def _auth_headers(token: str, extra: Optional[Mapping[str, str]] = None) -> Dict[str, str]:
    headers: Dict[str, str] = {
        "Content-Type": "application/json",
    }
    # Only attach Authorization when a non-empty token is provided
    if token:
        headers["Authorization"] = f"Bearer {token}"
    # Include anon key if available (not strictly required when Authorization is present,
    # but commonly sent by supabase-js). Kept optional to avoid breaking environments.
    anon = getattr(settings, "SUPABASE_ANON_KEY", None)
    if anon:
        headers["apikey"] = anon
    if extra:
        headers.update(dict(extra))
    return headers


async def rest_get(
    path: str,
    token: str,
    params: Optional[Mapping[str, Any]] = None,
    headers: Optional[Mapping[str, str]] = None,
) -> Tuple[Any, Optional[int]]:
    url = _rest_base_url() + _normalize_path(path)
    req_headers = _auth_headers(token, headers)
    # Ensure exact count when paginating
    if "Prefer" not in req_headers:
        req_headers["Prefer"] = "count=exact"
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, headers=req_headers, params=params)
        resp.raise_for_status()
        total = extract_total(resp.headers.get("content-range") or resp.headers.get("Content-Range"))
        data = resp.json() if resp.content else None
        return data, total


async def rest_post(
    path: str,
    token: str,
    json: Any,
    headers: Optional[Mapping[str, str]] = None,
) -> Any:
    url = _rest_base_url() + _normalize_path(path)
    req_headers = _auth_headers(token, headers)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.post(url, headers=req_headers, json=json)
        resp.raise_for_status()
        return resp.json() if resp.content else None


async def rest_delete(
    path: str,
    token: str,
    headers: Optional[Mapping[str, str]] = None,
) -> None:
    url = _rest_base_url() + _normalize_path(path)
    req_headers = _auth_headers(token, headers)
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.delete(url, headers=req_headers)
        resp.raise_for_status()
        return None


