"""Google Sheets connection + sync."""
import streamlit as st
from datetime import datetime
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import (
    get_projects, get_movements, get_sheets_config,
    save_sheets_config, remove_sheets_config,
    get_pending_sync, mark_synced,
)

DEMO_SHEET_ID = "1Wyv15kydn-sMKwYL2AJBhfFs9EjpE08clhqEu2cNHLY"

st.set_page_config(page_title="Google Sheets · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user = get_user()
uid  = user["id"]

st.markdown("## 🔗 Google Sheets")

# ── Privacy notice ─────────────────────────────────────────────────────────────
st.info(
    "🔒 **Nosotros no guardamos ninguno de tus datos.** "
    "Todos ellos se deben almacenar en una hoja de cálculo de Google de tu propiedad "
    "para que nadie tenga acceso a la información excepto tú. "
    "Ningún usuario tendrá acceso a tu información ni podrá descargarla."
)

config = get_sheets_config(uid)

# ── Connection status ──────────────────────────────────────────────────────────
if config and config.get("spreadsheet_id") and config.get("access_token"):
    st.success(f"🟢 **Conectado** — ID: `{config['spreadsheet_id']}`")

    pending = get_pending_sync(uid)
    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button(f"🔄 Sincronizar ahora ({len(pending)} pendientes)",
                     use_container_width=True, type="primary"):
            if not pending:
                st.info("Todo está al día. Sin movimientos pendientes.")
            else:
                try:
                    from utils.sheets_service import sync_movements
                    projects = get_projects(uid)
                    proj_map = {p["id"]: p["name"] for p in projects}
                    synced   = sync_movements(config["spreadsheet_id"],
                                             config["access_token"], pending, proj_map)
                    mark_synced(uid, [m["id"] for m in pending])
                    st.success(f"✅ {len(pending)} movimientos sincronizados con Google Sheets")
                except Exception as e:
                    st.error(f"Error al sincronizar: {e}")

    with col2:
        if st.button("🔁 Re-sincronizar todo", use_container_width=True):
            try:
                from utils.sheets_service import full_resync
                projects  = get_projects(uid)
                movements = get_movements(uid)
                proj_map  = {p["id"]: p["name"] for p in projects}
                full_resync(config["spreadsheet_id"], config["access_token"],
                            movements, proj_map)
                mark_synced(uid, [m["id"] for m in movements])
                st.success(f"✅ Re-sincronización completa: {len(movements)} movimientos")
            except Exception as e:
                st.error(f"Error: {e}")

    with col3:
        if st.button("❌ Desconectar", use_container_width=True):
            remove_sheets_config(uid)
            st.success("Google Sheets desconectado")
            st.rerun()

else:
    st.warning("No estás conectado a Google Sheets.")
    st.markdown("### Conectar tu hoja de cálculo")
    st.caption("Ingresa el ID de tu hoja y un token de acceso OAuth2 con permisos de escritura.")

    with st.form("sheets_connect"):
        sheet_id    = st.text_input("ID de la hoja de cálculo",
                                    placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms",
                                    help="Lo encuentras en la URL entre /d/ y /edit")
        access_token = st.text_input("Token de acceso (OAuth2)",
                                     placeholder="ya29.A0...",
                                     type="password",
                                     help="Genera tu token siguiendo las instrucciones de abajo")
        if st.form_submit_button("🔗 Conectar", type="primary"):
            if not sheet_id.strip() or not access_token.strip():
                st.error("Ingresa el ID de la hoja y el token de acceso")
            else:
                save_sheets_config(uid, {
                    "spreadsheet_id": sheet_id.strip(),
                    "access_token":   access_token.strip(),
                    "connected_at":   datetime.utcnow().isoformat(),
                })
                st.success("✅ Google Sheets conectado")
                st.rerun()

st.divider()

# ── Instructions ──────────────────────────────────────────────────────────────
with st.expander("📋 Instrucciones para conectar tus datos", expanded=False):
    st.markdown("""
### Cómo conectar tu Google Sheets

**Paso 1 — Crea una cuenta en Google Cloud**
Ve a [console.cloud.google.com](https://console.cloud.google.com) e inicia sesión.

**Paso 2 — Crea un nuevo proyecto en Google Cloud**
Haz clic en "Nuevo Proyecto", dale un nombre y créalo.

**Paso 3 — Habilita la API de Google Sheets**
Ve a **APIs y servicios → Biblioteca**, busca "Google Sheets API" y haz clic en **Habilitar**.

**Paso 4 — Crea credenciales OAuth2**
Ve a **APIs y servicios → Credenciales → Crear credenciales → ID de cliente OAuth**.
Tipo de aplicación: **Aplicación web**. Agrega el dominio de esta app en "Orígenes autorizados".

**Paso 5 — Crea tu Google Sheets**
Ve a [sheets.google.com](https://sheets.google.com) y crea una nueva hoja en blanco.
Copia el ID de la URL: la parte entre `/d/` y `/edit`.

**Paso 6 — Obtén un token de acceso**
Usa el [OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
1. En el paso 1, ingresa el scope: `https://www.googleapis.com/auth/spreadsheets`
2. Autoriza con tu cuenta de Google
3. En el paso 2, haz clic en **"Exchange authorization code for tokens"**
4. Copia el **Access token**

> ⚠️ Los tokens duran solo **1 hora**. Deberás renovarlo periódicamente.

**Paso 7 — Conecta tu hoja en esta app**
Ingresa el ID de la hoja y el token en el formulario de arriba.

---
🔐 **Recuerda:** Tus datos solo viven en tu hoja de cálculo personal.
Esta app no guarda ni transmite tu información a ningún servidor nuestro.
    """)

# Demo sheet (admin only)
if user.get("role") == "admin":
    st.divider()
    with st.expander("📊 Hoja demo (solo administrador)"):
        st.markdown(f"ID de la hoja demo de referencia: `{DEMO_SHEET_ID}`")
        st.caption("Esta hoja fue configurada como referencia inicial del proyecto. Cada usuario debe conectar su propia hoja.")
