"""User authentication — users stored in data/users.json."""
import hashlib
import uuid
from datetime import datetime
from .storage import read_json, write_json

USERS_FILE = "users.json"


def _hash(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _get_users() -> list:
    return read_json(USERS_FILE, default=[])


def _save_users(users: list):
    write_json(USERS_FILE, users)


def init_app():
    """Create default admin on first run."""
    users = _get_users()
    if not users:
        _save_users([{
            "id":            str(uuid.uuid4()),
            "username":      "admin",
            "password_hash": _hash("ciberpiratas2024"),
            "role":          "admin",
            "created_at":    datetime.utcnow().isoformat(),
            "created_by":    None,
        }])


def authenticate(username: str, password: str) -> dict | None:
    users = _get_users()
    for u in users:
        if u["username"].lower() == username.lower():
            if u["password_hash"] == _hash(password):
                return u
    return None


def get_users() -> list:
    return _get_users()


def get_user_by_id(user_id: str) -> dict | None:
    return next((u for u in _get_users() if u["id"] == user_id), None)


def create_user(username: str, password: str, role: str = "user", created_by: str = None) -> dict:
    users = _get_users()
    if any(u["username"].lower() == username.lower() for u in users):
        raise ValueError("El nombre de usuario ya existe")
    user = {
        "id":            str(uuid.uuid4()),
        "username":      username,
        "password_hash": _hash(password),
        "role":          role,
        "created_at":    datetime.utcnow().isoformat(),
        "created_by":    created_by,
    }
    users.append(user)
    _save_users(users)
    return user


def update_user(user_id: str, username: str = None, password: str = None, role: str = None) -> dict:
    users = _get_users()
    for u in users:
        if u["id"] == user_id:
            if username:
                u["username"] = username
            if password:
                u["password_hash"] = _hash(password)
            if role:
                u["role"] = role
            _save_users(users)
            return u
    raise ValueError("Usuario no encontrado")


def delete_user(user_id: str):
    users = _get_users()
    _save_users([u for u in users if u["id"] != user_id])
