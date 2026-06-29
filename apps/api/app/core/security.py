from __future__ import annotations

import base64
import binascii
import logging
from typing import Any

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models import User

bearer_scheme = HTTPBearer(auto_error=False)
logger = logging.getLogger(__name__)


def _is_auth_debug_enabled() -> bool:
    return settings.ALLOW_DEV_AUTH or settings.CLERK_AUTH_DEBUG


def _debug_auth(message: str, **values: Any) -> None:
    if _is_auth_debug_enabled():
        logger.debug("Clerk auth: %s %s", message, values)


def _auth_error(detail: str = "Invalid authentication credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _get_claim_value(claims: dict[str, Any], *keys: str) -> str | None:
    for key in keys:
        value = claims.get(key)

        if isinstance(value, str) and value.strip():
            return value.strip()

    return None


def _get_metadata_role(claims: dict[str, Any]) -> str | None:
    for key in ("role", "org_role"):
        value = claims.get(key)

        if isinstance(value, str) and value.strip():
            return value.strip()

    for metadata_key in ("public_metadata", "private_metadata", "metadata"):
        metadata = claims.get(metadata_key)

        if isinstance(metadata, dict):
            role = metadata.get("role")

            if isinstance(role, str) and role.strip():
                return role.strip()

    return None


def _extract_clerk_profile(claims: dict[str, Any]) -> dict[str, Any]:
    return {
        "clerk_uid": _get_claim_value(claims, "sub", "user_id"),
        "email": _get_claim_value(claims, "email", "email_address"),
        "username": _get_claim_value(claims, "username", "preferred_username"),
        "full_name": _get_claim_value(claims, "name", "full_name"),
        "avatar_url": _get_claim_value(claims, "picture", "image_url", "avatar_url"),
        "role": _get_metadata_role(claims) or "user",
    }


def _extract_clerk_api_profile(payload: dict[str, Any]) -> dict[str, Any]:
    email = None
    primary_email_id = payload.get("primary_email_address_id")

    for email_address in payload.get("email_addresses", []):
        if email_address.get("id") == primary_email_id:
            email = email_address.get("email_address")
            break

    if not email and payload.get("email_addresses"):
        email = payload["email_addresses"][0].get("email_address")

    first_name = payload.get("first_name") or ""
    last_name = payload.get("last_name") or ""
    full_name = " ".join([first_name, last_name]).strip() or None
    metadata = payload.get("public_metadata") or {}

    return {
        "email": email,
        "username": payload.get("username"),
        "full_name": full_name,
        "avatar_url": payload.get("image_url"),
        "role": metadata.get("role") or "user",
    }


def _fetch_clerk_user_profile(clerk_uid: str) -> dict[str, Any]:
    if not settings.CLERK_SECRET_KEY:
        return {}

    try:
        response = httpx.get(
            f"https://api.clerk.com/v1/users/{clerk_uid}",
            headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
            timeout=8,
        )
        response.raise_for_status()

    except httpx.HTTPError:
        return {}

    return _extract_clerk_api_profile(response.json())


def _normalize_issuer(value: str | None) -> str | None:
    if not value:
        return None

    return value.strip().rstrip("/")


def _derive_issuer_from_publishable_key() -> str | None:
    publishable_key = settings.CLERK_PUBLISHABLE_KEY

    if not publishable_key:
        return None

    try:
        encoded_instance = publishable_key.split("_", 2)[2]
    except IndexError:
        return None

    padding = "=" * (-len(encoded_instance) % 4)

    try:
        decoded = base64.urlsafe_b64decode(
            f"{encoded_instance}{padding}".encode("ascii")
        ).decode("utf-8")
    except (binascii.Error, UnicodeDecodeError, ValueError):
        return None

    host = decoded.rstrip("$").strip()

    if not host:
        return None

    if host.startswith("http://") or host.startswith("https://"):
        return _normalize_issuer(host)

    return f"https://{host}"


def _get_expected_clerk_issuer() -> str | None:
    return _normalize_issuer(settings.CLERK_ISSUER) or _derive_issuer_from_publishable_key()


def _build_jwks_url(issuer: str) -> str:
    if settings.CLERK_JWKS_URL:
        return settings.CLERK_JWKS_URL

    return f"{issuer}/.well-known/jwks.json"


def _decode_clerk_token(token: str) -> dict[str, Any]:
    try:
        import jwt
        from jwt import PyJWKClient

    except ModuleNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="PyJWT is required for Clerk token verification",
        ) from exc

    token_issuer = None
    token_kid = None
    jwks_url = None

    try:
        header = jwt.get_unverified_header(token)
        claims = jwt.decode(token, options={"verify_signature": False})

        token_issuer = _normalize_issuer(claims.get("iss"))
        token_kid = header.get("kid")
        expected_issuer = _get_expected_clerk_issuer()

        if not token_issuer:
            raise _auth_error()

        if expected_issuer and token_issuer != expected_issuer:
            raise _auth_error()

        jwks_url = _build_jwks_url(token_issuer)
        _debug_auth(
            "verifying token",
            issuer=token_issuer,
            kid=token_kid,
            jwks_url=jwks_url,
        )

        jwk_client = PyJWKClient(jwks_url)
        signing_key = jwk_client.get_signing_key_from_jwt(token)

        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["RS256"],
            issuer=token_issuer,
            options={"verify_aud": False},
        )

    except Exception as exc:
        _debug_auth(
            "verification failed",
            issuer=token_issuer,
            kid=token_kid,
            jwks_url=jwks_url,
            exception_type=type(exc).__name__,
            exception_message=str(exc),
        )
        raise _auth_error() from exc


def _sync_user_from_profile(db: Session, profile: dict[str, Any]) -> User:
    clerk_uid = profile.get("clerk_uid")

    if not clerk_uid:
        raise _auth_error("Clerk token is missing a user id")

    user = db.query(User).filter(User.clerk_uid == clerk_uid).first()

    if not user and profile.get("email"):
        user = db.query(User).filter(User.email == profile["email"]).first()

    if not user:
        user = User(clerk_uid=clerk_uid, auth_provider="clerk")
        db.add(user)

    role = profile.get("role") or user.role or "user"
    is_admin_role = role.lower() in {"admin", "owner", "superuser"}

    user.clerk_uid = clerk_uid
    user.auth_provider = "clerk"
    user.email = profile.get("email") or user.email
    user.username = profile.get("username") or user.username
    user.full_name = profile.get("full_name") or user.full_name
    user.avatar_url = profile.get("avatar_url") or user.avatar_url
    user.role = role
    user.is_superuser = user.is_superuser or is_admin_role

    db.commit()
    db.refresh(user)

    return user


def _get_dev_user(db: Session) -> User:
    user = db.query(User).filter(User.clerk_uid == "dev-admin").first()

    if not user:
        user = User(
            email="dev-admin@moneysignal.local",
            username="dev-admin",
            full_name="Development Admin",
            role="admin",
            is_superuser=True,
            clerk_uid="dev-admin",
            auth_provider="dev",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise _auth_error("Missing bearer token")

    token = credentials.credentials

    if settings.ALLOW_DEV_AUTH and token == "dev-admin":
        return _get_dev_user(db)

    claims = _decode_clerk_token(token)
    profile = _extract_clerk_profile(claims)
    clerk_uid = profile.get("clerk_uid")

    if not clerk_uid:
        raise _auth_error("Clerk token is missing a user id")

    if not profile.get("email"):
        profile = {
            **profile,
            **{
                key: value
                for key, value in _fetch_clerk_user_profile(clerk_uid).items()
                if value
            },
        }

    user = _sync_user_from_profile(db, profile)

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive",
        )

    return user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.is_superuser or current_user.role.lower() in {
        "admin",
        "owner",
        "superuser",
    }:
        return current_user

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Admin access required",
    )
