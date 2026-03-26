"""Session helpers — auth guard + shared sidebar rendering."""
import streamlit as st
from .data_service import get_projects

LOGO_URL = "https://elchorroco.wordpress.com/wp-content/uploads/2025/02/paleta-de-color_mascaras-ciberpiratas-05.png"


def auth_guard():
    """Stop execution if user is not logged in."""
    if "user" not in st.session_state:
        st.error("🔒 Debes iniciar sesión para acceder a esta página.")
        st.page_link("app.py", label="Ir al login →")
        st.stop()


def get_user() -> dict:
    return st.session_state.get("user", {})


def render_sidebar():
    """Render common sidebar: logo, project links, user info."""
    user = get_user()
    with st.sidebar:
        # Logo + title
        col1, col2 = st.columns([1, 2])
        with col1:
            st.image(LOGO_URL, width=52)
        with col2:
            st.markdown("**Finanzas**  \n:red[Ciberpiratas]")

        st.divider()

        # Projects
        projects = get_projects(user.get("id", ""))
        st.markdown("**Mis Proyectos**")
        if not projects:
            st.caption("Sin proyectos aún")
        else:
            for p in projects:
                if st.button(f"🔵 {p['name']}", key=f"sb_proj_{p['id']}",
                             use_container_width=True):
                    st.session_state["current_project_id"] = p["id"]
                    st.switch_page("pages/3_Ver_Proyecto.py")

        st.divider()

        # User info + logout
        st.caption(f"👤 **{user.get('username', '')}**  \n"
                   f"{'Administrador' if user.get('role') == 'admin' else 'Usuario'}")
        if st.button("⏻ Cerrar sesión", use_container_width=True):
            st.session_state.clear()
            st.switch_page("app.py")
