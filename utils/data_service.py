"""Projects and movements CRUD — data namespaced per user in data/ directory."""
import uuid
import copy
from datetime import datetime
from .storage import read_json, write_json, user_file
from .defaults import create_default_items


# ── Projects ──────────────────────────────────────────────────────────────────

def get_projects(user_id: str) -> list:
    return read_json(user_file(user_id, "projects"), default=[])


def _save_projects(user_id: str, projects: list):
    write_json(user_file(user_id, "projects"), projects)


def create_project(user_id: str, name: str, description: str,
                   date_mode: str = "manual", copy_from_id: str = None) -> dict:
    projects = get_projects(user_id)

    items = create_default_items()
    if copy_from_id:
        source = next((p for p in projects if p["id"] == copy_from_id), None)
        if source:
            items = copy.deepcopy(source["items"])
            for key in items:
                for item in items[key]:
                    item["id"] = str(uuid.uuid4())

    project = {
        "id":          str(uuid.uuid4()),
        "user_id":     user_id,
        "name":        name,
        "description": description,
        "date_mode":   date_mode,
        "items":       items,
        "created_at":  datetime.utcnow().isoformat(),
    }
    projects.append(project)
    _save_projects(user_id, projects)
    return project


def get_project(user_id: str, project_id: str) -> dict | None:
    return next((p for p in get_projects(user_id) if p["id"] == project_id), None)


def update_project(user_id: str, project_id: str, **updates) -> dict:
    projects = get_projects(user_id)
    for p in projects:
        if p["id"] == project_id:
            p.update(updates)
            _save_projects(user_id, projects)
            return p
    raise ValueError("Proyecto no encontrado")


def delete_project(user_id: str, project_id: str):
    _save_projects(user_id, [p for p in get_projects(user_id) if p["id"] != project_id])
    # Remove movements for this project
    movements = get_movements(user_id)
    save_movements(user_id, [m for m in movements if m["project_id"] != project_id])


# ── Project items ──────────────────────────────────────────────────────────────

def add_item(user_id: str, project_id: str, category: str, label: str) -> dict:
    project = get_project(user_id, project_id)
    if not project:
        raise ValueError("Proyecto no encontrado")
    new_item = {"id": str(uuid.uuid4()), "label": label, "is_default": False}
    project["items"].setdefault(category, []).append(new_item)
    update_project(user_id, project_id, items=project["items"])
    return new_item


def rename_item(user_id: str, project_id: str, category: str, item_id: str, new_label: str):
    project = get_project(user_id, project_id)
    for item in project["items"].get(category, []):
        if item["id"] == item_id:
            item["label"] = new_label
            break
    update_project(user_id, project_id, items=project["items"])


def remove_item(user_id: str, project_id: str, category: str, item_id: str):
    project = get_project(user_id, project_id)
    project["items"][category] = [
        i for i in project["items"].get(category, []) if i["id"] != item_id
    ]
    update_project(user_id, project_id, items=project["items"])


# ── Movements ─────────────────────────────────────────────────────────────────

def get_movements(user_id: str) -> list:
    return read_json(user_file(user_id, "movements"), default=[])


def save_movements(user_id: str, movements: list):
    write_json(user_file(user_id, "movements"), movements)


def get_project_movements(user_id: str, project_id: str) -> list:
    return [m for m in get_movements(user_id) if m["project_id"] == project_id]


def create_movement(user_id: str, project_id: str, mov_type: str,
                    item_id: str, item_label: str, amount: float,
                    date: str, description: str = "") -> dict:
    movements = get_movements(user_id)
    movement = {
        "id":          str(uuid.uuid4()),
        "user_id":     user_id,
        "project_id":  project_id,
        "type":        mov_type,
        "item_id":     item_id,
        "item_label":  item_label,
        "amount":      float(amount),
        "date":        date,
        "description": description,
        "created_at":  datetime.utcnow().isoformat(),
        "synced_at":   None,
    }
    movements.append(movement)
    save_movements(user_id, movements)
    return movement


def update_movement(user_id: str, movement_id: str, **updates) -> dict:
    movements = get_movements(user_id)
    for m in movements:
        if m["id"] == movement_id:
            m.update(updates)
            m["synced_at"] = None
            save_movements(user_id, movements)
            return m
    raise ValueError("Movimiento no encontrado")


def delete_movement(user_id: str, movement_id: str):
    movements = get_movements(user_id)
    save_movements(user_id, [m for m in movements if m["id"] != movement_id])


def get_pending_sync(user_id: str) -> list:
    return [m for m in get_movements(user_id) if not m.get("synced_at")]


def mark_synced(user_id: str, movement_ids: list):
    now = datetime.utcnow().isoformat()
    movements = get_movements(user_id)
    for m in movements:
        if m["id"] in movement_ids:
            m["synced_at"] = now
    save_movements(user_id, movements)


# ── Sheets config ─────────────────────────────────────────────────────────────

def get_sheets_config(user_id: str) -> dict | None:
    return read_json(user_file(user_id, "sheets"), default=None) or None


def save_sheets_config(user_id: str, config: dict):
    write_json(user_file(user_id, "sheets"), config)


def remove_sheets_config(user_id: str):
    from .storage import DATA_DIR, user_file as uf
    p = DATA_DIR / uf(user_id, "sheets")
    if p.exists():
        p.unlink()
