// ─── Formateo monetario CLP compartido ────────────────────────────

/** Formatea un monto en pesos chilenos (CLP). */
export function formatearCLP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}
