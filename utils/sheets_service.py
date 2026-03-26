"""Google Sheets API sync via raw HTTP (no SDK dependency at runtime)."""
import urllib.request
import urllib.error
import json


SHEETS_BASE = "https://sheets.googleapis.com/v4/spreadsheets"
HEADER_ROW  = ["id", "fecha", "proyecto", "tipo", "item", "monto", "descripcion", "proyecto_id"]


def _request(url: str, token: str, method: str = "GET", body=None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    req  = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type":  "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        raise RuntimeError(f"Sheets API {e.code}: {err_body}") from e


def _append(spreadsheet_id: str, token: str, sheet_name: str, rows: list):
    import urllib.parse
    rng = urllib.parse.quote(f"{sheet_name}!A:H")
    url = (f"{SHEETS_BASE}/{spreadsheet_id}/values/{rng}:append"
           f"?valueInputOption=RAW&insertDataOption=INSERT_ROWS")
    _request(url, token, method="POST", body={"values": rows})


def _ensure_header(spreadsheet_id: str, token: str, sheet_name: str = "Movimientos"):
    import urllib.parse
    rng = urllib.parse.quote(f"{sheet_name}!A1:H1")
    url = f"{SHEETS_BASE}/{spreadsheet_id}/values/{rng}"
    result  = _request(url, token)
    current = result.get("values", [[]])
    if not current or current[0] != HEADER_ROW:
        _append(spreadsheet_id, token, sheet_name, [HEADER_ROW])


def sync_movements(spreadsheet_id: str, token: str, movements: list,
                   project_map: dict, sheet_name: str = "Movimientos") -> int:
    _ensure_header(spreadsheet_id, token, sheet_name)
    rows = [[
        m["id"], m["date"],
        project_map.get(m["project_id"], m["project_id"]),
        m["type"], m["item_label"], m["amount"],
        m.get("description", ""), m["project_id"],
    ] for m in movements]
    if rows:
        _append(spreadsheet_id, token, sheet_name, rows)
    return len(rows)


def full_resync(spreadsheet_id: str, token: str, movements: list,
                project_map: dict, sheet_name: str = "Movimientos"):
    import urllib.parse
    rng = urllib.parse.quote(f"{sheet_name}!A:H")
    _request(f"{SHEETS_BASE}/{spreadsheet_id}/values/{rng}:clear",
             token, method="POST")
    sync_movements(spreadsheet_id, token, movements, project_map, sheet_name)
