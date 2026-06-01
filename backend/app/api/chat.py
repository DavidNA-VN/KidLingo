from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_teacher
from app.models.user import User
from app.schemas.chat import (
    ClassGroupConversationCreate,
    ClassGroupMembersResponse,
    ConversationCreate,
    ConversationSummary,
    MessageCreate,
    MessagePublic,
)
from app.services.chat_service import (
    create_message,
    create_or_get_class_group_conversation,
    create_or_get_teacher_conversation,
    get_class_group_members,
    list_conversations,
    list_messages,
)
from app.services.audit_service import AuditAction, commit_audit_event, get_request_context

router = APIRouter(prefix="/chat", tags=["chat"])


@router.get("/conversations", response_model=list[ConversationSummary])
def get_conversations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[ConversationSummary]:
    return list_conversations(db, current_user)


@router.post("/conversations", response_model=ConversationSummary)
def post_conversation(
    payload: ConversationCreate,
    request: Request,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> ConversationSummary:
    try:
        conversation = create_or_get_teacher_conversation(
            db,
            current_user,
            payload.parent_id,
            class_id=payload.class_id,
            child_id=payload.child_id,
            context_message=payload.context_message,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    commit_audit_event(
        db,
        action=AuditAction.CHAT_CONVERSATION_CREATED,
        actor=current_user,
        category="CHAT",
        resource_type="CONVERSATION",
        resource_id=conversation.id,
        request_context=get_request_context(request),
        metadata={"conversation_type": conversation.conversation_type, "class_id": conversation.class_id, "child_id": conversation.child_id},
    )
    return conversation


@router.post("/class-groups", response_model=ConversationSummary)
def post_class_group_conversation(
    payload: ClassGroupConversationCreate,
    request: Request,
    current_user: Annotated[User, Depends(require_teacher)],
    db: Annotated[Session, Depends(get_db)],
) -> ConversationSummary:
    try:
        conversation = create_or_get_class_group_conversation(
            db,
            current_user,
            payload.class_id,
            context_message=payload.context_message,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    commit_audit_event(
        db,
        action=AuditAction.CHAT_CONVERSATION_CREATED,
        actor=current_user,
        category="CHAT",
        resource_type="CONVERSATION",
        resource_id=conversation.id,
        request_context=get_request_context(request),
        metadata={"conversation_type": conversation.conversation_type, "class_id": conversation.class_id},
    )
    return conversation


@router.get("/conversations/{conversation_id}/messages", response_model=list[MessagePublic])
def get_conversation_messages(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[MessagePublic]:
    messages = list_messages(db, current_user, conversation_id)
    if messages is None:
        raise HTTPException(status_code=404, detail="CONVERSATION_NOT_FOUND")
    return messages


@router.get("/conversations/{conversation_id}/members", response_model=ClassGroupMembersResponse)
def get_conversation_members(
    conversation_id: UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> ClassGroupMembersResponse:
    members = get_class_group_members(db, current_user, conversation_id)
    if members is None:
        raise HTTPException(status_code=404, detail="CLASS_GROUP_NOT_FOUND")
    return members


@router.post("/conversations/{conversation_id}/messages", response_model=MessagePublic)
def post_conversation_message(
    conversation_id: UUID,
    payload: MessageCreate,
    request: Request,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> MessagePublic:
    message = create_message(
        db,
        current_user,
        conversation_id,
        payload.body,
        request_context=get_request_context(request),
    )
    if not message:
        raise HTTPException(status_code=404, detail="CONVERSATION_NOT_FOUND")
    return message
