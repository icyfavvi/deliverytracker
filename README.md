# 🛍️ Atelier Noir — Sistema de Seguimiento de Despacho (E-commerce de Ropa)

Aplicación móvil y web de seguimiento de pedidos y gestión de bodega para e-commerce de vestuario.  
**Evaluación Unidad 3 — Desarrollo de Aplicaciones Móviles y Web (UTEM)**  
**Tema T06:** Seguimiento de pedidos para despacho de compras online.

---

## 🏗️ Arquitectura y Mapa del Proyecto

```text
deliverytracker/
├── app.json                         → Configuración Expo SDK 58 y esquema de rutas
├── package.json                     → Scripts y dependencias (Expo Router, Google Fonts, Crypto)
├── tsconfig.json                    → Configuración TypeScript
├── AGENTS.md                        → Reglas y mapa de contexto para desarrollo con IA
├── .env.example                     → Plantilla de variables de entorno
├── .gitignore                       → Exclusión de node_modules, .env*, keystores y graphify-out/
├── tests/
│   └── verify-core.ts               → Suite automatizada de negocio y máquina de estados
└── src/
    ├── app/                         → Rutas Expo Router
    │   ├── _layout.tsx              → Carga de fuentes y proveedores globales (Tema, Auth, Pedidos)
    │   └── (tabs)/
    │       ├── _layout.tsx          → Navegación inferior (Bodega / Rastreo) con badge activo
    │       ├── index.tsx            → Pestaña Bodega protegida por sesión (LoginScreen / LocalScreen)
    │       └── cliente.tsx          → Pestaña Rastreo pública (ClienteScreen)
    ├── types/
    │   └── pedido.ts                → Tipos estrictos (EstadoPedido, Pedido, ItemPedido, EstadoUI<T>)
    ├── constants/
    │   └── config.ts                → Configuración centralizada vía EXPO_PUBLIC_*
    ├── services/
    │   ├── pedidosApi.ts            → API mock (/v1/pedidos) con índice O(1), inicio en 0 y eventos
    │   └── authLocal.ts             → Autenticación local (SHA-256 iterado + sal con expo-crypto)
    ├── context/
    │   ├── PedidosContext.tsx       → Estado compartido de órdenes y estadísticas derivadas
    │   └── AuthContext.tsx          → Sesión de operador de bodega en AsyncStorage
    ├── hooks/
    │   ├── usePedidoPolling.ts      → Polling adaptativo (5s → 30s) con cleanup explícito
    │   └── useReducirMovimiento.ts  → Respeto de preferencia de movimiento reducido del sistema
    ├── theme/
    │   ├── tokens.ts                → Sistema visual Atelier Noir (claro/oscuro, cobalto, radios 24/16/10, 44pt)
    │   └── ThemeProvider.tsx        → Proveedor de tema persistente en AsyncStorage
    ├── components/                  → UI reutilizable (Boton, CampoTexto, Masthead, PedidoCard,
    │                                   EstadoPedidoBadge, StepperProgreso, TarjetaMetrica,
    │                                   EstadoUIRenderer, AvisoFlotante, InterruptorTema, BotonSalir, Icon)
    └── screens/
        ├── LoginScreen.tsx          → Acceso / registro de personal de bodega
        ├── LocalScreen.tsx          → Panel de bodega: métricas, creación de despachos y avance
        └── ClienteScreen.tsx        → Vista cliente: búsqueda por código, timeline y polling en vivo
```

---

## 📋 Cumplimiento de Pauta y Rúbrica Técnica

| Requisito de la Rúbrica | Implementación en el Proyecto |
| :--- | :--- |
| **Dominio E-commerce** | Tienda de vestuario *Atelier Noir*: prendas, tallas, colores, dirección de entrega y courier. |
| **Sincronización en Cliente** | Almacén compartido con suscriptores reactivos y polling resiliente entre Bodega y Cliente. |
| **Aviso al Cliente** | Banner animado (`AvisoFlotante`) con `accessibilityLiveRegion="polite"` al detectar cambios de estado. |
| **Polling con intervalo creciente** | Consulta cada 5s durante los primeros 30s y luego cada 30s para ahorrar batería. |
| **Cleanup de recursos** | Cancelación explícita de timers en `useEffect` dentro de `usePedidoPolling.ts`. |
| **4 Estados de UI discriminados** | Unión discriminada `EstadoUI<T>` (`cargando` \| `error` \| `vacio` \| `datos`) en `EstadoUIRenderer.tsx`. |
| **Capa de Servicios Separada** | `pedidosApi.ts` encapsula respuestas HTTP simuladas (`200`, `201`, `400`, `404`, `409`). |
| **Estructura de Datos O(1)** | Diccionario indexado por código (`Record<string, Pedido>`) con lista cronológica derivada. |
| **Seguridad y Secretos** | `authLocal.ts` con hash SHA-256 + sal; `.env*` ignorado en Git y advertencia en `config.ts`. |

---

## 🚀 Cómo Levantar y Verificar el Proyecto

```bash
# 1. Clonar e instalar dependencias
git clone <url-del-repositorio>
cd deliverytracker
npm install

# 2. Verificar tipos, lint y pruebas de dominio
npx tsc --noEmit
npm run lint
npm test

# 3. Levantar la aplicación en Web o Expo Go
npx expo start --web
```

---

## 🎨 Sistema Visual, Accesibilidad y Responsividad

- **Paletas Claro / Oscuro:** Sistema *Atelier Noir* con acentos azul cobalto (`#3e6ff6` / `#244dcc`), modo claro (`#f4f6f8` / `#ffffff`) y modo oscuro (`#0a0d10` / `#101419` / `#171c23`).
- **Tipografía:** `Space Grotesk` (títulos y métricas), `Manrope` (cuerpo $\ge 12\text{px}$) y `DM Mono` (códigos, etiquetas y precios).
- **Accesibilidad WCAG AA:** Áreas táctiles mínimas de `44×44pt` (`PUNTO_MINIMO`), contraste $\ge 4.5:1$ en texto normal y etiquetas `accessibilityLabel` / `accessibilityRole`.
- **Diseño Responsivo:** Una columna fluida en móvil y layout de dos columnas en tablet/web a partir de `BREAKPOINTS.tablet` (`840px`).
