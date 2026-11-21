// ─── Hook: useReducirMovimiento ──────────────────────────────────
//
// Respeta la preferencia del sistema "Reducir movimiento". Cuando está
// activa, las animaciones de la app se saltan: el contenido aparece de
// golpe, sin transiciones que puedan molestar a personas sensibles
// al movimiento.

import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducirMovimiento(): boolean {
  const [reducir, setReducir] = useState(false);

  useEffect(() => {
    let vigente = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((activo) => {
        if (vigente) setReducir(activo);
      })
      .catch(() => {
        // Si no podemos consultarlo, asumimos movimiento normal.
      });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (activo) => setReducir(activo)
    );

    return () => {
      vigente = false;
      subscription.remove();
    };
  }, []);

  return reducir;
}
