// ─── Reglas puras del polling adaptativo ─────────────────────────
//
// Sin dependencias de React Native para poder verificar backoff y
// detención terminal directamente en pruebas unitarias de Node.js.

import { EstadoPedido } from "../types/pedido";

export function esEstadoTerminal(estado?: EstadoPedido | null): boolean {
  return estado === "entregado";
}

export function calcularIntervaloPolling(
  tiempoTranscurridoMs: number,
  intervaloInicial: number,
  intervaloLargo: number,
  umbralCambio: number
): { intervaloMs: number; esFrecuenciaLenta: boolean } {
  const esFrecuenciaLenta = tiempoTranscurridoMs >= umbralCambio;
  return {
    intervaloMs: esFrecuenciaLenta ? intervaloLargo : intervaloInicial,
    esFrecuenciaLenta,
  };
}
