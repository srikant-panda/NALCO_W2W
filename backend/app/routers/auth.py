from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_session
from app.dependencies.auth import (
    authenticate_local_user,
    create_access_token,
    create_refresh_token,
    get_refresh_user,
    revoke_refresh_token,
    user_response_payload,
    user_payload,
    verify_jwt,
)
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def _refresh_cookie_secure() -> bool:
    return get_settings().frontend_url.startswith("https://")


def _set_refresh_cookie(response: Response, refresh_token: str, max_age: int) -> None:
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="none" if _refresh_cookie_secure() else "lax",
        secure=_refresh_cookie_secure(),
        max_age=max_age,
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key="refresh_token",
        httponly=True,
        samesite="none" if _refresh_cookie_secure() else "lax",
        secure=_refresh_cookie_secure(),
    )


@router.get("/config")
async def auth_config() -> dict:
    settings = get_settings()
    return {
        "authDisabled": settings.auth_disabled,
        "mode": "local" if settings.auth_disabled else "password",
    }


@router.post("/login")
async def login(payload: LoginRequest, response: Response, db: AsyncSession = Depends(get_session)) -> LoginResponse:
    user = await authenticate_local_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_CREDENTIALS", "message": "Invalid email or password"},
        )

    access_token, expires_in = create_access_token(user_payload(user))
    refresh_token, refresh_hash, refresh_expires_at = create_refresh_token()
    user.refresh_token_hash = refresh_hash
    user.refresh_token_expires_at = refresh_expires_at
    db.add(user)
    await db.commit()
    refresh_expires_in = int((refresh_expires_at - datetime.now(UTC)).total_seconds())
    _set_refresh_cookie(response, refresh_token, refresh_expires_in)

    return LoginResponse(
        token=access_token,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_response_payload(user),
    )


@router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> LoginResponse:
    incoming_refresh_token = request.cookies.get("refresh_token")
    if not incoming_refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_REFRESH_TOKEN", "message": "Session expired. Sign in again."},
        )

    user = await get_refresh_user(db, incoming_refresh_token)
    if user is None:
        _clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "INVALID_REFRESH_TOKEN", "message": "Session expired. Sign in again."},
        )

    access_token, expires_in = create_access_token(user_payload(user))
    refresh_token, refresh_hash, refresh_expires_at = create_refresh_token()
    user.refresh_token_hash = refresh_hash
    user.refresh_token_expires_at = refresh_expires_at
    db.add(user)
    await db.commit()
    refresh_expires_in = int((refresh_expires_at - datetime.now(UTC)).total_seconds())
    _set_refresh_cookie(response, refresh_token, refresh_expires_in)

    return LoginResponse(
        token=access_token,
        tokenType="bearer",
        expiresIn=expires_in,
        user=user_response_payload(user),
    )


@router.post("/logout")
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_session),
) -> dict:
    refresh_token = request.cookies.get("refresh_token")
    revoked = await revoke_refresh_token(db, refresh_token) if refresh_token else False
    _clear_refresh_cookie(response)
    return {"ok": True, "revoked": revoked}


@router.get("/me")
async def me(user=Depends(verify_jwt)) -> dict:
    return {
        "user": {
            "id": user.get("sub"),
            "email": user.get("email"),
            "name": user.get("user_metadata", {}).get("name") or user.get("name"),
            "role": user.get("role"),
            "companyId": user.get("companyId"),
            "createdAt": user.get("created_at"),
        },
        "tokenValid": True,
    }
