import json
import sqlite3
from typing import Any

from app.core.config import DATA_DIR, DB_PATH


def get_connection() -> sqlite3.Connection:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS app_state (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                payload TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        connection.commit()


def read_state() -> dict[str, Any] | None:
    with get_connection() as connection:
        row = connection.execute("SELECT payload FROM app_state WHERE id = 1").fetchone()
        if not row:
            return None
        return json.loads(row["payload"])


def write_state(payload: dict[str, Any], updated_at: str) -> None:
    serialized = json.dumps(payload, ensure_ascii=False)
    with get_connection() as connection:
        connection.execute(
            """
            INSERT INTO app_state (id, payload, updated_at)
            VALUES (1, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                payload = excluded.payload,
                updated_at = excluded.updated_at
            """,
            (serialized, updated_at),
        )
        connection.commit()

