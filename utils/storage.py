"""JSON file I/O layer — all data lives in the data/ directory."""
import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)


def _path(filename: str) -> Path:
    return DATA_DIR / filename


def read_json(filename: str, default=None):
    p = _path(filename)
    if not p.exists():
        return default if default is not None else {}
    try:
        return json.loads(p.read_text(encoding="utf-8"))
    except Exception:
        return default if default is not None else {}


def write_json(filename: str, data):
    _path(filename).write_text(
        json.dumps(data, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )


def user_file(user_id: str, entity: str) -> str:
    return f"{entity}_{user_id}.json"
