# Motorola CIN-DAY Challenge & Live Board

A robust, ultra-fast, and high-signal gamified interactive challenge for event booths.

## 🏗️ Architecture & Features

This project is a multi-tier responsive application optimized for local development and booth execution:

1. **Backend (`/backend`)**:
   - **Framework**: FastAPI (Python 3.11+) managed with **`uv`**.
   - **Database**: SQLite with native unique constraints and optimized indexes.
   - **Realtime**: WebSockets broadcast live ranking changes instantly to display boards.
   - **Validation & Anti-Spam**: Strict title/description length validation and unique compound index `(player_id, bug_id)` to prevent duplicate points submission.
   - **Tests**: Fully verified with a complete `pytest` and `httpx` integration suite (100% pass).

2. **Frontend (`/frontend`)**:
   - **Framework**: React 19 + TypeScript + Vite.
   - **Styling**: Tailwind CSS v4 (Sleek dark cyberpunk theme with glowing gradients and neon typography).
   - **Components**: Lucide Icons, Canvas-Confetti, standalone state-based browser router.
   - **Dual-Flow Interface**:
     - **Mobile Flow** (Default): Onboarding Registration -> 2-Minute (02:00) Countdown Challenge Timer -> Seeded Interactive Motorola Catalog & sliding Cart Drawer containing **5 pre-coded bugs** -> Verification Bug-reporting modal -> Confetti Game Over score summary.
     - **Desktop Display Flow** (`/leaderboard` hash): Large 1080p-optimized Full HD dashboard, Top 10 podium listing with real-time updates via WebSockets (falling back automatically to REST polling and local mock lists if server is offline).
   - **Offline-First Resilience**: If the backend is offline, the frontend automatically switches to a fully-playable local storage-driven mock database, allowing flawless offline demos!

---

## 🚀 Quick Start Guide

### 1. Prerequisite Checks
Ensure you have `uv` and `node` / `npm` installed.

### 2. Run the Python Backend
From the root directory:
```bash
# Navigate to the backend directory
cd backend

# Run the FastAPI server via uv (automatically handles virtualenv and packages)
uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload
```
The server will boot up SQLite and run at `http://localhost:8000`.

### 3. Run the React Frontend
Open a new terminal and from the root directory:
```bash
# Navigate to the frontend directory
cd frontend

# Start the Vite development server
npm run dev
```
The player onboarding client runs at `http://localhost:5173`.

---

## 🎮 How to Test & Demo

### Live TV Ranking (Desktop View)
To view the live, large-screen event display, visit:
- **`http://localhost:5173/#leaderboard`** (or `http://localhost:5173/leaderboard`)

This view will connect via WebSockets to the backend and update the rankings in real time the moment a player scores!

### Gamified Mobile Challenge (Player View)
Visit:
- **`http://localhost:5173/`**

1. Enter your name and click **Start Challenge**.
2. A **02:00 timer** starts. Search for the 5 pre-seeded bugs:
   - **Bug A (Negative Price)**: Click on the Moto G Power's price (`-$999.00`).
   - **Bug B (Overlapping Layout)**: Open the cart drawer, click on the overlapping checkout target area.
   - **Bug C (Quantity reset loop)**: Add Moto G Power to cart, open cart, click `+` to increase its quantity. It resets to `0` and triggers the report layer!
   - **Bug D (Broken HTML Description)**: Click on the Motorola Razr 50 Ultra's description text (displaying raw unescaped `<script>` tags).
   - **Bug E (Blank Screen Filter)**: Select the `Accessories` category filter tab. The catalog turns completely blank. Click on the blank area to report the filter crash!
3. Submit each bug report through the modal.
4. When the timer runs out, review your final summary score!

---

## 🧪 Running Automated Backend Tests

Verify that database, constraints, validations, and endpoints are 100% compliant:
```bash
# From the root workspace directory
PYTHONPATH=. ./backend/.venv/bin/pytest backend/test_main.py
```
