"""Project detail — items config + movements table."""
import streamlit as st
from datetime import datetime
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import (
    get_projects, get_project, get_project_movements,
    add_item, rename_item, remove_item,
    update_project, delete_project, delete_movement,
)
from utils.export_service import export_project_xlsx, movements_to_dataframe, export_filtered_xlsx
from utils.defaults import CATEGORY_META, INCOME_AUTO_ITEMS, MONTHS, MOVEMENT_TYPE_LABELS

st.set_page_config(page_title="Proyecto · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user = get_user()
uid  = user["id"]

# ── Select project ─────────────────────────────────────────────────────────────
projects = get_projects(uid)
if not projects:
    st.warning("No tienes proyectos. Crea uno primero.")
    if st.button("Crear proyecto →"):
        st.switch_page("pages/2_Nuevo_Proyecto.py")
    st.stop()

project_map = {p["id"]: p["name"] for p in projects}
default_id  = st.session_state.get("current_project_id", projects[0]["id"])
if default_id not in project_map:
    default_id = projects[0]["id"]

selected_name = st.selectbox(
    "Selecciona un proyecto",
    list(project_map.values()),
    index=list(project_map.keys()).index(default_id),
)
project_id = [k for k, v in project_map.items() if v == selected_name][0]
st.session_state["current_project_id"] = project_id
project    = get_project(uid, project_id)

# ── Header ────────────────────────────────────────────────────────────────────
col_h, col_btns = st.columns([3, 2])
with col_h:
    st.markdown(f"## 📋 {project['name']}")
    if project.get("description"):
        st.caption(project["description"])
    st.caption(f"Fechas: {'Automáticas' if project['date_mode'] == 'auto' else 'Manuales'}")

with col_btns:
    st.markdown("&nbsp;", unsafe_allow_html=True)
    if st.button("➕ Ingresa un movimiento", use_container_width=True, type="primary"):
        st.switch_page("pages/4_Movimientos.py")

    year = datetime.now().year
    proj_movements = get_project_movements(uid, project_id)
    xlsx_bytes = export_project_xlsx(project, proj_movements, year)
    st.download_button(
        "📥 Descarga las finanzas de este proyecto",
        data=xlsx_bytes,
        file_name=f"{project['name']}_{year}.xlsx",
        mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        use_container_width=True,
    )

st.divider()

# ── Items configuration ───────────────────────────────────────────────────────
st.markdown("### ⚙️ Configurar ítems por categoría")
st.caption("Define los tipos de ingresos y egresos. Estos aparecerán al registrar movimientos.")

TABS = list(CATEGORY_META.items())  # [(key, meta), ...]
tab_labels = [f"{meta['icon']} {meta['label']}" for _, meta in TABS]
tab_objects = st.tabs(tab_labels)

for tab_obj, (cat_key, meta) in zip(tab_objects, TABS):
    with tab_obj:
        items = project["items"].get(cat_key, [])
        all_projects = get_projects(uid)

        # Info message
        if cat_key == "ingresos":
            st.info("💡 Crea los tipos de ingreso para este proyecto, ten en cuenta únicamente los que estén directamente relacionados con este proyecto.")
        elif cat_key == "costos_venta":
            st.info("💡 Crea todos los costos directos asociados a este proyecto. Son egresos imprescindibles para el desarrollo de este proyecto.")

        # Auto items for income
        if cat_key == "ingresos":
            for auto_label in INCOME_AUTO_ITEMS:
                st.markdown(f"🔒 **{auto_label}** *(automático)*")

        # Existing items
        if items:
            for item in items:
                col_lbl, col_edit, col_del = st.columns([5, 1, 1])
                with col_lbl:
                    st.write(f"• {item['label']}")
                with col_edit:
                    if st.button("✏️", key=f"edit_{cat_key}_{item['id']}"):
                        st.session_state[f"editing_{cat_key}_{item['id']}"] = True
                with col_del:
                    if st.button("🗑️", key=f"del_{cat_key}_{item['id']}"):
                        remove_item(uid, project_id, cat_key, item["id"])
                        st.rerun()

                if st.session_state.get(f"editing_{cat_key}_{item['id']}"):
                    new_label = st.text_input("Nuevo nombre", value=item["label"],
                                              key=f"inp_{cat_key}_{item['id']}")
                    col_save, col_cancel = st.columns(2)
                    with col_save:
                        if st.button("Guardar", key=f"save_{cat_key}_{item['id']}"):
                            rename_item(uid, project_id, cat_key, item["id"], new_label)
                            del st.session_state[f"editing_{cat_key}_{item['id']}"]
                            st.rerun()
                    with col_cancel:
                        if st.button("Cancelar", key=f"cancel_{cat_key}_{item['id']}"):
                            del st.session_state[f"editing_{cat_key}_{item['id']}"]
                            st.rerun()
        else:
            if cat_key not in ("ingresos", "costos_venta"):
                st.caption("(Ítems pre-llenados — puedes agregar o eliminar)")
            else:
                st.caption("Sin ítems configurados aún.")

        # Add new item
        with st.form(f"add_item_{cat_key}", clear_on_submit=True):
            new_label = st.text_input(f"Nuevo ítem de {meta['label'].lower()}...",
                                      label_visibility="collapsed",
                                      placeholder=f"Nuevo ítem de {meta['label'].lower()}...")
            if st.form_submit_button("➕ Agregar"):
                if new_label.strip():
                    add_item(uid, project_id, cat_key, new_label.strip())
                    st.success("Ítem agregado")
                    st.rerun()

        # Cross-project option for costos/gastos venta
        if cat_key in ("costos_venta", "gastos_venta"):
            other_projects = [p for p in all_projects if p["id"] != project_id]
            if other_projects:
                st.markdown("---")
                st.markdown("🔄 **Incluir otro proyecto como egreso:**")
                with st.form(f"cross_proj_{cat_key}"):
                    cp_opts = {p["name"]: p["id"] for p in other_projects}
                    cp_sel  = st.selectbox("Selecciona un proyecto", list(cp_opts.keys()),
                                           label_visibility="collapsed")
                    if st.form_submit_button("Agregar como egreso"):
                        add_item(uid, project_id, cat_key, cp_sel)
                        st.info(f"⚠️ Recuerda revisar este egreso en tu proyecto **{cp_sel}**")
                        st.rerun()

st.divider()

# ── Movements table ───────────────────────────────────────────────────────────
st.markdown("### 📊 Movimientos del proyecto")

proj_movements = get_project_movements(uid, project_id)

# Filters
fc1, fc2, fc3 = st.columns(3)
with fc1:
    filter_month = st.selectbox("Mes", ["Todos"] + [lbl for _, lbl in MONTHS], key="pm_month")
with fc2:
    avail_types  = list({m["type"] for m in proj_movements})
    type_opts    = ["Todos"] + [MOVEMENT_TYPE_LABELS[t] for t in avail_types]
    filter_type  = st.selectbox("Tipo", type_opts, key="pm_type")
with fc3:
    type_key = next((t for t, l in MOVEMENT_TYPE_LABELS.items() if l == filter_type), None)
    if type_key:
        avail_items = list({m["item_label"] for m in proj_movements if m["type"] == type_key})
        filter_item = st.selectbox("Ítem", ["Todos"] + sorted(avail_items), key="pm_item")
    else:
        filter_item = "Todos"

# Apply filters
filtered = proj_movements[:]
if filter_month != "Todos":
    month_code = next((c for c, l in MONTHS if l == filter_month), None)
    if month_code:
        filtered = [m for m in filtered if m["date"][5:7] == month_code]
if filter_type != "Todos" and type_key:
    filtered = [m for m in filtered if m["type"] == type_key]
if filter_item != "Todos":
    filtered = [m for m in filtered if m["item_label"] == filter_item]

# Totals
fi = sum(m["amount"] for m in filtered if m["type"] == "ingreso")
fe = sum(m["amount"] for m in filtered if m["type"] != "ingreso")
m1, m2, m3 = st.columns(3)
m1.metric("Ingresos", f"+${fi:,.2f}")
m2.metric("Egresos",  f"-${fe:,.2f}")
m3.metric("Balance",  f"${fi-fe:,.2f}")

if not filtered:
    st.info("Sin movimientos con los filtros seleccionados.")
else:
    # Download filtered
    xlsx_filtered = export_filtered_xlsx(filtered, [project])
    st.download_button("📥 Descargar tus finanzas con estos filtros",
                       data=xlsx_filtered,
                       file_name=f"{project['name']}_filtrado.xlsx",
                       mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    df = movements_to_dataframe(filtered, [project])
    display_df = df.drop(columns=["_id", "Proyecto"], errors="ignore")
    st.dataframe(display_df, use_container_width=True, hide_index=True)

    # Delete a movement
    with st.expander("🗑️ Eliminar un movimiento"):
        mov_opts = {f"{m['date']} | {MOVEMENT_TYPE_LABELS.get(m['type'],'')} | {m['item_label']} | ${m['amount']:,.2f}": m["id"]
                    for m in filtered}
        sel_label = st.selectbox("Selecciona el movimiento a eliminar",
                                 ["—"] + list(mov_opts.keys()),
                                 key="del_mov_sel")
        if sel_label != "—":
            if st.button("Eliminar movimiento seleccionado", type="primary"):
                delete_movement(uid, mov_opts[sel_label])
                st.success("Movimiento eliminado")
                st.rerun()

    # ── Percentages table ──────────────────────────────────────────────────────
    st.markdown("---")
    st.markdown("#### 📈 Porcentajes y promedios del período seleccionado")
    total_all = fi + fe
    pct_rows = []
    income_by_item = {}
    expense_by_type_item = {}
    for m in filtered:
        if m["type"] == "ingreso":
            income_by_item[m["item_label"]] = income_by_item.get(m["item_label"], 0) + m["amount"]
        else:
            k = (MOVEMENT_TYPE_LABELS.get(m["type"], m["type"]), m["item_label"])
            expense_by_type_item[k] = expense_by_type_item.get(k, 0) + m["amount"]

    for item, amt in income_by_item.items():
        pct_rows.append({
            "Categoría": "Ingreso", "Ítem": item,
            "Monto": f"${amt:,.2f}",
            "% del total": f"{amt/total_all*100:.1f}%" if total_all else "—",
            "% ingresos":  f"{amt/fi*100:.1f}%"       if fi       else "—",
        })
    for (typ, item), amt in expense_by_type_item.items():
        pct_rows.append({
            "Categoría": typ, "Ítem": item,
            "Monto": f"${amt:,.2f}",
            "% del total": f"{amt/total_all*100:.1f}%" if total_all else "—",
            "% egresos":   f"{amt/fe*100:.1f}%"        if fe        else "—",
        })
    if pct_rows:
        import pandas as pd
        st.dataframe(pd.DataFrame(pct_rows), use_container_width=True, hide_index=True)

# ── Delete project ────────────────────────────────────────────────────────────
st.divider()
with st.expander("⚠️ Zona peligrosa"):
    st.warning(f"Eliminar el proyecto **{project['name']}** borrará también todos sus movimientos. Esta acción no se puede deshacer.")
    confirm = st.text_input("Escribe el nombre del proyecto para confirmar:")
    if st.button("Eliminar proyecto", type="primary"):
        if confirm.strip() == project["name"]:
            delete_project(uid, project_id)
            if "current_project_id" in st.session_state:
                del st.session_state["current_project_id"]
            st.success("Proyecto eliminado")
            st.switch_page("pages/1_Inicio.py")
        else:
            st.error("El nombre no coincide. Escribe el nombre exacto del proyecto.")
