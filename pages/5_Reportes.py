"""Reports — filterable table + downloads."""
import streamlit as st
import pandas as pd
from datetime import datetime
from utils.session import auth_guard, render_sidebar, get_user
from utils.data_service import get_projects, get_movements
from utils.export_service import (
    export_project_xlsx, export_all_projects_xlsx,
    export_filtered_xlsx, movements_to_dataframe,
)
from utils.defaults import MONTHS, MOVEMENT_TYPE_LABELS

st.set_page_config(page_title="Reportes · Finanzas Ciberpiratas", layout="wide")
auth_guard()
render_sidebar()

user      = get_user()
uid       = user["id"]
projects  = get_projects(uid)
movements = get_movements(uid)
year      = datetime.now().year

st.markdown("## 📊 Finanzas")

if not projects:
    st.info("No tienes proyectos aún.")
    st.stop()

# ── Summary ───────────────────────────────────────────────────────────────────
total_i = sum(m["amount"] for m in movements if m["type"] == "ingreso")
total_e = sum(m["amount"] for m in movements if m["type"] != "ingreso")
c1, c2, c3 = st.columns(3)
c1.metric("💰 Total Ingresos", f"${total_i:,.2f}")
c2.metric("📤 Total Egresos",  f"${total_e:,.2f}")
c3.metric("⚖️ Balance",        f"${total_i-total_e:,.2f}")

st.divider()

# ── Filters ───────────────────────────────────────────────────────────────────
fc1, fc2, fc3 = st.columns(3)
with fc1:
    proj_opts = {"Todos los proyectos": None}
    proj_opts.update({p["name"]: p["id"] for p in projects})
    sel_proj  = st.selectbox("Proyecto", list(proj_opts.keys()))
    proj_id   = proj_opts[sel_proj]

with fc2:
    year_opts = list(range(year - 2, year + 2))
    sel_year  = st.selectbox("Año", year_opts, index=year_opts.index(year))

with fc3:
    month_opts = {"Todos los meses": None}
    month_opts.update({lbl: code for code, lbl in MONTHS})
    sel_month  = st.selectbox("Mes", list(month_opts.keys()))
    month_code = month_opts[sel_month]

# Apply filters
filtered = movements[:]
if proj_id:
    filtered = [m for m in filtered if m["project_id"] == proj_id]
filtered = [m for m in filtered if m["date"].startswith(str(sel_year))]
if month_code:
    filtered = [m for m in filtered if m["date"][5:7] == month_code]

fi = sum(m["amount"] for m in filtered if m["type"] == "ingreso")
fe = sum(m["amount"] for m in filtered if m["type"] != "ingreso")

# ── Download buttons ──────────────────────────────────────────────────────────
dc1, dc2, dc3 = st.columns(3)
with dc1:
    all_xlsx = export_all_projects_xlsx(projects, movements, sel_year)
    st.download_button("📥 Todos los proyectos", data=all_xlsx,
                       file_name=f"finanzas_{sel_year}.xlsx",
                       mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                       use_container_width=True)
with dc2:
    if proj_id:
        proj_obj   = next(p for p in projects if p["id"] == proj_id)
        proj_movs  = [m for m in movements if m["project_id"] == proj_id]
        proj_xlsx  = export_project_xlsx(proj_obj, proj_movs, sel_year)
        st.download_button(f"📥 {proj_obj['name']}", data=proj_xlsx,
                           file_name=f"{proj_obj['name']}_{sel_year}.xlsx",
                           mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           use_container_width=True)
with dc3:
    if filtered:
        filt_xlsx = export_filtered_xlsx(filtered, projects)
        st.download_button("📥 Descargar con estos filtros", data=filt_xlsx,
                           file_name="movimientos_filtrados.xlsx",
                           mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                           use_container_width=True)

st.divider()

# ── Table per project ─────────────────────────────────────────────────────────
display_projects = [p for p in projects if not proj_id or p["id"] == proj_id]

for proj in display_projects:
    pm = [m for m in filtered if m["project_id"] == proj["id"]]
    pi = sum(m["amount"] for m in pm if m["type"] == "ingreso")
    pe = sum(m["amount"] for m in pm if m["type"] != "ingreso")

    with st.expander(f"**{proj['name']}** — Ingresos: ${pi:,.2f} | Egresos: ${pe:,.2f} | Balance: ${pi-pe:,.2f}",
                     expanded=True):
        if not pm:
            st.caption("Sin movimientos en el período seleccionado.")
            continue

        # Sub-filters
        sf1, sf2 = st.columns(2)
        with sf1:
            avail_types = list({m["type"] for m in pm})
            t_opts = ["Todos"] + [MOVEMENT_TYPE_LABELS[t] for t in avail_types]
            st_type = st.selectbox("Tipo", t_opts, key=f"st_{proj['id']}")
        with sf2:
            tkey = next((t for t, l in MOVEMENT_TYPE_LABELS.items() if l == st_type), None)
            if tkey:
                avail_items = list({m["item_label"] for m in pm if m["type"] == tkey})
                st_item = st.selectbox("Ítem", ["Todos"] + sorted(avail_items), key=f"si_{proj['id']}")
            else:
                st_item = "Todos"

        sub = pm[:]
        if st_type != "Todos" and tkey:
            sub = [m for m in sub if m["type"] == tkey]
        if st_item != "Todos":
            sub = [m for m in sub if m["item_label"] == st_item]

        df = movements_to_dataframe(sub, [proj])
        st.dataframe(df.drop(columns=["_id", "Proyecto"], errors="ignore"),
                     use_container_width=True, hide_index=True)

        # Percentages
        si = sum(m["amount"] for m in sub if m["type"] == "ingreso")
        se = sum(m["amount"] for m in sub if m["type"] != "ingreso")
        stot = si + se

        pct_rows = []
        by_item = {}
        for m in sub:
            key = (MOVEMENT_TYPE_LABELS.get(m["type"], m["type"]), m["item_label"])
            by_item[key] = by_item.get(key, 0) + m["amount"]

        for (typ_lbl, item_lbl), amt in by_item.items():
            base = si if typ_lbl == "Ingreso" else se
            pct_rows.append({
                "Tipo": typ_lbl, "Ítem": item_lbl,
                "Monto": f"${amt:,.2f}",
                "% del total": f"{amt/stot*100:.1f}%" if stot else "—",
                "% tipo":      f"{amt/base*100:.1f}%" if base else "—",
            })
        if pct_rows:
            st.markdown("**Porcentajes del período:**")
            st.dataframe(pd.DataFrame(pct_rows), use_container_width=True, hide_index=True)
