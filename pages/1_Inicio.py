"""Dashboard — Inicio"""
import streamlit as st
from datetime import datetime
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import get_projects, get_movements
from utils.export_service import export_all_projects_xlsx

st.set_page_config(page_title="Inicio · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user    = get_user()
uid     = user["id"]
projects  = get_projects(uid)
movements = get_movements(uid)
year      = datetime.now().year

# ── Summary ───────────────────────────────────────────────────────────────────
total_income  = sum(m["amount"] for m in movements if m["type"] == "ingreso")
total_expense = sum(m["amount"] for m in movements if m["type"] != "ingreso")
balance       = total_income - total_expense

st.markdown(f"## Hola, **{user['username']}** 👋")
st.caption("Gestiona tus finanzas freelance desde aquí.")

c1, c2, c3 = st.columns(3)
c1.metric("💰 Total Ingresos",  f"${total_income:,.2f}")
c2.metric("📤 Total Egresos",   f"${total_expense:,.2f}")
c3.metric("⚖️ Balance",         f"${balance:,.2f}",
          delta=f"{balance:,.2f}", delta_color="normal")

st.divider()

# ── Main actions ──────────────────────────────────────────────────────────────
st.markdown("### ¿Qué quieres hacer?")
col1, col2, col3 = st.columns(3)

with col1:
    st.info("### 📁\n**Crea un proyecto nuevo**\nOrganiza tus ingresos y egresos por proyecto")
    if st.button("Crear proyecto →", use_container_width=True, key="btn_new_proj"):
        st.switch_page("pages/2_Nuevo_Proyecto.py")

with col2:
    st.info("### ➕\n**Ingresa un movimiento**\nRegistra un ingreso o egreso rápidamente")
    if st.button("Ingresar movimiento →", use_container_width=True, key="btn_new_mov"):
        st.switch_page("pages/4_Movimientos.py")

with col3:
    st.info("### 📥\n**Descarga tus finanzas**\nExporta todos tus proyectos en un archivo")
    if projects:
        xlsx = export_all_projects_xlsx(projects, movements, year)
        st.download_button(
            "⬇️ Descargar todos los proyectos",
            data=xlsx,
            file_name=f"finanzas_ciberpiratas_{year}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True,
        )
    else:
        st.button("Descargar finanzas", disabled=True, use_container_width=True)

st.divider()

# ── Projects grid ─────────────────────────────────────────────────────────────
if projects:
    st.markdown("### Mis proyectos")
    cols = st.columns(min(len(projects), 3))
    for i, p in enumerate(projects):
        pm = [m for m in movements if m["project_id"] == p["id"]]
        pi = sum(m["amount"] for m in pm if m["type"] == "ingreso")
        pe = sum(m["amount"] for m in pm if m["type"] != "ingreso")
        pb = pi - pe
        with cols[i % 3]:
            with st.container(border=True):
                st.markdown(f"**{p['name']}**")
                if p.get("description"):
                    st.caption(p["description"])
                st.write(f"✅ +${pi:,.0f}   ❌ -${pe:,.0f}   ⚖️ ${pb:,.0f}")
                if st.button("Ver proyecto →", key=f"proj_btn_{p['id']}", use_container_width=True):
                    st.session_state["current_project_id"] = p["id"]
                    st.switch_page("pages/3_Ver_Proyecto.py")
else:
    st.info("Aún no tienes proyectos. ¡Crea el primero!")

st.divider()
if st.button("🔗 Instrucciones para conectar tus datos a Google Sheets"):
    st.switch_page("pages/6_Google_Sheets.py")
