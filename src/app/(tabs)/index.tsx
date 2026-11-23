// ─── Ruta: Bodega / Despacho ─────────────────────────────────────
//
// La bodega es solo para personal: sin sesión se muestra el login.
// La pantalla vive en src/screens; esta ruta solo la monta.

import React from "react";

import { useAuth } from "../../context/AuthContext";
import { LocalScreen } from "../../screens/LocalScreen";
import { LoginScreen } from "../../screens/LoginScreen";

export default function BodegaRoute() {
  const { sesion, cargando } = useAuth();
  if (cargando) return null;
  return sesion ? <LocalScreen /> : <LoginScreen />;
}
