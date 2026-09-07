import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "cin_day.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the SQLite database with tables and unique constraints."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Enable foreign key support
        cursor.execute("PRAGMA foreign_keys = ON;")
        
        # Create players table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS players (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                score INTEGER DEFAULT 0,
                session_ended BOOLEAN DEFAULT 0
            );
        """)
        
        # Create bug_reports table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bug_reports (
                id TEXT PRIMARY KEY,
                player_id TEXT NOT NULL,
                bug_id TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
                UNIQUE(player_id, bug_id)
            );
        """)
        
        # Create indexes for optimal querying
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bug_reports_player_bug ON bug_reports(player_id, bug_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC, created_at ASC);")
        
        conn.commit()

def create_player(player_id: str, name: str) -> dict:
    """Inserts a new player and returns the player record."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO players (id, name, score, session_ended) VALUES (?, ?, 0, 0)",
            (player_id, name)
        )
        conn.commit()
    return get_player(player_id)

def get_player(player_id: str) -> dict:
    """Retrieves a single player's details."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM players WHERE id = ?", (player_id,))
        row = cursor.fetchone()
        if row:
            d = dict(row)
            d["session_ended"] = bool(d["session_ended"])
            return d
    return None

def end_player_session(player_id: str) -> bool:
    """Sets player's session_ended to true."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE players SET session_ended = 1 WHERE id = ?", (player_id,))
        conn.commit()
        return cursor.rowcount > 0

BUG_METADATA_MAPPING = {
  "bug_price": {
    "difficulty": "easy",
    "base_points": 100,
    "keywords": ["negative", "price", "minus", "cost", "g power", "value", "subzero", "less", "below", "negativo", "preço", "preco", "menos", "custo", "g power", "valor", "abaixo de zero", "subzero"]
  },
  "bug_text": {
    "difficulty": "easy",
    "base_points": 100,
    "keywords": ["html", "corrupt", "tag", "code", "razr", "broken", "text", "description", "raw", "corrompido", "corrompida", "tag", "código", "codigo", "razr", "quebrado", "quebrada", "texto", "descrição", "descricao", "cru", "bruto"]
  },
  "bug_filter": {
    "difficulty": "medium",
    "base_points": 250,
    "keywords": ["blank", "empty", "filter", "accessory", "accessories", "clear", "disappear", "white", "branco", "vazio", "vazia", "filtro", "acessório", "acessorio", "acessórios", "acessorios", "limpar", "desaparecer", "tela branca"]
  },
  "bug_image": {
    "difficulty": "easy",
    "base_points": 100,
    "keywords": ["image", "photo", "load", "charger", "broken", "turbopower", "missing", "loading", "pic", "picture", "imagem", "foto", "carregar", "carregador", "quebrado", "quebrada", "turbopower", "faltando", "carregando", "figura", "figuras"]
  },
  "bug_loop": {
    "difficulty": "hard",
    "base_points": 500,
    "keywords": ["quantity", "loop", "reset", "zero", "cart", "increment", "increase", "plus", "math", "quantidade", "loop", "resetar", "reiniciar", "zero", "carrinho", "incremento", "incrementar", "aumentar", "mais", "matemática", "matematica"]
  },
  "bug_layout": {
    "difficulty": "hard",
    "base_points": 500,
    "keywords": ["overlap", "checkout", "button", "text", "unreadable", "layout", "position", "total", "margin", "sobrepor", "sobreposição", "sobreposicao", "checkout", "botão", "botao", "texto", "ilegível", "ilegivor", "layout", "posição", "posicao", "total", "margem"]
  }
}

def add_bug_report(
    report_id: str,
    player_id: str,
    bug_id: str,
    title: str,
    description: str,
    seconds_remaining: int,
    streak_count: int
) -> tuple[bool, int, int, str]:
    """
    Submits a bug report.
    Guarantees uniqueness via unique constraint.
    Increments player score based on dynamic scoring guidelines.
    Returns: (success_boolean, current_score, points_added, message)
    """
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            # Check if player session has ended
            cursor.execute("SELECT session_ended, score FROM players WHERE id = ?", (player_id,))
            player = cursor.fetchone()
            if not player:
                return False, 0, 0, "Player not found"
            
            if player["session_ended"]:
                return False, player["score"], 0, "Challenge session already ended"

            # Check if bug already reported (anti-spam)
            cursor.execute(
                "SELECT 1 FROM bug_reports WHERE player_id = ? AND bug_id = ?",
                (player_id, bug_id)
            )
            if cursor.fetchone():
                return False, player["score"], 0, "Bug already reported in this session"

            # Calculate dynamic score
            meta = BUG_METADATA_MAPPING.get(bug_id)
            if not meta:
                return False, player["score"], 0, "Unknown bug ID"
                
            points_added = meta["base_points"]
            
            # 1. Semantic Quality keyword matching
            matched = 0
            desc_lower = description.lower()
            for kw in meta["keywords"]:
                if kw in desc_lower:
                    matched += 1
                    
            if matched >= 2:
                points_added += 100
            elif matched == 1:
                points_added += 50
                
            # 2. Time remaining bonus
            points_added += (seconds_remaining * 2)
            
            # 3. Streak Combo Bonus
            streak_bonuses = [0, 0, 50, 100, 200, 400]
            streak_idx = min(streak_count, 5)
            points_added += streak_bonuses[streak_idx]

            # Insert bug report
            cursor.execute(
                "INSERT INTO bug_reports (id, player_id, bug_id, title, description) VALUES (?, ?, ?, ?, ?)",
                (report_id, player_id, bug_id, title, description)
            )
            
            # Update player's score
            cursor.execute(
                "UPDATE players SET score = score + ? WHERE id = ?",
                (points_added, player_id)
            )
            
            conn.commit()
            
            # Fetch updated score
            cursor.execute("SELECT score FROM players WHERE id = ?", (player_id,))
            new_score = cursor.fetchone()["score"]
            return True, new_score, points_added, "Bug reported successfully"

        except sqlite3.IntegrityError as e:
            return False, 0, 0, f"Database integrity error: {str(e)}"

def get_top_10() -> list[dict]:
    """Fetches the top 10 players, sorted by score descending, then created_at ascending."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, name, score, created_at, session_ended 
            FROM players 
            ORDER BY score DESC, created_at ASC 
            LIMIT 10
        """)
        rows = cursor.fetchall()
        result = []
        for r in rows:
            d = dict(r)
            d["session_ended"] = bool(d["session_ended"])
            result.append(d)
        return result
