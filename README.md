# 🛍️ Atelier Noir — Sistema de Seguimiento de Despacho (E-commerce de Ropa)

Aplicación móvil y web de seguimiento de pedidos para e-commerce de moda y vestuario.  
**Evaluación Unidad 3 — Desarrollo de Aplicaciones Móviles y Web (UTEM)**  
**Tema T06:** Seguimiento de pedidos para despacho de compras online.

---

## 🏗️ Arquitectura y Principios de Diseño

```
deliverytracker/
├── App.tsx                          → Configuración de navegación por pestañas (Bodega / Cliente)
├── index.ts                         → Punto de entrada Expo
├── app.json                         → Configuración Expo SDK 58
├── package.json                     → Scripts y dependencias
├── tsconfig.json                    → Configuración TypeScript
├── .env.example                     → Plantilla de variables de entorno seguras
├── .gitignore                       → Exclusión de node_modules, .env*, keystores y graphify-out/
├── tests/
│   └── verify-core.ts               → Suite de pruebas automatizadas de arquitectura y negocio
└── src/
    ├── types/
    │   └── pedido.ts                → Tipos estrictos (EstadoPedido, Pedido, ItemPedido, EstadoUI<T>)
    ├── constants/
    │   ├── theme.ts                 → Tokens de diseño (colores, espaciados, MIN_TOUCH_TARGET = 48)
    │   └── config.ts                → Manejador centralizado de variables y secretos
    ├── services/
    │   └── pedidosApi.ts            → Capa de servicios REST mock con persistencia y sincronización reactiva
    ├── hooks/
    │   └── usePedidoPolling.ts      → Polling con intervalo creciente (5s → 30s) + cleanup de memoria
    ├── components/
    │   ├── EstadoPedidoBadge.tsx     → Badge de estado con indicador visual
    │   ├── PedidoCard.tsx           → Tarjeta de orden con desglose de prendas, tallas y avance
    │   └── EstadoUIRenderer.tsx     → Renderizado discriminado (cargando, error, vacío, datos)
    └── screens/
        ├── LocalScreen.tsx          → Panel de Bodega: registro de despachos y avance de ciclo
        └── ClienteScreen.tsx        → Vista Cliente: rastreo por código, aviso en vivo y polling
```

---

## 📋 Cumplimiento de Pauta y Rúbrica Técnica

| Requisito de la Rúbrica | Implementación en el Proyecto |
|---|---|
| **Dominio E-commerce** | Enfoque de tienda de vestuario: prendas, tallas, variantes, dirección de entrega y courier express. |
| **Sincronización en Cliente** | Sincronización bidireccional inmediata (almacén compartido + oyente reactivo + polling resiliente). |
| **Aviso al Cliente** | Banner animado in-app que notifica inmediatamente en pantalla cuando el estado cambia. |
| **Polling con intervalo creciente** | Consulta cada 5s durante los primeros 30s; luego pasa automáticamente a cada 30s para ahorro de batería. |
| **Cleanup de recursos** | Función de limpieza explícita en `return` del `useEffect` en `usePedidoPolling.ts` que cancela timeouts y previene fugas de memoria (OOM Killer). |
| **4 Estados de UI discriminados** | Modelado estricto con unión discriminada `{tipo: "cargando"} \| {tipo: "error"} \| {tipo: "vacio"} \| {tipo: "datos"}`. |
| **Capa de Servicios Separada** | `pedidosApi.ts` encapsula las peticiones y códigos HTTP (200, 201, 400, 404, 409). Componentes nunca hacen llamadas crudas. |
| **Estructura de Datos O(1)** | Almacenamiento indexado por código (`Record<string, Pedido>`) para acceso directo en tiempo constante $O(1)$. Lista derivada con `Object.values`. |
| **Manejo de Secretos** | Módulo `src/constants/config.ts` y plantilla `.env.example`. Archivos `.env*` ignorados en `.gitignore`. |
| **Graphify** | Directorio `graphify-out/` ignorado en `.gitignore` para permitir a la IA trabajar con el grafo de código local sin ensuciar el repositorio. |

---

## 🚀 Cómo Levantar el Proyecto

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd deliverytracker

# 2. Instalar dependencias
npm install

# 3. Ejecutar suite de pruebas de arquitectura
npm test

# 4. Levantar la aplicación en entorno Web / Móvil
npx expo start --web
```

---

## 📱 Adaptabilidad Responsive

1. **Pantallas compactas (~5" / 320px):** Layout en una sola columna fluida, textos protegidos con `numberOfLines` y `flexShrink`, botones con área táctil mínima de 48pt.
2. **Pantallas estándar (~6.7" / 390–430px):** Espaciado ergonómico, chips de prueba rápida y barra de progreso de 4 fases visible.
3. **Tablets y Desktop (>600px):** Dashboard adaptativo de dos columnas (panel de registro a la izquierda, lista de monitoreo a la derecha).
4. **Accesibilidad y Tamaño de Letra Aumentado:** Contenedores elásticos basados en Flexbox proporcional que no se desbordan al aumentar la tipografía del sistema.
