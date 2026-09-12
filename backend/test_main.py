import os
import pytest
from fastapi.testclient import TestClient

# Use a test database path
os.environ["CIN_DAY_TEST"] = "1"
import backend.database as db
db.DB_PATH = os.path.join(os.path.dirname(__file__), "test_cin_day.db")

from backend.main import app

client = TestClient(app)

@pytest.fixture(autouse=True)
def run_around_tests():
    # Remove existing test DB if any
    if os.path.exists(db.DB_PATH):
        os.remove(db.DB_PATH)
    
    # Initialize DB
    db.init_db()
    yield
    
    # Clean up test DB after tests run
    if os.path.exists(db.DB_PATH):
        os.remove(db.DB_PATH)

def test_register_player():
    # Test valid registration
    response = client.post("/api/players", json={"name": "Alice"})
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["name"] == "Alice"
    assert data["score"] == 0
    assert data["session_ended"] is False

    # Test invalid registration (empty)
    response_empty = client.post("/api/players", json={"name": ""})
    assert response_empty.status_code == 422 # FastAPI validation error

    # Test invalid registration (spaces)
    response_spaces = client.post("/api/players", json={"name": "   "})
    assert response_spaces.status_code == 400
    assert "detail" in response_spaces.json()

def test_submit_bug_report_and_scoring():
    # 1. Register player
    reg_res = client.post("/api/players", json={"name": "Bob"})
    player_id = reg_res.json()["id"]

    # 2. Submit bug report
    # Base easy (100) + Quality bonus (100 - keywords: negative, price) + Time remaining (120 * 2 = 240) + Streak (0) = 440 points
    rep_res = client.post("/api/bug_reports", json={
        "player_id": player_id,
        "bug_id": "bug_price",
        "title": "Negative price issue",
        "description": "The product has a negative price in the catalog.",
        "seconds_remaining": 120,
        "streak_count": 1
    })
    assert rep_res.status_code == 200
    rep_data = rep_res.json()
    assert rep_data["success"] is True
    assert rep_data["score"] == 440
    assert rep_data["points_added"] == 440

    # 3. Double-check player score is updated
    p_res = client.get(f"/api/players/{player_id}")
    assert p_res.json()["score"] == 440

    # 4. Submit duplicate report (anti-spam test)
    dup_res = client.post("/api/bug_reports", json={
        "player_id": player_id,
        "bug_id": "bug_price",
        "title": "Negative price found again",
        "description": "The product has a negative price in the catalog.",
        "seconds_remaining": 110,
        "streak_count": 1
    })
    assert dup_res.status_code == 400
    assert "already reported" in dup_res.json()["detail"]
    
    # Player score should remain 440
    p_res2 = client.get(f"/api/players/{player_id}")
    assert p_res2.json()["score"] == 440

def test_end_session_block_reports():
    # 1. Register player
    reg_res = client.post("/api/players", json={"name": "Charlie"})
    player_id = reg_res.json()["id"]

    # 2. End session
    end_res = client.post(f"/api/players/{player_id}/end")
    assert end_res.status_code == 200

    # Verify session_ended is True
    p_res = client.get(f"/api/players/{player_id}")
    assert p_res.json()["session_ended"] is True

    # 3. Attempt to report bug post-session
    rep_res = client.post("/api/bug_reports", json={
        "player_id": player_id,
        "bug_id": "bug_layout",
        "title": "Overlapping layout buttons",
        "description": "The button is overlapping text inside cart.",
        "seconds_remaining": 100,
        "streak_count": 1
    })
    assert rep_res.status_code == 400
    assert "session already ended" in rep_res.json()["detail"]

def test_leaderboard():
    # Register 3 players
    p1 = client.post("/api/players", json={"name": "Player One"}).json()["id"]
    p2 = client.post("/api/players", json={"name": "Player Two"}).json()["id"]
    p3 = client.post("/api/players", json={"name": "Player Three"}).json()["id"]

    # Submit bugs
    # Player 3 reports 2 bugs
    # Bug 1: Base easy (100) + Quality bonus (100 - keywords: negative, price) + Time remaining (120 * 2 = 240) = 440 points
    client.post("/api/bug_reports", json={
        "player_id": p3,
        "bug_id": "bug_price",
        "title": "Negative Price on Moto G Power",
        "description": "The product has a negative price in the catalog.",
        "seconds_remaining": 120,
        "streak_count": 1
    })
    # Bug 2: Base easy (100) + Quality bonus (100 - keywords: html, tag) + Time remaining (100 * 2 = 200) + Streak 2 (50) = 450 points
    # Total P3 Score: 440 + 450 = 890 points
    client.post("/api/bug_reports", json={
        "player_id": p3,
        "bug_id": "bug_text",
        "title": "Broken HTML in Description",
        "description": "I found raw html tags in the description.",
        "seconds_remaining": 100,
        "streak_count": 2
    })

    # Player 1 reports 1 bug
    # Bug 1: Base easy (100) + Quality bonus (100) + Time remaining (60 * 2 = 120) = 320 points
    # Total P1 Score: 320 points
    client.post("/api/bug_reports", json={
        "player_id": p1,
        "bug_id": "bug_price",
        "title": "Negative Price on Moto G Power",
        "description": "The product has a negative price in the catalog.",
        "seconds_remaining": 60,
        "streak_count": 1
    })

    # Fetch leaderboard
    leaderboard = client.get("/api/players/top10").json()
    assert len(leaderboard) == 3
    # Sorted by score descending: p3 (890 points) -> p1 (320 points) -> p2 (0 points)
    assert leaderboard[0]["id"] == p3
    assert leaderboard[0]["score"] == 890
    assert leaderboard[1]["id"] == p1
    assert leaderboard[1]["score"] == 320
    assert leaderboard[2]["id"] == p2
    assert leaderboard[2]["score"] == 0

def test_submit_bug_image():
    # 1. Register player
    reg_res = client.post("/api/players", json={"name": "Diana"})
    player_id = reg_res.json()["id"]

    # 2. Submit bug_image report
    # Base easy (100) + Quality bonus (100 - keywords: image, loading) + Time remaining (80 * 2 = 160) = 360 points
    rep_res = client.post("/api/bug_reports", json={
        "player_id": player_id,
        "bug_id": "bug_image",
        "title": "Broken charger photo",
        "description": "The image of the charger is missing or not loading.",
        "seconds_remaining": 80,
        "streak_count": 1
    })
    assert rep_res.status_code == 200
    assert rep_res.json()["score"] == 360

def test_clear_leaderboard():
    # 1. Register player
    p = client.post("/api/players", json={"name": "Alice"}).json()["id"]

    # 2. Submit bug
    client.post("/api/bug_reports", json={
        "player_id": p,
        "bug_id": "bug_price",
        "title": "Negative Price on Moto G Power",
        "description": "The product has a negative price in the catalog.",
        "seconds_remaining": 120,
        "streak_count": 1
    })

    # Verify there is 1 player on the leaderboard
    leaderboard_before = client.get("/api/players/top10").json()
    assert len(leaderboard_before) == 1

    # 3. Clear leaderboard
    clear_res = client.post("/api/leaderboard/clear")
    assert clear_res.status_code == 200
    assert clear_res.json()["success"] is True

    # Verify leaderboard is now empty
    leaderboard_after = client.get("/api/players/top10").json()
    assert len(leaderboard_after) == 0
