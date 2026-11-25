import { AccessibilityInfo, AppState, AppStateStatus } from "react-native";
import { act, renderHook } from "@testing-library/react-native";

import { usePedidoPolling } from "../../src/hooks/usePedidoPolling";
import { useReducirMovimiento } from "../../src/hooks/useReducirMovimiento";
import * as pedidosApi from "../../src/services/pedidosApi";

describe("usePedidoPolling (fake timers, AppState y cleanup)", () => {
  let appStateListeners: ((estado: AppStateStatus) => void)[] = [];
  let removeMock: jest.Mock;
  let spyAppState: jest.SpyInstance;

  beforeEach(() => {
    jest.useFakeTimers();
    appStateListeners = [];
    removeMock = jest.fn();
    Object.defineProperty(AppState, "currentState", {
      value: "active",
      configurable: true,
    });
    spyAppState = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, handler) => {
        appStateListeners.push(handler as (estado: AppStateStatus) => void);
        return { remove: removeMock } as unknown as ReturnType<
          typeof AppState.addEventListener
        >;
      });
  });

  afterEach(() => {
    spyAppState.mockRestore();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("ejecuta consulta inicial, mantiene intervalo de 5s y cambia a 30s tras el umbral", async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined);

    const { result, unmount } = await renderHook(() =>
      usePedidoPolling({
        fetchFn,
        enabled: true,
        resetKey: "ABCD",
        intervaloInicial: 5_000,
        intervaloLargo: 30_000,
        umbralCambio: 30_000,
      })
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(result.current.frecuenciaSegundos).toBe(5);
    expect(result.current.esFrecuenciaLenta).toBe(false);
    expect(result.current.enSegundoPlano).toBe(false);

    // Tick a los 5s (sigue en frecuencia rápida)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.current.frecuenciaSegundos).toBe(5);
    expect(result.current.esFrecuenciaLenta).toBe(false);

    // Avanzar pasando el umbral de 30s -> siguiente tick pasa a modo ahorro (30s)
    await act(async () => {
      await jest.advanceTimersByTimeAsync(25_000);
    });
    expect(result.current.esFrecuenciaLenta).toBe(true);
    expect(result.current.frecuenciaSegundos).toBe(30);

    const conteoEnCambio = fetchFn.mock.calls.length;
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10_000);
    });
    // Con intervalo de 30s, en 10s no debe disparar otro tick
    expect(fetchFn).toHaveBeenCalledTimes(conteoEnCambio);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(20_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(conteoEnCambio + 1);

    await unmount();
    expect(removeMock).toHaveBeenCalledTimes(1);
  });

  it("pausa el polling al pasar a segundo plano (AppState) y lo reanuda al volver", async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined);

    const { result, unmount } = await renderHook(() =>
      usePedidoPolling({
        fetchFn,
        enabled: true,
        resetKey: "WXYZ",
      })
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // App pasa a background
    await act(async () => {
      appStateListeners.forEach((cb) => cb("background"));
    });

    expect(result.current.enSegundoPlano).toBe(true);

    // Aunque pasen 60 segundos en segundo plano, no hace peticiones
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // App vuelve a active -> reanuda con consulta inmediata
    await act(async () => {
      appStateListeners.forEach((cb) => cb("active"));
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(result.current.enSegundoPlano).toBe(false);

    await unmount();
  });

  it("detiene el temporizador al deshabilitarse o desmontarse y limpia suscripciones", async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined);
    const desuscribirMock = jest.fn();
    let eventoCambioCallback: (() => void) | null = null;

    const spySub = jest
      .spyOn(pedidosApi, "suscribirACambios")
      .mockImplementation((cb) => {
        eventoCambioCallback = cb;
        return desuscribirMock;
      });

    const { rerender, unmount } = await renderHook(
      ({ enabled }: { enabled: boolean }) =>
        usePedidoPolling({
          fetchFn,
          enabled,
          escucharEventos: true,
        }),
      { initialProps: { enabled: true } }
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Dispara listener local de cambios mientras está activo
    await act(async () => {
      eventoCambioCallback?.();
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Simula pasar a estado terminal (enabled = false)
    await rerender({ enabled: false });
    expect(desuscribirMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);

    await unmount();
    expect(removeMock).toHaveBeenCalledTimes(1);
    spySub.mockRestore();
  });

  it("maneja errores transitorios en fetchFn sin detener futuros ticks", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Fallo de red"))
      .mockResolvedValueOnce(undefined);

    const { unmount } = await renderHook(() =>
      usePedidoPolling({
        fetchFn,
        enabled: true,
        escucharEventos: false,
      })
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // 1er tick falla
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalled();

    // 2do tick sigue ejecutándose normalmente
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(3);

    await unmount();
    warnSpy.mockRestore();
  });

  it("usa valores por defecto y reinicia ventana rápida al cambiar resetKey", async () => {
    const fetchFn = jest.fn().mockResolvedValue(undefined);
    let eventoCambioCallback: (() => void) | null = null;
    const spySub = jest
      .spyOn(pedidosApi, "suscribirACambios")
      .mockImplementation((cb) => {
        eventoCambioCallback = cb;
        return jest.fn();
      });

    const { result, rerender, unmount } = await renderHook(
      ({ resetKey, enabled }: { resetKey: string; enabled: boolean }) =>
        usePedidoPolling({
          fetchFn,
          enabled,
          resetKey,
        }),
      { initialProps: { resetKey: "ORD1", enabled: false } }
    );

    expect(fetchFn).not.toHaveBeenCalled();

    // Activar con valores por defecto
    await rerender({ resetKey: "ORD1", enabled: true });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Superar umbral de 30s
    await act(async () => {
      await jest.advanceTimersByTimeAsync(35_000);
    });
    expect(result.current.esFrecuenciaLenta).toBe(true);

    // Cambiar resetKey reinicia ventana de polling rápido a 5s
    await rerender({ resetKey: "ORD2", enabled: true });
    expect(result.current.esFrecuenciaLenta).toBe(false);
    expect(result.current.frecuenciaSegundos).toBe(5);

    // Si desmonta con enabled=true, cancela listener de cambios
    await act(async () => {
      eventoCambioCallback?.();
    });

    await unmount();
    spySub.mockRestore();
  });

  it("cancela actualización de ticks si se desmonta mientras fetchFn está en vuelo", async () => {
    let resolverFetch!: () => void;
    const fetchFn = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          resolverFetch = resolve;
        })
    );

    const { unmount } = await renderHook(() =>
      usePedidoPolling({
        fetchFn,
        enabled: true,
        escucharEventos: false,
      })
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);
    await unmount();

    // Resolver fetch luego de desmontar no debe programar timers huérfanos
    await act(async () => {
      resolverFetch();
      await Promise.resolve();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(15_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("no reprograma nuevo tick si se desmonta durante un tick programado en vuelo", async () => {
    let resolverTick!: () => void;
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce(undefined)
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            resolverTick = resolve;
          })
      );

    const { unmount } = await renderHook(() =>
      usePedidoPolling({
        fetchFn,
        enabled: true,
        escucharEventos: false,
      })
    );

    expect(fetchFn).toHaveBeenCalledTimes(1);

    // Disparar el tick de 5s que queda en vuelo
    await act(async () => {
      await jest.advanceTimersByTimeAsync(5_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);

    // Desmontar antes de que resuelva el tick en vuelo
    await unmount();
    await act(async () => {
      resolverTick();
      await Promise.resolve();
    });

    await act(async () => {
      await jest.advanceTimersByTimeAsync(15_000);
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("inicia en pausa si AppState arranca en background", async () => {
    Object.defineProperty(AppState, "currentState", {
      value: "background",
      configurable: true,
    });
    const fetchFn = jest.fn().mockResolvedValue(undefined);
    const { result, unmount } = await renderHook(() =>
      usePedidoPolling({ fetchFn, enabled: true })
    );

    expect(result.current.enSegundoPlano).toBe(true);
    expect(fetchFn).not.toHaveBeenCalled();
    await unmount();
  });
});

describe("useReducirMovimiento", () => {
  it("lee la preferencia inicial y escucha cambios hasta desmontarse", async () => {
    const removeSpy = jest.fn();
    let listener: ((val: boolean) => void) | null = null;

    const spyEnabled = jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockResolvedValue(true);
    const spyListener = jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockImplementation((_ev, cb) => {
        listener = cb as (val: boolean) => void;
        return { remove: removeSpy } as unknown as ReturnType<
          typeof AccessibilityInfo.addEventListener
        >;
      });

    const { result, unmount } = await renderHook(() => useReducirMovimiento());

    expect(result.current).toBe(true);

    await act(async () => {
      listener?.(false);
    });
    expect(result.current).toBe(false);

    await unmount();
    expect(removeSpy).toHaveBeenCalledTimes(1);

    spyEnabled.mockRestore();
    spyListener.mockRestore();
  });

  it("asume movimiento normal si falla isReduceMotionEnabled o desmonta antes de resolver", async () => {
    const removeSpy = jest.fn();
    let resolverPendiente!: (v: boolean) => void;
    const spyEnabled = jest
      .spyOn(AccessibilityInfo, "isReduceMotionEnabled")
      .mockRejectedValueOnce(new Error("No soportado"))
      .mockImplementationOnce(
        () =>
          new Promise<boolean>((resolve) => {
            resolverPendiente = resolve;
          })
      );
    const spyListener = jest
      .spyOn(AccessibilityInfo, "addEventListener")
      .mockReturnValue({ remove: removeSpy } as unknown as ReturnType<
        typeof AccessibilityInfo.addEventListener
      >);

    const { result, unmount } = await renderHook(() => useReducirMovimiento());
    expect(result.current).toBe(false);
    await unmount();

    const hookPendiente = await renderHook(() => useReducirMovimiento());
    await hookPendiente.unmount();
    await act(async () => {
      resolverPendiente(true);
      await Promise.resolve();
    });
    expect(hookPendiente.result.current).toBe(false);

    spyEnabled.mockRestore();
    spyListener.mockRestore();
  });
});
