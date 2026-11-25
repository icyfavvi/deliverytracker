// ─── Hook: usePedidoPolling ─────────────────────────────────────────
//
// 1. Backoff adaptativo (5s primeros 30s -> 30s) con cálculo compartido.
// 2. Se pausa automáticamente al pasar la app a segundo plano (`AppState`).
// 3. Sin `setInterval` de 1s innecesario: solo actualiza UI cuando cambia la fase.
// 4. Reinicia su ciclo cuando cambia `resetKey` (ej. nuevo código buscado)
//    y limpia timers + suscripciones en el return del `useEffect`.

import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

import { suscribirACambios } from "../services/pedidosApi";
import { calcularIntervaloPolling } from "./pollingConfig";

interface PollingOptions {
  /** Función asíncrona que consulta los datos */
  fetchFn: () => Promise<void>;
  /** Activa o desactiva el polling */
  enabled: boolean;
  /** Reinicia ventana de polling rápido al cambiar (ej. código buscado) */
  resetKey?: string | null;
  /** Si debe reconsultar al emitir cambios locales (true para vistas de ítem único) */
  escucharEventos?: boolean;
  /** Intervalo rápido inicial en ms (default: 5.000 ms = 5s) */
  intervaloInicial?: number;
  /** Intervalo largo posterior en ms (default: 30.000 ms = 30s) */
  intervaloLargo?: number;
  /** Umbral de tiempo para pasar al intervalo largo (default: 30.000 ms = 30s) */
  umbralCambio?: number;
}

export interface PollingStatus {
  frecuenciaSegundos: number;
  esFrecuenciaLenta: boolean;
  enSegundoPlano: boolean;
}

export function usePedidoPolling({
  fetchFn,
  enabled,
  resetKey = null,
  escucharEventos = true,
  intervaloInicial = 5_000,
  intervaloLargo = 30_000,
  umbralCambio = 30_000,
}: PollingOptions): PollingStatus {
  const [frecuenciaSegundos, setFrecuenciaSegundos] = useState<number>(
    intervaloInicial / 1000
  );
  const [esFrecuenciaLenta, setEsFrecuenciaLenta] = useState(false);
  const [appActiva, setAppActiva] = useState<boolean>(
    AppState.currentState === "active"
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inicioRef = useRef<number>(0);
  const fetchEstable = useRef(fetchFn);

  useEffect(() => {
    fetchEstable.current = fetchFn;
  }, [fetchFn]);

  useEffect(() => {
    const manejarEstado = (estado: AppStateStatus) => {
      setAppActiva(estado === "active");
    };
    const sub = AppState.addEventListener("change", manejarEstado);
    return () => {
      sub.remove();
    };
  }, []);

  const activo = enabled && appActiva;

  useEffect(() => {
    if (!activo) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    let vigente = true;
    inicioRef.current = Date.now();

    function programarSiguienteTick() {
      if (!vigente) return;

      const { intervaloMs, esFrecuenciaLenta: lenta } = calcularIntervaloPolling(
        Date.now() - inicioRef.current,
        intervaloInicial,
        intervaloLargo,
        umbralCambio
      );

      setFrecuenciaSegundos(intervaloMs / 1000);
      setEsFrecuenciaLenta(lenta);

      timerRef.current = setTimeout(async () => {
        if (!vigente) return;
        try {
          await fetchEstable.current();
        } catch (e) {
          console.warn("Fallo en tick de polling:", e);
        }
        if (vigente) {
          programarSiguienteTick();
        }
      }, intervaloMs);
    }

    fetchEstable.current().finally(() => {
      if (vigente) {
        programarSiguienteTick();
      }
    });

    const cancelarSuscripcion = escucharEventos
      ? suscribirACambios(() => {
          if (vigente) {
            void fetchEstable.current();
          }
        })
      : undefined;

    return () => {
      vigente = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      cancelarSuscripcion?.();
    };
  }, [
    activo,
    resetKey,
    escucharEventos,
    intervaloInicial,
    intervaloLargo,
    umbralCambio,
  ]);

  return {
    frecuenciaSegundos,
    esFrecuenciaLenta,
    enSegundoPlano: !appActiva,
  };
}
