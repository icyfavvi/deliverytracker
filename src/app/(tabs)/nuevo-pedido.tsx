// ─── Ruta: Crear pedido (Admin / Bodega) ────────────────────────
//
// Oculta de la barra de pestañas (`href: null`); protegida con sesión.

import React from "react";

import { useAuth } from "../../context/AuthContext";
import { CrearPedidoScreen } from "../../screens/CrearPedidoScreen";
import { LoginScreen } from "../../screens/LoginScreen";

export default function NuevoPedidoRoute() {
  const { sesion, cargando } = useAuth();
  if (cargando) return null;
  return sesion ? <CrearPedidoScreen /> : <LoginScreen />;
}

