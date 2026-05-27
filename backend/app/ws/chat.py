from uuid import UUID

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status
from jose import JWTError, jwt

from app.core.config import get_settings
from app.core.database import SessionLocal
from app.models.user import User
from app.services.chat_service import create_message, user_can_access_conversation
from app.ws.manager import manager

router = APIRouter(tags=["chat-websocket"])


def authenticate_websocket_user(token: str) -> User | None:
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
    except JWTError:
        return None
    if not user_id:
        return None
    with SessionLocal() as db:
        return db.get(User, user_id)


@router.websocket("/ws/conversations/{conversation_id}")
async def conversation_websocket(
    websocket: WebSocket,
    conversation_id: UUID,
    token: str = Query(...),
) -> None:
    user = authenticate_websocket_user(token)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    with SessionLocal() as db:
        if not user_can_access_conversation(db, user.id, conversation_id):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

    room_id = str(conversation_id)
    await manager.connect(room_id, websocket)
    try:
        while True:
            body = await websocket.receive_text()
            if not body.strip():
                continue
            with SessionLocal() as db:
                fresh_user = db.get(User, user.id)
                if not fresh_user:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                    return
                message = create_message(db, fresh_user, conversation_id, body)
                if not message:
                    await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                    return
                await manager.broadcast(room_id, message.model_dump(mode="json"))
    except WebSocketDisconnect:
        manager.disconnect(room_id, websocket)
