# ===== DEFAULTS / CONSTANTS =====

MOVEMENT_TYPE_LABELS = {
    "ingreso":           "Ingreso",
    "costo_venta":       "Costo de venta",
    "gasto_venta":       "Gasto de venta",
    "gasto_operacional": "Gasto operacional",
    "pago_deuda":        "Pago deuda",
}

EXPENSE_TYPES = ["costo_venta", "gasto_venta", "gasto_operacional", "pago_deuda"]

INCOME_AUTO_ITEMS = ["Préstamos"]

DEFAULT_GASTOS_OPERACIONALES = [
    "Renta",
    "Despensa ó mercado",
    "Celular e Internet",
    "Luz",
    "Agua",
    "Mantenimiento ó administración",
    "Transporte",
    "Taxis",
    "Mantenimiento vehicular",
    "Gasolina",
    "Peajes o parqueadero",
    "Otros",
]

DEFAULT_GASTOS_VENTA = [
    "Papelería",
    "Gastos médicos",
    "Autocuidado",
    "Deporte",
    "Plataformas",
    "Tienditas",
    "Café y similares",
    "Salidas de trabajo",
    "Comidas Fuera",
    "Fiestas o salidas",
    "Viajes",
    "Regalos",
    "Ropa (y otras compras)",
    "Cosas que no me debí gastar",
    "Impuestos y bancarios",
    "Disposición de efectivo",
    "Préstamos",
    "Otros",
]

DEFAULT_PAGO_DEUDAS = [
    "Tarjeta de crédito 1",
    "Tarjeta de crédito 2",
    "Tarjeta departamental",
    "Créditos",
    "Otros",
]

MONTHS = [
    ("01", "Enero"),   ("02", "Febrero"), ("03", "Marzo"),
    ("04", "Abril"),   ("05", "Mayo"),    ("06", "Junio"),
    ("07", "Julio"),   ("08", "Agosto"),  ("09", "Septiembre"),
    ("10", "Octubre"), ("11", "Noviembre"),("12", "Diciembre"),
]

MONTH_LABELS = {m: lbl for m, lbl in MONTHS}


def create_default_items() -> dict:
    """Return the default items structure for a new project."""
    import uuid
    def make(labels):
        return [{"id": str(uuid.uuid4()), "label": l, "is_default": True} for l in labels]

    return {
        "ingresos":             [],           # user creates manually
        "costos_venta":         [],           # user creates manually
        "gastos_venta":         make(DEFAULT_GASTOS_VENTA),
        "gastos_operacionales": make(DEFAULT_GASTOS_OPERACIONALES),
        "pago_deudas":          make(DEFAULT_PAGO_DEUDAS),
    }


CATEGORY_META = {
    "ingresos":             {"type": "ingreso",           "label": "Ingresos",             "icon": "💰"},
    "costos_venta":         {"type": "costo_venta",       "label": "Costos de Venta",      "icon": "🏭"},
    "gastos_venta":         {"type": "gasto_venta",       "label": "Gastos de Venta",      "icon": "🛍️"},
    "gastos_operacionales": {"type": "gasto_operacional", "label": "Gastos Operacionales", "icon": "⚙️"},
    "pago_deudas":          {"type": "pago_deuda",        "label": "Pago Deudas",          "icon": "💳"},
}

TYPE_TO_CATEGORY = {v["type"]: k for k, v in CATEGORY_META.items()}
