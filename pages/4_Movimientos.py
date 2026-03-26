"""New / edit movement form."""
import streamlit as st
from datetime import date
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import get_projects, create_movement, get_movements
from utils.defaults import CATEGORY_META, INCOME_AUTO_ITEMS, MOVEMENT_TYPE_LABELS

st.set_page_config(page_title="Nuevo Movimiento · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user     = get_user()
uid      = user["id"]
projects = get_projects(uid)

st.markdown("## ➕ Ingresa un movimiento")

if not projects:
    st.warning("Debes crear al menos un proyecto antes de registrar movimientos.")
    if st.button("Crear proyecto →"):
        st.switch_page("pages/2_Nuevo_Proyecto.py")
    st.stop()

# ── Form ──────────────────────────────────────────────────────────────────────
proj_opts  = {p["name"]: p["id"] for p in projects}
default_proj = None
if "current_project_id" in st.session_state:
    default_proj = next((p["name"] for p in projects
                         if p["id"] == st.session_state["current_project_id"]), None)

col_form, col_tip = st.columns([2, 1])

with col_form:
    with st.form("movement_form", clear_on_submit=True):
        sel_proj_name = st.selectbox(
            "Proyecto *",
            list(proj_opts.keys()),
            index=list(proj_opts.keys()).index(default_proj) if default_proj else 0,
        )
        project_id = proj_opts[sel_proj_name]
        project    = next(p for p in projects if p["id"] == project_id)

        # Type
        type_opts  = list(CATEGORY_META.items())  # [(cat_key, meta), ...]
        type_labels = [f"{meta['icon']} {meta['label']}" for _, meta in type_opts]
        type_idx   = st.selectbox("Tipo de movimiento *", range(len(type_labels)),
                                  format_func=lambda i: type_labels[i])
        cat_key, cat_meta = type_opts[type_idx]
        mov_type = cat_meta["type"]

        # Items for selected type
        cat_items = project["items"].get(cat_key, [])
        if cat_key == "ingresos":
            auto   = [{"id": f"__auto_{l}__", "label": l} for l in INCOME_AUTO_ITEMS]
            all_items = auto + cat_items
        else:
            all_items = cat_items

        if not all_items:
            st.warning(f"⚠️ No hay ítems configurados para **{cat_meta['label']}** en este proyecto. "
                       f"Ve a la configuración del proyecto para agregar ítems.")
            item_id    = "__none__"
            item_label = ""
        else:
            item_opts  = {i["label"]: i["id"] for i in all_items}
            item_opts["➕ Otro (escribir manualmente)"] = "__custom__"
            sel_item   = st.selectbox("Ítem *", list(item_opts.keys()))
            item_id    = item_opts[sel_item]
            item_label = sel_item if item_id != "__custom__" else ""
            if item_id == "__custom__":
                item_label = st.text_input("Nombre del ítem personalizado *")

        # Amount
        amount = st.number_input("Monto *", min_value=0.01, step=0.01, format="%.2f")

        # Date
        if project["date_mode"] == "auto":
            mov_date = date.today().isoformat()
            st.info(f"📅 Fecha automática: {date.today().strftime('%d/%m/%Y')}")
        else:
            mov_date = st.date_input("Fecha *", value=date.today()).isoformat()

        description = st.text_area("Descripción (opcional)", height=70,
                                   placeholder="Nota o referencia del movimiento...")

        submitted = st.form_submit_button("💾 Guardar movimiento", type="primary",
                                          use_container_width=True)

with col_tip:
    st.markdown("### 💡 Consejos")
    st.info("**Ingresos** — dinero que entra a tu proyecto.\n\n"
            "**Costos de venta** — gastos directos del proyecto.\n\n"
            "**Gastos de venta** — gastos comerciales.\n\n"
            "**Gastos operacionales** — gastos fijos del negocio.\n\n"
            "**Pago deudas** — pagos a créditos o tarjetas.")

# ── Handle submission ─────────────────────────────────────────────────────────
if submitted:
    if not item_label.strip():
        st.error("Selecciona o escribe el nombre del ítem")
    elif amount <= 0:
        st.error("El monto debe ser mayor a 0")
    else:
        # Cross-project warning
        all_proj_names = [p["name"] for p in projects if p["id"] != project_id]
        if item_label in all_proj_names:
            st.warning(f"⚠️ Recuerda revisar este egreso en tu proyecto **{item_label}**")

        create_movement(
            user_id=uid,
            project_id=project_id,
            mov_type=mov_type,
            item_id=item_id,
            item_label=item_label.strip(),
            amount=amount,
            date=mov_date,
            description=description.strip(),
        )
        st.success(f"✅ Movimiento de **${amount:,.2f}** registrado en **{sel_proj_name}**")
        st.balloons()

# ── Recent movements ──────────────────────────────────────────────────────────
st.divider()
st.markdown("#### Últimos 10 movimientos")
all_movs = get_movements(uid)
recent   = sorted(all_movs, key=lambda m: m["date"], reverse=True)[:10]
if recent:
    from utils.export_service import movements_to_dataframe
    df = movements_to_dataframe(recent, projects)
    st.dataframe(df.drop(columns=["_id"], errors="ignore"),
                 use_container_width=True, hide_index=True)
else:
    st.caption("Aún no hay movimientos registrados.")
