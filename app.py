"""
Finanzas Ciberpiratas — Entry point / Login
"""
import streamlit as st
from utils.auth import init_app, authenticate

# Init default admin on first run
init_app()

st.set_page_config(
    page_title="Finanzas Ciberpiratas",
    page_icon="https://elchorroco.wordpress.com/wp-content/uploads/2025/02/paleta-de-color_mascaras-ciberpiratas-05.png",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# If already logged in, redirect to dashboard
if "user" in st.session_state:
    st.switch_page("pages/1_Inicio.py")

# ── Login form ────────────────────────────────────────────────────────────────
col_l, col_c, col_r = st.columns([1, 1.2, 1])
with col_c:
    st.image(
        "https://elchorroco.wordpress.com/wp-content/uploads/2025/02/paleta-de-color_mascaras-ciberpiratas-05.png",
        width=90,
    )
    st.markdown("# Finanzas  \n## :pink[Ciberpiratas]")
    st.caption("Gestiona tus finanzas freelance")
    st.divider()

    with st.form("login_form"):
        username = st.text_input("Usuario", placeholder="Tu nombre de usuario")
        password = st.text_input("Contraseña", type="password", placeholder="Tu contraseña")
        submit   = st.form_submit_button("Entrar →", use_container_width=True, type="primary")

    if submit:
        if not username or not password:
            st.error("Ingresa usuario y contraseña")
        else:
            user = authenticate(username, password)
            if user:
                st.session_state["user"] = user
                st.success("¡Bienvenido!")
                st.switch_page("pages/1_Inicio.py")
            else:
                st.error("Usuario o contraseña incorrectos")

    st.caption("¿Necesitas acceso? Contacta a tu administrador.")
