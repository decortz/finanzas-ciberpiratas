"""Create a new project."""
import streamlit as st
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import get_projects, create_project

st.set_page_config(page_title="Nuevo Proyecto · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user     = get_user()
uid      = user["id"]
projects = get_projects(uid)

st.markdown("## 📁 Crear nuevo proyecto")
st.caption("Define el nombre y cómo quieres registrar tus movimientos.")

with st.form("new_project_form"):
    name        = st.text_input("Nombre del proyecto *", placeholder="Ej: Diseño freelance 2025")
    description = st.text_area("Descripción (opcional)", placeholder="Una breve descripción...", height=80)
    date_mode   = st.radio(
        "¿Cómo quieres registrar las fechas?",
        ["manual", "auto"],
        format_func=lambda x: "Manual — elijo la fecha en cada movimiento"
                               if x == "manual" else "Automática — usa la fecha de hoy",
        horizontal=True,
    )

    copy_from = None
    if projects:
        opts = {"— Sin copiar, comenzar desde cero —": None}
        opts.update({p["name"]: p["id"] for p in projects})
        selected = st.selectbox(
            "Copiar ítems de otro proyecto (opcional)",
            list(opts.keys()),
            help="Copia los tipos de ingreso y egreso de un proyecto existente",
        )
        copy_from = opts[selected]

    submitted = st.form_submit_button("Crear proyecto →", type="primary")

if submitted:
    if not name.strip():
        st.error("El nombre del proyecto es requerido")
    else:
        project = create_project(uid, name.strip(), description.strip(),
                                 date_mode=date_mode, copy_from_id=copy_from)
        st.success(f"✅ Proyecto **{project['name']}** creado. Ahora configura tus ítems.")
        st.session_state["current_project_id"] = project["id"]
        st.switch_page("pages/3_Ver_Proyecto.py")
