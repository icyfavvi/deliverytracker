// ─── Manejador de Configuración y Secretos ─────────────────────────
// Lee variables seguras desde process.env (EXPO_PUBLIC_*)
// Si no están configuradas en el archivo .env local, usa fallbacks seguros
// para desarrollo local.
//
// NOTA DE SEGURIDAD PARA PRODUCCIÓN:
// En Expo, cualquier variable con prefijo EXPO_PUBLIC_* se incrusta en el bundle
// de JavaScript del cliente. Para producción con backend real, los tokens
// secretos o llaves de API deben residir exclusivamente en el servidor y consumirse
// a través de endpoints autenticados sin prefijo EXPO_PUBLIC_.

export const CONFIG = {
  env: process.env.EXPO_PUBLIC_APP_ENV ?? "development",
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? "https://api.vogueatelier.local/v1",
  storeName: process.env.EXPO_PUBLIC_STORE_NAME ?? "Atelier Noir — Urban Apparel",
  isProduction: process.env.EXPO_PUBLIC_APP_ENV === "production",
} as const;
