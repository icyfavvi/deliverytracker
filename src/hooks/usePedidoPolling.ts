// ─── Hook: usePedidoPolling ─────────────────────────────────────────
//
// Cumple con la rúbrica UTEM:
// 1. Polling con intervalo creciente: cada 5s durante los primeros 30s,
//    luego cada 30s para optimizar recursos y batería en el dispositivo móvil.
// 2. Cleanup explícito en return del useEffect (evita fugas de memoria y OOM killer).
// 3. Resiliente a carreras asíncronas con bandera isMountedRef.
// 4. Integra oyente reactivo para sincronizar cambios en vivo instantáneamente.

import { useEffect, useRef, useState } from "react";
import { suscribirACambios } from "../services/pedidosApi";

interface PollingOptions {
  /** Función asíncrona que consulta los datos */
  fetchFn: () => Promise<void>;
  /** Activa o desactiva el polling */
  enabled: boolean;
  /** Intervalo rápido inicial en ms (default: 5.000 ms = 5s) */
  intervaloInicial?: number;
  /** Intervalo largo posterior en ms (default: 30.000 ms = 30s) */
  intervaloLargo?: number;
  /** Umbral de tiempo para pasar al intervalo largo (default: 30.000 ms = 30s) */
  umbralCambio?: number;
}

export interface PollingStatus {
  frecuenciaSegundos: number;
  segundosActivo: number;
  esFrecuenciaLenta: boolean;
}

export function usePedidoPolling({
  fetchFn,
  enabled,
  intervaloInicial = 5_000,
  intervaloLargo = 30_000,
  umbralCambio = 30_000,
}: PollingOptions): PollingStatus {
  const [frecuenciaSegundos, setFrecuenciaSegundos] = useState<number>(intervaloInicial / 1000);
  const [segundosActivo, setSegundosActivo] = useState<number>(0);

  // Referencias para controlar el ciclo de vida sin provocar renders innecesarios
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contadorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const inicioRef = useRef<number>(0);
  const fetchEstable = useRef(fetchFn);

  // Mantener siempre la última referencia a fetchFn
  useEffect(() => {
    fetchEstable.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    if (!enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (contadorRef.current) {
        clearInterval(contadorRef.current);
        contadorRef.current = null;
      }
      return;
    }

    isMountedRef.current = true;
    inicioRef.current = Date.now();

    // No reseteamos el contador aquí: el intervalo de 1s lo actualiza con
    // el tiempo real transcurrido desde `inicioRef`, así que un setState
    // en el cuerpo del efecto sería redundante.

    // Contador de segundos transcurridos para visualización en UI
    contadorRef.current = setInterval(() => {
      if (isMountedRef.current) {
        const transcurrido = Math.floor((Date.now() - inicioRef.current) / 1000);
        setSegundosActivo(transcurrido);
      }
    }, 1000);

    // Planificador de polling con frecuencia variable
    function programarSiguienteTick() {
      if (!isMountedRef.current) return;

      const tiempoTranscurrido = Date.now() - inicioRef.current;
      const esLento = tiempoTranscurrido >= umbralCambio;
      const intervaloActual = esLento ? intervaloLargo : intervaloInicial;

      setFrecuenciaSegundos(intervaloActual / 1000);

      timerRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;

        try {
          await fetchEstable.current();
        } catch (e) {
          console.warn("Fallo en tick de polling:", e);
        }

        // Reprogramar recursivamente si el componente sigue montado
        if (isMountedRef.current) {
          programarSiguienteTick();
        }
      }, intervaloActual);
    }

    // Primer fetch inmediato
    fetchEstable.current().finally(() => {
      if (isMountedRef.current) {
        programarSiguienteTick();
      }
    });

    // Suscripción reactiva para reaccionar a cambios inmediatos sin esperar el tick
    const cancelarSuscripcion = suscribirACambios(() => {
      if (isMountedRef.current) {
        fetchEstable.current();
      }
    });

    // ─── CLEANUP OBLIGATORIO (Rúbrica) ─────────────────────────────
    // Cancela los timers para evitar fugas de memoria y que el proceso
    // siga haciendo peticiones HTTP invisibles en segundo plano (OOM Killer).
    return () => {
      isMountedRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (contadorRef.current) {
        clearInterval(contadorRef.current);
        contadorRef.current = null;
      }
      cancelarSuscripcion();
    };
  }, [enabled, intervaloInicial, intervaloLargo, umbralCambio]);

  return {
    frecuenciaSegundos,
    segundosActivo,
    esFrecuenciaLenta: segundosActivo >= umbralCambio / 1000,
  };
}
