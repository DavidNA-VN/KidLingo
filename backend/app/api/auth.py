from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user,
    get_user_by_email,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserPublic
from app.services.audit_service import AuditAction, commit_audit_event, get_request_context

router = APIRouter(prefix="/auth", tags=["auth"])

ALLOWED_ROLES = {"TEACHER", "PARENT"}


@router.post("/register", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, request: Request, db: Annotated[Session, Depends(get_db)]) -> User:
    email = payload.email.lower().strip()
    role = payload.role.upper().strip()

    if role not in ALLOWED_ROLES:
        commit_audit_event(
            db,
            action=AuditAction.AUTH_REGISTER_REJECTED,
            actor_email=email,
            actor_role=role,
            result="DENIED",
            category="AUTH",
            request_context=get_request_context(request),
            metadata={"reason": "INVALID_ROLE"},
        )
        raise HTTPException(status_code=400, detail="INVALID_ROLE")

    if get_user_by_email(db, email):
        commit_audit_event(
            db,
            action=AuditAction.AUTH_REGISTER_REJECTED,
            actor_email=email,
            actor_role=role,
            result="FAILURE",
            category="AUTH",
            request_context=get_request_context(request),
            metadata={"reason": "EMAIL_EXISTS"},
        )
        raise HTTPException(status_code=409, detail="EMAIL_EXISTS")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=role,
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        commit_audit_event(
            db,
            action=AuditAction.AUTH_REGISTER_REJECTED,
            actor_email=email,
            actor_role=role,
            result="FAILURE",
            category="AUTH",
            request_context=get_request_context(request),
            metadata={"reason": "EMAIL_EXISTS"},
        )
        raise HTTPException(status_code=409, detail="EMAIL_EXISTS") from exc
    db.refresh(user)
    commit_audit_event(
        db,
        action=AuditAction.AUTH_REGISTER_SUCCESS,
        actor=user,
        category="AUTH",
        resource_type="USER",
        resource_id=user.id,
        request_context=get_request_context(request),
    )
    return user


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, request: Request, db: Annotated[Session, Depends(get_db)]) -> TokenResponse:
    email = payload.email.lower().strip()
    user = get_user_by_email(db, email)
    if not user or not verify_password(payload.password, user.password_hash):
        commit_audit_event(
            db,
            action=AuditAction.AUTH_LOGIN_FAILED,
            actor_email=email,
            actor_role=user.role if user else None,
            result="FAILURE",
            category="AUTH",
            request_context=get_request_context(request),
            metadata={"reason": "INVALID_CREDENTIALS"},
        )
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="INVALID_CREDENTIALS")

    access_token = create_access_token(subject=str(user.id), role=user.role)
    commit_audit_event(
        db,
        action=AuditAction.AUTH_LOGIN_SUCCESS,
        actor=user,
        category="AUTH",
        resource_type="USER",
        resource_id=user.id,
        request_context=get_request_context(request),
    )
    return TokenResponse(access_token=access_token, user=UserPublic.model_validate(user))


@router.get("/me", response_model=UserPublic)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    return current_user
