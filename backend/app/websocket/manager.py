from fastapi import WebSocket


class ConnectionManager:
    def __init__(self) -> None:
        self.rooms: dict[str, set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room: str) -> None:
        await websocket.accept()
        self.rooms.setdefault(room, set()).add(websocket)

    def disconnect(self, websocket: WebSocket, room: str) -> None:
        sockets = self.rooms.get(room)
        if not sockets:
            return
        sockets.discard(websocket)
        if not sockets:
            self.rooms.pop(room, None)

    async def broadcast(self, room: str, data: dict) -> None:
        sockets = list(self.rooms.get(room, set()))
        dead: list[WebSocket] = []
        for websocket in sockets:
            try:
                await websocket.send_json(data)
            except Exception:
                dead.append(websocket)
        for websocket in dead:
            self.disconnect(websocket, room)


manager = ConnectionManager()
