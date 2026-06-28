from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.models.user import Role, User
from app.utils.security import generate_refresh_token, hash_token, verify_password
from app.schemas import AuthUser

security = HTTPBearer(auto_error=False)
_jwks_cache: dict[str, Any] = {}
LOCAL_JWT_ISSUER = "nalco-w2w-local"


def _claim(payload: dict[str, Any], dotted_path: str) -> Any:
    current: Any = payload
    for part in dotted_path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


async def _get_jwks() -> dict[str, Any]:
    settings = get_settings()
    if "jwks" not in _jwks_cache:
        if not settings.supabase_url:
            raise HTTPException(status_code=500, detail={"error": "AUTH_NOT_CONFIGURED"})
        url = f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
        _jwks_cache["jwks"] = response.json()
    return _jwks_cache["jwks"]


def user_payload(user: User) -> dict[str, Any]:
    role = user.role.value if isinstance(user.role, Role) else str(user.role)
    return {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "role": role,
        "app_metadata": {"role": role},
        "companyId": user.company_id,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def user_response_payload(user: User) -> dict[str, Any]:
    role = user.role.value if isinstance(user.role, Role) else str(user.role)
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": role,
        "companyId": user.company_id,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
    }


async def authenticate_local_user(db: AsyncSession, email: str, password: str) -> User | None:
    normalized_email = email.strip().lower()
    user = await db.scalar(select(User).where(func.lower(User.email) == normalized_email))
    if user is None or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def local_development_user(db: AsyncSession) -> dict[str, Any]:
    user = await db.scalar(select(User).where(User.role == Role.NALCO_ADMIN, User.is_active.is_(True)).limit(1))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "LOCAL_USER_NOT_CONFIGURED", "message": "Seed a local admin user first"},
        )
    return user_payload(user)


def create_access_token(user: dict[str, Any]) -> tuple[str, int]:
    settings = get_settings()
    expires_at = datetime.now(UTC) + timedelta(minutes=settings.jwt_expires_minutes)
    payload = {
        "sub": user["sub"],
        "email": user.get("email"),
        "name": user.get("name"),
        "role": user.get("role"),
        "app_metadata": user.get("app_metadata", {}),
        "companyId": user.get("companyId"),
        "iss": LOCAL_JWT_ISSUER,
        "iat": int(datetime.now(UTC).timestamp()),
        "exp": int(expires_at.timestamp()),
    }
    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, settings.jwt_expires_minutes * 60


def create_refresh_token() -> tuple[str, str, datetime]:
    settings = get_settings()
    refresh_token = generate_refresh_token()
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expires_days)
    return refresh_token, hash_token(refresh_token), expires_at


def _decode_local_token(token: str) -> dict[str, Any] | None:
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
            issuer=LOCAL_JWT_ISSUER,
            options={"verify_aud": False},
        )
    except JWTError:
        return None
    payload["role"] = _claim(payload, settings.role_claim_path) or payload.get("role")
    return payload


async def get_refresh_user(db: AsyncSession, refresh_token: str) -> User | None:
    now = datetime.now(UTC)
    token_hash = hash_token(refresh_token)
    return await db.scalar(
        select(User).where(
            User.refresh_token_hash == token_hash,
            User.refresh_token_expires_at.is_not(None),
            User.refresh_token_expires_at > now,
            User.is_active.is_(True),
        )
    )


async def revoke_refresh_token(db: AsyncSession, refresh_token: str) -> bool:
    user = await get_refresh_user(db, refresh_token)
    if user is None:
        return False
    user.refresh_token_hash = None
    user.refresh_token_expires_at = None
    await db.commit()
    return True


async def verify_jwt(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: AsyncSession = Depends(get_session),
) -> dict[str, Any]:
    settings = get_settings()
    if settings.auth_disabled:
        return await local_development_user(db)
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "UNAUTHORIZED", "message": "Sign in required"},
        )

    token = credentials.credentials
    local_payload = _decode_local_token(token)
    if local_payload is not None:
        return local_payload

    try:
        header = jwt.get_unverified_header(token)
        kid = header.get("kid")
        jwks = await _get_jwks()
        key = next((item for item in jwks.get("keys", []) if item.get("kid") == kid), None)
        if key is None:
            raise JWTError("No matching JWKS key")
        payload = jwt.decode(
            token,
            key,
            algorithms=[key.get("alg", "RS256")],
            audience=settings.supabase_jwt_audience,
            options={"verify_at_hash": False},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "UNAUTHORIZED", "message": "Invalid token"},
        ) from None

    payload["role"] = _claim(payload, settings.role_claim_path) or payload.get("role")
    return payload


def require_role(*roles: str) -> Callable[[dict[str, Any]], dict[str, Any]]:
    async def dependency(user: dict[str, Any] = Depends(verify_jwt)) -> dict[str, Any]:
        actual_role = user.get("role")
        if actual_role not in roles:
            required = ", ".join(roles)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "FORBIDDEN",
                    "message": f"Insufficient permissions. Requires: {required}",
                    "yourRole": actual_role,
                },
            )
        return user

    return dependency
