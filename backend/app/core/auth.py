from jose import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import httpx, time
import asyncio

from .config import settings

bearer = HTTPBearer(auto_error=False)
_jwks_cache = {"keys": None, "ts": 0}
_jwks_lock = asyncio.Lock()

async def _get_jwks():
    # cache JWKS for 5 minutes
    async with _jwks_lock:
        if not _jwks_cache["keys"] or time.time() - _jwks_cache["ts"] > 300:
            async with httpx.AsyncClient(timeout=5) as client:
                resp = await client.get(settings.SUPABASE_JWKS_URL)
                resp.raise_for_status()
                _jwks_cache["keys"] = resp.json()["keys"]
                _jwks_cache["ts"] = time.time()
        return _jwks_cache["keys"]

async def get_current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)):
    if not creds or not creds.scheme.lower() == "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    token = creds.credentials
    header = jwt.get_unverified_header(token)
    keys = await _get_jwks()
    key = next((k for k in keys if k.get("kid") == header.get("kid")), None)
    if not key:
        raise HTTPException(status_code=401, detail="Invalid key id")
    try:
        claims = jwt.decode(
            token,
            key,
            algorithms=[header.get("alg", "RS256")],
            audience="authenticated",
            issuer=settings.SUPABASE_ISSUER,
        )
        # Return both verified claims and the raw access token so we can
        # forward it to Supabase REST where RLS policies apply.
        return {"claims": claims, "token": token}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
