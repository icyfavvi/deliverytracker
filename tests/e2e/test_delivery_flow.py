"""Suite E2E (Playwright) para Atelier Noir Delivery Tracker (React Native Web).

Cubre los 3 flujos clave solicitados:
1. Flujo Cliente: Agregar Noir Core Hoodie al carrito -> Confirmar compra -> Copiar código.
2. Flujo Rastreo: Consultar código copiado -> Comprobar stepper en estado inicial (paso 1 de 4).
3. Flujo Bodega + Actualización Reactiva: Login operadora -> Avanzar a Preparando -> En camino (Listo)
   -> Entregado -> Verificar actualización reactiva en tiempo real en la vista cliente.
"""

from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

from playwright.sync_api import BrowserContext, Page, expect, sync_playwright

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


def lanzar_navegador(playwright):
    """Usa Chrome local si existe para evitar descargas de binarios extra."""
    chrome_win = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    if os.path.exists(chrome_win):
        return playwright.chromium.launch(executable_path=chrome_win, headless=True)
    return playwright.chromium.launch(headless=True)


def extraer_codigo_orden(page: Page) -> str:
    """Extrae el código alfanumérico de 4 caracteres desde 'PEDIDO #XXXX'."""
    loc = page.get_by_text(re.compile(r"^PEDIDO #[A-Z0-9]{4}$")).first
    expect(loc).to_be_visible(timeout=15_000)
    texto = loc.inner_text().strip()
    match = re.search(r"#([A-Z0-9]{4})$", texto)
    assert match, f"No se pudo extraer código de 4 caracteres desde '{texto}'"
    return match.group(1)


def ejecutar_flujo_e2e(base_url: str) -> None:
    ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
    errores_pagina: list[str] = []

    with sync_playwright() as p:
        browser = lanzar_navegador(p)
        context: BrowserContext = browser.new_context(
            viewport={"width": 1280, "height": 900},
            permissions=["clipboard-read", "clipboard-write"],
        )

        page = context.new_page()
        page.on("pageerror", lambda err: errores_pagina.append(f"Tab1: {err}"))

        # ── 0. Arranque limpio en Login ──────────────────────────────────
        page.goto(base_url, wait_until="networkidle")
        page.evaluate("() => { window.localStorage.clear(); }")
        page.reload(wait_until="networkidle")
        expect(page.get_by_text("Entra a tu espacio.")).to_be_visible(timeout=20_000)

        # ── 1. Flujo Cliente: Hoodie -> Confirmar compra -> Copiar código ─
        page.get_by_role("button", name="Explorar vista cliente").click()
        expect(page.get_by_text("Rastrea tu pedido.")).to_be_visible(timeout=15_000)

        # Cambiar a Resumen y agregar Noir Core Hoodie
        page.get_by_role("tab", name="Resumen").click()
        expect(page.get_by_text("Noir Core Hoodie").first).to_be_visible(timeout=10_000)
        page.get_by_role("button", name="Añadir Noir Core Hoodie").click()

        # Verificar modal Finalizar compra sin recargo oculto ($54.990)
        expect(page.get_by_text("Finalizar compra", exact=True)).to_be_visible(
            timeout=10_000
        )
        expect(page.get_by_text("$54.990").first).to_be_visible()
        page.get_by_role("button", name="Confirmar compra", exact=True).click()

        # Confirmar código generado y copiar al portapapeles
        codigo = extraer_codigo_orden(page)
        page.evaluate("(cod) => navigator.clipboard.writeText(cod)", codigo)
        codigo_portapapeles = page.evaluate("() => navigator.clipboard.readText()")
        assert codigo_portapapeles == codigo, (
            f"Portapapeles '{codigo_portapapeles}' != '{codigo}'"
        )
        print(f"[E2E] 1/3 Flujo Cliente OK -> Pedido #{codigo} creado y copiado")

        # ── 2. Flujo Rastreo: Consultar código y comprobar stepper inicial ─
        input_codigo = page.get_by_label("Código de seguimiento de tu orden")
        input_codigo.fill("")
        input_codigo.fill(codigo_portapapeles)
        page.get_by_role("button", name="Rastrear pedido").click()

        expect(page.get_by_label("Estado del pedido: Confirmado")).to_be_visible(
            timeout=10_000
        )
        stepper_paso_1 = page.locator(
            '[aria-label="Progreso del despacho: paso 1 de 4, Confirmado"]'
        )
        expect(stepper_paso_1).to_be_visible(timeout=10_000)
        page.screenshot(path=str(ARTIFACTS_DIR / "01_rastreo_recibido.png"))
        print(f"[E2E] 2/3 Flujo Rastreo OK -> Stepper paso 1/4 (Confirmado) para #{codigo}")

        # ── 3. Flujo Bodega + Actualización Reactiva en Cliente ──────────
        # Abrir segunda pestaña de Cliente escuchando cambios en vivo (storage + polling)
        cliente_live = context.new_page()
        cliente_live.on("pageerror", lambda err: errores_pagina.append(f"Tab2: {err}"))
        cliente_live.goto(f"{base_url}/cliente?codigo={codigo}", wait_until="networkidle")
        expect(
            cliente_live.locator(
                '[aria-label="Progreso del despacho: paso 1 de 4, Confirmado"]'
            )
        ).to_be_visible(timeout=15_000)

        # Volver a Tab 1 y entrar a Bodega como Operadora nueva
        page.get_by_label("Bodega y despacho").click()
        expect(page.get_by_text("Entra a tu espacio.")).to_be_visible(timeout=10_000)

        page.get_by_text("Crear otra cuenta", exact=True).click()
        expect(page.get_by_text("Crea tu cuenta.", exact=True)).to_be_visible(
            timeout=10_000
        )
        page.get_by_label("Usuario o correo", exact=True).fill("operadora.sqa")
        page.get_by_label("Contraseña", exact=True).fill("ClaveSegura123")
        page.get_by_label("Repetir contraseña", exact=True).fill("ClaveSegura123")
        page.get_by_role("button", name="Crear cuenta", exact=True).click()

        # La operadora cae directamente en la vista Pedidos de Bodega
        expect(page.get_by_text(f"#{codigo}").first).to_be_visible(timeout=15_000)

        # Paso 1 -> Preparando
        page.get_by_role(
            "button", name=f"Avanzar pedido {codigo} a En preparación"
        ).click()
        expect(page.get_by_label("Estado del pedido: En preparación").first).to_be_visible(
            timeout=10_000
        )
        expect(
            cliente_live.locator(
                '[aria-label="Progreso del despacho: paso 2 de 4, Preparando"]'
            )
        ).to_be_visible(timeout=10_000)
        expect(cliente_live.get_by_text("Tu pedido cambió de estado")).to_be_visible(
            timeout=10_000
        )

        # Paso 2 -> En camino (estado interno 'listo')
        page.get_by_role(
            "button", name=f"Avanzar pedido {codigo} a En camino"
        ).click()
        expect(page.get_by_label("Estado del pedido: En camino").first).to_be_visible(
            timeout=10_000
        )
        expect(
            cliente_live.locator(
                '[aria-label="Progreso del despacho: paso 3 de 4, En camino"]'
            )
        ).to_be_visible(timeout=10_000)

        # Paso 3 -> Entregado (estado terminal)
        page.get_by_role(
            "button", name=f"Avanzar pedido {codigo} a Entregado"
        ).click()
        expect(page.get_by_text("Despacho completado").first).to_be_visible(timeout=10_000)
        page.screenshot(path=str(ARTIFACTS_DIR / "02_bodega_entregado.png"))

        expect(
            cliente_live.locator(
                '[aria-label="Progreso del despacho: paso 4 de 4, Entregado"]'
            )
        ).to_be_visible(timeout=10_000)
        expect(
            cliente_live.get_by_text("Entrega completada · polling detenido")
        ).to_be_visible(timeout=10_000)
        cliente_live.screenshot(path=str(ARTIFACTS_DIR / "03_cliente_entregado_reactivo.png"))

        print(
            f"[E2E] 3/3 Flujo Bodega & Sync Reactivo OK -> #{codigo} "
            "(Preparando -> En camino -> Entregado, polling detenido)"
        )

        browser.close()

    assert not errores_pagina, f"Errores no controlados en consola/página: {errores_pagina}"


def main() -> int:
    parser = argparse.ArgumentParser(description="E2E Playwright Atelier Noir")
    parser.add_argument(
        "--url",
        default="http://localhost:8081",
        help="URL base de Expo Web (default: http://localhost:8081)",
    )
    args = parser.parse_args()
    ejecutar_flujo_e2e(args.url.rstrip("/"))
    return 0


if __name__ == "__main__":
    sys.exit(main())
