"""Admin panel — user management."""
import streamlit as st
import pandas as pd
from utils.session import auth_guard, render_sidebar, get_user
from utils.auth import get_users, create_user, update_user, delete_user

st.set_page_config(page_title="Admin · Finanzas Ciberpiratas", layout="wide")
auth_guard()

current_user = get_user()
if current_user.get("role") != "admin":
    st.error("🚫 Acceso denegado. Solo el administrador puede ver esta página.")
    st.stop()

render_sidebar()

st.markdown("## 👥 Administración de usuarios")
st.caption("Solo el administrador puede crear, editar y eliminar usuarios.")

st.warning(
    "🔑 **Credenciales iniciales:** Usuario `admin` / Contraseña `ciberpiratas2024`  \n"
    "Cambia la contraseña del administrador lo antes posible."
)

users = get_users()

# ── Users table ────────────────────────────────────────────────────────────────
st.markdown("### Usuarios registrados")
df_data = [{
    "Usuario": u["username"],
    "Rol":     "Administrador" if u["role"] == "admin" else "Usuario",
    "Creado":  u["created_at"][:10] if u.get("created_at") else "—",
    "ID":      u["id"],
} for u in users]
st.dataframe(pd.DataFrame(df_data).drop(columns=["ID"]),
             use_container_width=True, hide_index=True)

st.divider()

# ── Create user ────────────────────────────────────────────────────────────────
st.markdown("### Crear nuevo usuario")
with st.form("create_user_form", clear_on_submit=True):
    col1, col2, col3 = st.columns(3)
    with col1:
        new_username = st.text_input("Nombre de usuario *")
    with col2:
        new_password = st.text_input("Contraseña *", type="password")
    with col3:
        new_role     = st.selectbox("Rol", ["user", "admin"],
                                    format_func=lambda r: "Usuario" if r == "user" else "Administrador")
    if st.form_submit_button("✅ Crear usuario", type="primary"):
        if not new_username.strip() or not new_password:
            st.error("Todos los campos son requeridos")
        elif len(new_password) < 6:
            st.error("La contraseña debe tener al menos 6 caracteres")
        else:
            try:
                create_user(new_username.strip(), new_password, new_role, created_by=current_user["id"])
                st.success(f"✅ Usuario **{new_username}** creado")
                st.rerun()
            except ValueError as e:
                st.error(str(e))

st.divider()

# ── Edit / delete ──────────────────────────────────────────────────────────────
st.markdown("### Editar o eliminar usuario")
other_users = [u for u in users if u["id"] != current_user["id"]]
if not other_users:
    st.caption("No hay otros usuarios para editar.")
else:
    user_opts = {u["username"]: u["id"] for u in other_users}
    sel_name  = st.selectbox("Selecciona un usuario", list(user_opts.keys()))
    sel_id    = user_opts[sel_name]
    sel_user  = next(u for u in users if u["id"] == sel_id)

    tab_edit, tab_del = st.tabs(["✏️ Editar", "🗑️ Eliminar"])

    with tab_edit:
        with st.form("edit_user_form"):
            e_username = st.text_input("Nuevo nombre de usuario", value=sel_user["username"])
            e_password = st.text_input("Nueva contraseña (vacío = no cambiar)", type="password")
            e_role     = st.selectbox("Rol", ["user", "admin"],
                                      index=0 if sel_user["role"] == "user" else 1,
                                      format_func=lambda r: "Usuario" if r == "user" else "Administrador")
            if st.form_submit_button("💾 Actualizar usuario", type="primary"):
                try:
                    update_user(sel_id,
                                username=e_username.strip() or None,
                                password=e_password or None,
                                role=e_role)
                    st.success(f"✅ Usuario **{e_username}** actualizado")
                    st.rerun()
                except ValueError as e:
                    st.error(str(e))

    with tab_del:
        st.warning(f"¿Estás seguro de eliminar a **{sel_user['username']}**? "
                   "Sus proyectos y movimientos se conservarán.")
        confirm = st.text_input("Escribe el nombre de usuario para confirmar:")
        if st.button("🗑️ Eliminar usuario", type="primary"):
            if confirm.strip() == sel_user["username"]:
                delete_user(sel_id)
                st.success(f"Usuario **{sel_user['username']}** eliminado")
                st.rerun()
            else:
                st.error("El nombre no coincide")
