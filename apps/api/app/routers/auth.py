from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models import User

router = APIRouter(prefix="/auth", tags=["Auth"])


def serialize_user(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "fullName": user.full_name,
        "avatarUrl": user.avatar_url,
        "role": user.role,
        "isActive": user.is_active,
        "isSuperuser": user.is_superuser,
        "clerkUid": user.clerk_uid,
        "authProvider": user.auth_provider,
        "createdAt": user.created_at.isoformat() if user.created_at else None,
        "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)


@router.post("/clerk-sync")
def sync_clerk_user(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)
