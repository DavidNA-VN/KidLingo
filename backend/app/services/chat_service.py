from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models.chat import Conversation, Message
from app.models.child import Child, ClassChild
from app.models.classroom import Class
from app.models.user import User
from app.schemas.chat import ClassGroupMember, ClassGroupMembersResponse, ConversationSummary, MessagePublic


DIRECT = "DIRECT"
CLASS_GROUP = "CLASS_GROUP"


def _null_safe(field, value):
    return field.is_(None) if value is None else field == value


def _conversation_scope_query(teacher_id: UUID, parent_id: UUID, class_id: UUID | None, child_id: UUID | None):
    return select(Conversation).where(
        Conversation.conversation_type == DIRECT,
        Conversation.teacher_id == teacher_id,
        Conversation.parent_id == parent_id,
        _null_safe(Conversation.class_id, class_id),
        _null_safe(Conversation.child_id, child_id),
    )


def _parent_has_active_class_membership(db: Session, parent_id: UUID, class_id: UUID | None) -> bool:
    if not class_id:
        return False
    return (
        db.scalar(
            select(ClassChild)
            .join(Child, Child.id == ClassChild.child_id)
            .where(
                Child.parent_id == parent_id,
                Child.status == "ACTIVE",
                ClassChild.class_id == class_id,
                ClassChild.status == "ACTIVE",
            )
            .limit(1)
        )
        is not None
    )


def _parent_group_filter(parent_id: UUID):
    return and_(
        Conversation.conversation_type == CLASS_GROUP,
        Conversation.class_id.in_(
            select(ClassChild.class_id)
            .join(Child, Child.id == ClassChild.child_id)
            .where(
                Child.parent_id == parent_id,
                Child.status == "ACTIVE",
                ClassChild.status == "ACTIVE",
            )
        ),
    )


def user_can_access_conversation(db: Session, user_id: UUID, conversation_id: UUID) -> Conversation | None:
    user = db.get(User, user_id)
    if not user:
        return None
    conversation = db.get(Conversation, conversation_id)
    if not conversation:
        return None
    if conversation.teacher_id == user_id:
        return conversation
    if conversation.conversation_type == DIRECT and conversation.parent_id == user_id:
        return conversation
    if user.role == "PARENT" and conversation.conversation_type == CLASS_GROUP and _parent_has_active_class_membership(
        db, user_id, conversation.class_id
    ):
        return conversation
    return None


def _get_class_group_conversation(db: Session, teacher_id: UUID, class_id: UUID) -> Conversation | None:
    return db.scalar(
        select(Conversation).where(
            Conversation.conversation_type == CLASS_GROUP,
            Conversation.teacher_id == teacher_id,
            Conversation.class_id == class_id,
        )
    )


def validate_teacher_context(
    db: Session,
    teacher_id: UUID,
    parent_id: UUID,
    class_id: UUID | None,
    child_id: UUID | None,
) -> None:
    parent = db.get(User, parent_id)
    if not parent or parent.role != "PARENT":
        raise ValueError("PARENT_NOT_FOUND")

    if class_id:
        classroom = db.scalar(select(Class).where(Class.id == class_id, Class.teacher_id == teacher_id))
        if not classroom:
            raise ValueError("CLASS_NOT_FOUND")

    if child_id:
        child = db.scalar(select(Child).where(Child.id == child_id, Child.parent_id == parent_id))
        if not child:
            raise ValueError("CHILD_NOT_FOUND")
        if class_id:
            membership = db.scalar(
                select(ClassChild).where(
                    ClassChild.class_id == class_id,
                    ClassChild.child_id == child_id,
                    ClassChild.status == "ACTIVE",
                )
            )
            if not membership:
                raise ValueError("CHILD_NOT_IN_CLASS")


def _to_conversation_summary(db: Session, conversation: Conversation) -> ConversationSummary:
    last_message = db.scalar(
        select(Message)
        .where(Message.conversation_id == conversation.id)
        .order_by(Message.created_at.desc())
        .limit(1)
    )
    message_count = db.scalar(
        select(func.count(Message.id)).where(Message.conversation_id == conversation.id)
    )
    return ConversationSummary(
        id=conversation.id,
        conversation_type=conversation.conversation_type,
        teacher_id=conversation.teacher_id,
        teacher_name=conversation.teacher.full_name,
        parent_id=conversation.parent_id,
        parent_name=conversation.parent.full_name if conversation.parent else None,
        parent_email=conversation.parent.email if conversation.parent else None,
        class_id=conversation.class_id,
        class_name=conversation.classroom.name if conversation.classroom else None,
        child_id=conversation.child_id,
        child_name=conversation.child.display_name if conversation.child else None,
        last_message=last_message.body if last_message else None,
        last_message_at=last_message.created_at if last_message else None,
        message_count=int(message_count or 0),
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
    )


def list_conversations(db: Session, user: User) -> list[ConversationSummary]:
    query = select(Conversation).where(Conversation.teacher_id == user.id)
    if user.role == "PARENT":
        query = select(Conversation).where(
            or_(
                and_(Conversation.conversation_type == DIRECT, Conversation.parent_id == user.id),
                _parent_group_filter(user.id),
            )
        )
    conversations = db.scalars(query.order_by(Conversation.updated_at.desc(), Conversation.created_at.desc())).all()
    return [_to_conversation_summary(db, conversation) for conversation in conversations]


def create_or_get_teacher_conversation(
    db: Session,
    teacher: User,
    parent_id: UUID,
    *,
    class_id: UUID | None = None,
    child_id: UUID | None = None,
    context_message: str | None = None,
) -> ConversationSummary:
    validate_teacher_context(db, teacher.id, parent_id, class_id, child_id)
    conversation = db.scalar(_conversation_scope_query(teacher.id, parent_id, class_id, child_id))
    if not conversation:
        conversation = Conversation(
            conversation_type=DIRECT,
            teacher_id=teacher.id,
            parent_id=parent_id,
            class_id=class_id,
            child_id=child_id,
        )
        db.add(conversation)
        db.flush()

    if context_message and context_message.strip():
        db.add(Message(conversation_id=conversation.id, sender_id=teacher.id, body=context_message.strip()))
        conversation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(conversation)
    return _to_conversation_summary(db, conversation)


def create_or_get_class_group_conversation(
    db: Session,
    teacher: User,
    class_id: UUID,
    context_message: str | None = None,
) -> ConversationSummary:
    classroom = db.scalar(select(Class).where(Class.id == class_id, Class.teacher_id == teacher.id))
    if not classroom:
        raise ValueError("CLASS_NOT_FOUND")

    conversation = _get_class_group_conversation(db, teacher.id, class_id)
    if not conversation:
        conversation = Conversation(
            conversation_type=CLASS_GROUP,
            teacher_id=teacher.id,
            parent_id=None,
            class_id=class_id,
            child_id=None,
        )
        db.add(conversation)
        db.flush()

    if context_message and context_message.strip():
        db.add(Message(conversation_id=conversation.id, sender_id=teacher.id, body=context_message.strip()))
        conversation.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(conversation)
    return _to_conversation_summary(db, conversation)


def list_messages(db: Session, user: User, conversation_id: UUID) -> list[MessagePublic] | None:
    conversation = user_can_access_conversation(db, user.id, conversation_id)
    if not conversation:
        return None
    messages = db.scalars(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()
    return [_to_message_public(message, user.id) for message in messages]


def get_class_group_members(db: Session, user: User, conversation_id: UUID) -> ClassGroupMembersResponse | None:
    conversation = user_can_access_conversation(db, user.id, conversation_id)
    if not conversation or conversation.conversation_type != CLASS_GROUP or not conversation.class_id:
        return None

    rows = db.execute(
        select(ClassChild, Child, User)
        .join(Child, Child.id == ClassChild.child_id)
        .join(User, User.id == Child.parent_id)
        .where(
            ClassChild.class_id == conversation.class_id,
            ClassChild.status == "ACTIVE",
            Child.status == "ACTIVE",
        )
        .order_by(Child.display_name.asc(), User.full_name.asc())
    ).all()

    return ClassGroupMembersResponse(
        conversation_id=conversation.id,
        class_id=conversation.class_id,
        class_name=conversation.classroom.name if conversation.classroom else "",
        members=[
            ClassGroupMember(
                child_id=child.id,
                child_name=child.display_name,
                parent_id=parent.id,
                parent_name=parent.full_name,
                parent_email=parent.email,
                membership_status=link.status,
            )
            for link, child, parent in rows
        ],
    )


def _to_message_public(message: Message, current_user_id: UUID) -> MessagePublic:
    return MessagePublic(
        id=message.id,
        conversation_id=message.conversation_id,
        sender_id=message.sender_id,
        sender_name=message.sender.full_name,
        sender_role=message.sender.role,
        body=message.body,
        read_at=message.read_at,
        created_at=message.created_at,
        is_mine=message.sender_id == current_user_id,
    )


def create_message(db: Session, user: User, conversation_id: UUID, body: str) -> MessagePublic | None:
    conversation = user_can_access_conversation(db, user.id, conversation_id)
    if not conversation:
        return None
    message = Message(conversation_id=conversation_id, sender_id=user.id, body=body.strip())
    conversation.updated_at = datetime.now(timezone.utc)
    db.add(message)
    db.commit()
    db.refresh(message)
    return _to_message_public(message, user.id)
