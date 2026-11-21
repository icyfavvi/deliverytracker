// ─── Manejador de Configuración y Secretos ─────────────────────────
// Lee variables seguras desde process.env (EXPO_PUBLIC_*)
// Si no están configuradas en el archivo .env local, usa fallbacks seguros
// para desarrollo local. Nunca quemar API keys o tokens de producción en el código.

export const CONFIG = {
  env: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://api.vogueatelier.local/v1",
  storeName: process.env.EXPO_PUBLIC_STORE_NAME ?? "Atelier Noir — Urban Apparel",
  // Token seguro simulado: se oculta en el manejador y no se expone directamente
  apiSecretToken: process.env.EXPO_PUBLIC_SECRET_TOKEN ?? "dev_secret_vault_token_simulated",
  isProduction: process.env.EXPO_PUBLIC_APP_ENV === "production",
} as const;
