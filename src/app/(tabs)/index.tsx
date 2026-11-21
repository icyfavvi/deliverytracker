// ─── Ruta: Bodega / Despacho ─────────────────────────────────────
//
// La pantalla vive en src/screens para mantener los archivos manejables;
// esta ruta solo la monta. Cada archivo dentro de src/app/ es una
// pantalla navegable.

import React from "react";

import { LocalScreen } from "../../screens/LocalScreen";

export default function BodegaRoute() {
  return <LocalScreen />;
}
