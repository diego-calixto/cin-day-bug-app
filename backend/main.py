import uuid
import json
import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Set

from .database import (
    init_db,
    create_player,
    get_player,
    end_player_session,
    add_bug_report,
    get_top_10
)

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cin-day-backend")

app = FastAPI(title="CIN-DAY Motorola Challenge Backend")

# Enable CORS for frontend accessibility from any local or web IP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup DB Initialization
@app.on_event("startup")
def startup_event():
    init_db()
    logger.info("Database initialized successfully.")

# Request Models
class PlayerCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=30)

class BugReportCreate(BaseModel):
    player_id: str
    bug_id: str
    title: str = Field(..., min_length=3)
    description: str = Field(..., min_length=10)

# Real-time WebSocket Leaderboard Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"New client connected. Total connections: {len(self.active_connections)}")
        # Send initial leaderboard immediately upon connection
        await self.send_leaderboard_to_one(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"Client disconnected. Total connections: {len(self.active_connections)}")

    async def send_leaderboard_to_one(self, websocket: WebSocket):
        try:
            top_10 = get_top_10()
            await websocket.send_text(json.dumps({"type": "leaderboard", "data": top_10}))
        except Exception as e:
            logger.error(f"Error sending leaderboard to single client: {e}")

    async def broadcast_leaderboard(self):
        if not self.active_connections:
            return
        
        top_10 = get_top_10()
        message = json.dumps({"type": "leaderboard", "data": top_10})
        
        # Gather disconnected clients to clean up
        disconnected: List[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")
                disconnected.append(connection)
                
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

# --- API REST Endpoints ---

@app.get("/api/players/top10")
async def get_leaderboard_rest():
    """Fallback rest endpoint for polling the top 10."""
    try:
        return get_top_10()
    except Exception as e:
        logger.error(f"Error fetching top 10: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve leaderboard."
        )

@app.post("/api/players", status_code=status.HTTP_201_CREATED)
async def register_player(player_in: PlayerCreate):
    name_cleaned = player_in.name.strip()
    if not name_cleaned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name cannot be empty or only spaces."
        )
    
    player_id = str(uuid.uuid4())
    try:
        player = create_player(player_id, name_cleaned)
        # Broadcast updated leaderboard (even with 0 points, they are a new entry)
        await manager.broadcast_leaderboard()
        return player
    except Exception as e:
        logger.error(f"Error registering player: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register player."
        )

@app.get("/api/players/{player_id}")
async def fetch_player(player_id: str):
    player = get_player(player_id)
    if not player:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found."
        )
    return player

@app.post("/api/players/{player_id}/end")
async def end_session(player_id: str):
    success = end_player_session(player_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Player not found or session already ended."
        )
    # Broadcast updated leaderboard with finalized session status
    await manager.broadcast_leaderboard()
    return {"success": True, "message": "Player session ended successfully."}

@app.post("/api/bug_reports")
async def submit_bug_report(report_in: BugReportCreate):
    report_id = str(uuid.uuid4())
    success, score, msg = add_bug_report(
        report_id,
        report_in.player_id,
        report_in.bug_id,
        report_in.title.strip(),
        report_in.description.strip()
    )
    
    if not success:
        # Return HTTP 400 Bad Request with the reason (e.g. session ended, duplicate, etc.)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=msg
        )
    
    # Broadcast leaderboard since a score changed!
    await manager.broadcast_leaderboard()
    return {"success": True, "score": score, "message": msg}

# --- WebSocket Leaderboard Endpoint ---

@app.websocket("/ws/leaderboard")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We don't expect messages from the clients, but we must listen to detect disconnects
            data = await websocket.receive_text()
            logger.info(f"Received unexpected websocket data: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)
