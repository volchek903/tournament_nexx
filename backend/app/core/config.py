from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT_DIR / "data"
DB_PATH = DATA_DIR / "app.db"
FRONTEND_DIST_DIR = ROOT_DIR.parent / "frontend" / "dist"

