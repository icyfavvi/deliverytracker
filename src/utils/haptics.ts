// ─── Feedback háptico multiplataforma (SDK 58) ───────────────────
//
// Envuelve expo-haptics en try/catch (en web / simuladores sin motor
// háptico falla silenciosamente) y respeta `useReducirMovimiento()`.

import * as Haptics from "expo-haptics";

/** Dispara vibración suave al pulsar acciones interactivas. */
export async function dispararImpactoLigero(
  reducirMovimiento = false
): Promise<void> {
  if (reducirMovimiento) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // Web o dispositivo sin motor háptico disponible.
  }
}

/** Dispara notificación háptica de éxito (avance/confirmación/cancelación). */
export async function dispararNotificacionExito(
  reducirMovimiento = false
): Promise<void> {
  if (reducirMovimiento) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // Web o dispositivo sin motor háptico disponible.
  }
}

/** Dispara notificación háptica de error de validación u operación. */
export async function dispararNotificacionError(
  reducirMovimiento = false
): Promise<void> {
  if (reducirMovimiento) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {
    // Web o dispositivo sin motor háptico disponible.
  }
}
