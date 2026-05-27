from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, set[WebSocket]] = {}

    async def connect(self, conversation_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.setdefault(conversation_id, set()).add(websocket)

    def disconnect(self, conversation_id: str, websocket: WebSocket) -> None:
        room = self.active_connections.get(conversation_id)
        if not room:
            return
        room.discard(websocket)
        if not room:
            self.active_connections.pop(conversation_id, None)

    async def broadcast(self, conversation_id: str, payload: dict) -> None:
        for websocket in list(self.active_connections.get(conversation_id, set())):
            await websocket.send_json(payload)


manager = ConnectionManager()
