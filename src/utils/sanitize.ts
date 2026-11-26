// ─── Sanitización de entradas de usuario ──────────────────────────

/** Escapa caracteres HTML para prevenir XSS */
export function escaparHTML(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Sanitiza input de usuario: trim + escapar HTML */
export function sanitizarInput(input: string): string {
  return escaparHTML(input.trim());
}
