from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import base64
import cv2
import numpy as np
from ml_engine import SmartSessionEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SmartSessionEngine()

class ConnectionManager:
    def __init__(self):
        self.teacher_connections = []

    async def connect_teacher(self, websocket: WebSocket):
        await websocket.accept()
        self.teacher_connections.append(websocket)

    def disconnect_teacher(self, websocket: WebSocket):
        self.teacher_connections.remove(websocket)

    async def broadcast_to_teachers(self, data: dict):
        for connection in self.teacher_connections:
            await connection.send_json(data)

manager = ConnectionManager()

@app.get("/")
def read_root():
    return {"message": "SmartSession Backend is Running"}

@app.websocket("/ws/student")
async def student_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            
            if "base64," in data:
                encoded_data = data.split(",")[1]
            else:
                encoded_data = data
                
            nparr = np.frombuffer(base64.b64decode(encoded_data), np.uint8)
            frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if frame is not None:
                analysis = engine.analyze_frame(frame)
                await websocket.send_json(analysis)
                await manager.broadcast_to_teachers(analysis)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"Error: {e}")

@app.websocket("/ws/teacher")
async def teacher_endpoint(websocket: WebSocket):
    await manager.connect_teacher(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect_teacher(websocket)