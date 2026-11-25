import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

import { CONFIG } from "../../src/constants/config";
import {
  calcularIntervaloPolling,
  esEstadoTerminal,
} from "../../src/hooks/pollingConfig";
import {
  ADMIN_DEMO,
  AuthStorageAdapter,
  CLAVE_SESION,
  CLAVE_USUARIOS,
  crearServicioAuth,
  ErrorAuth,
  MIN_CLAVE,
} from "../../src/services/authCore";
import * as authLocal from "../../src/services/authLocal";
import {
  buscarClientes,
  calcularAnaliticaOperacion,
  calcularTotalesChile,
  COSTO_ENVIO_CLP,
  crearClienteDirectorio,
  obtenerCatalogoConStock,
  obtenerStockPorSku,
  reponerStockSku,
  resetearCatalogoBase,
  restaurarStockAtomico,
  simularBajaExternaStock,
  suscribirStock,
} from "../../src/services/operacionesMock";
import {
  avanzarEstado,
  cancelarPedido,
  crearPedido,
  detectarDuplicadoReciente,
  obtenerPedidoPorCodigo,
  obtenerPedidos,
  suscribirACambios,
  vaciarPedidos,
} from "../../src/services/pedidosApi";

const subtleRef = globalThis.crypto.subtle;
const randomUuidRef = () => globalThis.crypto.randomUUID();

function crearMemoriaStorage(): AuthStorageAdapter {
  const mapa = new Map<string, string>();
  return {
    getItem: async (k) => mapa.get(k) ?? null,
    setItem: async (k, v) => {
      mapa.set(k, v);
    },
    removeItem: async (k) => {
      mapa.delete(k);
    },
  };
}

const cryptoStub = {
  sha256Hex: async (input: string) => {
    const digest = await subtleRef.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },
  randomUuid: randomUuidRef,
};

describe("SQA Servicios y Utilidades (pedidosApi, operacionesMock, auth, pollingConfig, config)", () => {
  beforeEach(async () => {
    await vaciarPedidos();
    await AsyncStorage.clear();
  });

  it("CONFIG expone propiedades seguras sin secretos embebidos", () => {
    expect(typeof CONFIG.env).toBe("string");
    expect(CONFIG.apiUrl).toContain("https://");
    expect(CONFIG.storeName).toContain("Atelier Noir");
    expect(typeof CONFIG.isProduction).toBe("boolean");
  });

  it("pollingConfig calcula backoff y estado terminal", () => {
    expect(esEstadoTerminal("entregado")).toBe(true);
    expect(esEstadoTerminal("recibido")).toBe(false);
    expect(esEstadoTerminal(null)).toBe(false);

    expect(calcularIntervaloPolling(10_000, 5_000, 30_000, 30_000)).toEqual({
      intervaloMs: 5_000,
      esFrecuenciaLenta: false,
    });
    expect(calcularIntervaloPolling(30_000, 5_000, 30_000, 30_000)).toEqual({
      intervaloMs: 30_000,
      esFrecuenciaLenta: true,
    });
  });

  it("pedidosApi maneja ciclo CRUD, errores 400/404/409, idempotencia, stock y duplicados", async () => {
    const listener = jest.fn();
    const unsub = suscribirACambios(listener);

    // 400 validation
    const resInvalido = await crearPedido("", "Dir", "Providencia", []);
    expect(resInvalido.ok).toBe(false);
    expect(resInvalido.status).toBe(400);
    expect(resInvalido.errorCode).toBe("VALIDATION");

    // 404 lookup & avanzar
    const res404 = await obtenerPedidoPorCodigo("ZZZZ");
    expect(res404.ok).toBe(false);
    expect(res404.status).toBe(404);
    const av404 = await avanzarEstado("ZZZZ");
    expect(av404.status).toBe(404);

    // Cliente crea pedido con hoodie (sin recargo admin oculto)
    const stockAntes = obtenerStockPorSku("AN-HDY-S")!;
    const resCli = await crearPedido(
      "Martina Soto",
      "Av. Providencia 1450",
      "Providencia",
      [
        {
          sku: "AN-HDY-S",
          nombre: "Noir Core Hoodie",
          cantidad: 1,
          precioUnitario: 54_990,
        },
      ],
      "Courier Express 24h",
      { idempotencyKey: "idem-cli-1", clienteId: "cli-01" }
    );
    expect(resCli.ok).toBe(true);
    expect(resCli.status).toBe(201);
    expect(resCli.data.totalEstimado).toBe(54_990);
    expect(obtenerStockPorSku("AN-HDY-S")).toBe(stockAntes - 1);
    expect(resCli.data.historialEstados).toEqual([
      { estado: "recibido", fecha: expect.any(String) },
    ]);

    // Doble clic idempotente rechazado con 409
    const resDup = await crearPedido(
      "Martina Soto",
      "Av. Providencia 1450",
      "Providencia",
      [
        {
          sku: "AN-HDY-S",
          nombre: "Noir Core Hoodie",
          cantidad: 1,
          precioUnitario: 54_990,
        },
      ],
      "Courier Express 24h",
      { idempotencyKey: "idem-cli-1" }
    );
    expect(resDup.status).toBe(409);
    expect(resDup.errorCode).toBe("IDEMPOTENCY_DUPLICATE");

    // Detecta duplicado reciente por clienteId y por nombre
    expect(
      detectarDuplicadoReciente("Martina Soto", 54_990, "cli-01")?.codigo
    ).toBe(resCli.data.codigo);
    expect(detectarDuplicadoReciente("martina soto", 54_990)?.codigo).toBe(
      resCli.data.codigo
    );
    expect(detectarDuplicadoReciente("Otro Cliente", 54_990)).toBeNull();

    // Admin crea orden con transportista, ventana horaria y envío
    const resAdm = await crearPedido(
      "Diego Araya",
      "",
      "",
      [
        {
          sku: "AN-TSH-S",
          nombre: "Signal Tee Cobalto",
          cantidad: 1,
          precioUnitario: 29_990,
        },
      ],
      "Estándar",
      {
        creadoPorAdmin: true,
        transportista: "Bluex",
        ventanaHoraria: "14:00 – 18:00 (PM)",
        notaInterna: "Entregar en conserjería",
        metodoPago: "Transferencia",
      }
    );
    expect(resAdm.status).toBe(201);
    expect(resAdm.data.totalEstimado).toBe(29_990 + COSTO_ENVIO_CLP);
    expect(resAdm.data.metodoEnvio).toContain("Bluex");

    // Atomicidad multi-item rollback si 2do ítem supera stock
    const stockCapAntes = obtenerStockPorSku("AN-CAP-U")!;
    const resRollback = await crearPedido("Pedro", "Dir", "Ñuñoa", [
      { sku: "AN-CAP-U", nombre: "Studio Cap", cantidad: 1, precioUnitario: 22_990 },
      {
        sku: "AN-JKT-XL",
        nombre: "Axis Utility Jacket",
        cantidad: 2,
        precioUnitario: 89_990,
      },
    ]);
    expect(resRollback.status).toBe(409);
    expect(resRollback.errorCode).toBe("INSUFFICIENT_STOCK");
    expect(obtenerStockPorSku("AN-CAP-U")).toBe(stockCapAntes);

    // Ciclo de estados completo + 409 en estado terminal
    const cod = resCli.data.codigo;
    expect((await obtenerPedidoPorCodigo(cod)).data?.estado).toBe("recibido");
    expect((await avanzarEstado(cod)).data?.estado).toBe("preparando");
    expect((await avanzarEstado(cod)).data?.estado).toBe("listo");
    expect((await avanzarEstado(cod)).data?.estado).toBe("entregado");
    expect((await avanzarEstado(cod)).status).toBe(409);

    // La bitácora acumula cada avance con su marca de tiempo
    const conHistorial = await obtenerPedidoPorCodigo(cod);
    expect(conHistorial.data?.historialEstados?.map((h) => h.estado)).toEqual([
      "recibido",
      "preparando",
      "listo",
      "entregado",
    ]);

    const todos = await obtenerPedidos();
    expect(todos.data.length).toBe(2);

    // Analítica con pedidos reales (con SKU y sin SKU)
    const analiticaConPedidos = calcularAnaliticaOperacion(
      todos.data,
      obtenerCatalogoConStock()
    );
    expect(analiticaConPedidos.total).toBe(2);
    expect(analiticaConPedidos.entregados).toBe(1);
    expect(analiticaConPedidos.activos).toBe(1);
    expect(analiticaConPedidos.porComuna.length).toBeGreaterThanOrEqual(2);

    reponerStockSku("AN-HDY-S", 1);
    reponerStockSku("AN-TSH-S", 1);
    unsub();
    expect(listener).toHaveBeenCalled();
  });

  it("operacionesMock cubre CRM, stock listeners, baja externa, totales y analítica vacía", () => {
    const stockCb = jest.fn();
    const unsubStock = suscribirStock(stockCb);

    const sku = "AN-HDY-M";
    const inicial = obtenerStockPorSku(sku)!;
    expect(obtenerStockPorSku("SKU-NO-EXISTE")).toBeNull();
    expect(reponerStockSku("SKU-NO-EXISTE", 5)).toBeNull();
    expect(simularBajaExternaStock("SKU-NO-EXISTE")).toBeNull();

    const trasBaja = simularBajaExternaStock(sku);
    expect(trasBaja).toBe(Math.max(0, inicial - 1));
    // Reponer superando stockInicial también actualiza cota máxima de referencia
    const trasRep = reponerStockSku(sku, 10);
    expect(trasRep).toBe((trasBaja ?? 0) + 10);
    expect(stockCb).toHaveBeenCalledTimes(2);
    unsubStock();

    expect(buscarClientes("").length).toBeGreaterThanOrEqual(5);
    expect(buscarClientes("ab").length).toBe(0);
    expect(buscarClientes("8421").length).toBe(1);
    const nuevoCli = crearClienteDirectorio({
      nombre: "  Sofía Núñez ",
      correo: "SOFIA@TEST.CL",
      telefono: "+56 9 1234 5678",
    });
    expect(nuevoCli.correo).toBe("sofia@test.cl");
    expect(buscarClientes("sofia@test.cl").length).toBe(1);

    expect(calcularTotalesChile(0)).toEqual({
      subtotal: 0,
      ivaIncluido: 0,
      envio: 0,
      total: 0,
    });
    expect(calcularTotalesChile(85_000).envio).toBe(0);
    expect(calcularTotalesChile(50_000).envio).toBe(COSTO_ENVIO_CLP);

    const catalogo = obtenerCatalogoConStock();
    const analiticaVacia = calcularAnaliticaOperacion([], catalogo);
    expect(analiticaVacia.total).toBe(0);
    expect(analiticaVacia.mixCategorias.length).toBeGreaterThan(0);
  });

  it("authCore y authLocal validan roles, migración v1, fallback sin WebCrypto y storage corrupto", async () => {
    // 1. AuthLocal con AsyncStorage + expo-crypto
    const origCryptoBeforeLocal = globalThis.crypto;
    // Asegura PBKDF2 limpio usando Uint8Array compatible o fallback sin subtle si subtle no acepta realm VM
    await authLocal.asegurarAdminInicial();
    const sesionDemo = await authLocal.iniciarSesion(
      ADMIN_DEMO.usuario,
      ADMIN_DEMO.clave
    );
    expect(sesionDemo).toEqual({ usuario: "admin", rol: "admin" });
    expect(await authLocal.leerSesion()).toEqual(sesionDemo);
    await authLocal.cerrarSesion();
    expect(await authLocal.leerSesion()).toBeNull();
    void origCryptoBeforeLocal;

    // 2. AuthCore en modo producción + errores de validación
    const storage = crearMemoriaStorage();
    const authProd = crearServicioAuth(storage, cryptoStub, {
      permitirDemoAdmin: false,
    });

    await expect(authProd.registrar("ab", "ClaveSegura1")).rejects.toThrow(
      ErrorAuth
    );
    await expect(
      authProd.registrar("usr*invalido", "ClaveSegura1")
    ).rejects.toThrow(ErrorAuth);
    await expect(
      authProd.registrar("operador1", "1234567".slice(0, MIN_CLAVE - 1))
    ).rejects.toThrow(ErrorAuth);

    const primero = await authProd.registrar("jefa.bodega", "ClaveSegura123");
    expect(primero.rol).toBe("admin");
    const segundo = await authProd.registrar("op.turno", "ClaveSegura123");
    expect(segundo.rol).toBe("operador");

    await expect(
      authProd.registrar("op.turno", "ClaveSegura123")
    ).rejects.toThrow("Ese usuario ya existe.");
    await expect(
      authProd.iniciarSesion("op.turno", "incorrecta")
    ).rejects.toThrow("Usuario o contraseña incorrectos.");

    // Migración de usuario legado v1 sin prefijo + sin rol explícito
    let legacyHash = "sal-legada:ClaveLegada123";
    for (let i = 0; i < 2000; i++) {
      legacyHash = await cryptoStub.sha256Hex(legacyHash + "sal-legada");
    }
    await storage.setItem(
      CLAVE_USUARIOS,
      JSON.stringify([
        { usuario: "admin", sal: "sal-v1", hash: "hash-legado-sin-prefijo" },
        { usuario: "operador.v1", sal: "sal-legada", hash: legacyHash },
      ])
    );
    const sesionV1 = await authProd.iniciarSesion(
      "operador.v1",
      "ClaveLegada123"
    );
    expect(sesionV1).toEqual({ usuario: "operador.v1", rol: "operador" });

    // En modo dev, asegurarAdminInicial migra automáticamente admin legado
    const authDevMig = crearServicioAuth(storage, cryptoStub, {
      permitirDemoAdmin: true,
    });
    await authDevMig.asegurarAdminInicial();
    const sesionAdminMig = await authDevMig.iniciarSesion(
      ADMIN_DEMO.usuario,
      ADMIN_DEMO.clave
    );
    expect(sesionAdminMig).toEqual({ usuario: "admin", rol: "admin" });

    // Sesión sin campo usuario o JSON corrupto
    await storage.setItem(CLAVE_SESION, JSON.stringify({ rol: "admin" }));
    expect(await authProd.leerSesion()).toBeNull();
    await storage.setItem(CLAVE_SESION, "{json-roto");
    expect(await authProd.leerSesion()).toBeNull();
    await storage.setItem(CLAVE_USUARIOS, "{json-roto");
    await expect(
      authProd.iniciarSesion("nadie", "ClaveSegura123")
    ).rejects.toThrow(ErrorAuth);

    // Fallback SHA-256 sin subtle (cubre authCore fallback y authLocal Crypto.digestStringAsync)
    const originalCrypto = globalThis.crypto;
    const digestSpy = jest
      .spyOn(Crypto, "digestStringAsync")
      .mockImplementation(async (_alg, data) => cryptoStub.sha256Hex(data));

    Object.defineProperty(globalThis, "crypto", {
      value: { randomUUID: () => "uuid-fallback-1" },
      configurable: true,
    });
    try {
      const storageFallback = crearMemoriaStorage();
      const authFallback = crearServicioAuth(storageFallback, cryptoStub, {
        permitirDemoAdmin: true,
      });
      await authFallback.asegurarAdminInicial();
      const sesionFb = await authFallback.iniciarSesion(
        ADMIN_DEMO.usuario,
        ADMIN_DEMO.clave
      );
      expect(sesionFb.rol).toBe("admin");

      const regUser = await authFallback.registrar("nuevo.op", "ClaveSegura99");
      expect(regUser.rol).toBe("operador");

      // Ejercita authLocal adaptador Crypto.digestStringAsync sin subtle
      await authLocal.registrar("fallback.expo", "ClaveSegura99");
      expect(digestSpy).toHaveBeenCalled();
    } finally {
      Object.defineProperty(globalThis, "crypto", {
        value: originalCrypto,
        configurable: true,
      });
      digestSpy.mockRestore();
    }
  });

  it("pedidosApi cubre persistencia en Web localStorage (sync multi-pestaña + recuperación JSON) y AsyncStorage nativo", async () => {
    const winRef = (globalThis as unknown as { window?: Record<string, unknown> })
      .window;
    const origLocalStorage = winRef?.localStorage;
    const origAddEvent = winRef?.addEventListener;

    const webStore = new Map<string, string>();
    const storageMock = {
      getItem: jest.fn((k: string) => webStore.get(k) ?? null),
      setItem: jest.fn((k: string, v: string) => {
        webStore.set(k, v);
      }),
      removeItem: jest.fn((k: string) => {
        webStore.delete(k);
      }),
    };
    const storageHandlers: ((e: { key: string }) => void)[] = [];

    Object.defineProperty(globalThis, "window", {
      value: {
        ...(winRef ?? {}),
        localStorage: storageMock,
        addEventListener: jest.fn((ev: string, cb: (e: { key: string }) => void) => {
          if (ev === "storage") storageHandlers.push(cb);
        }),
      },
      configurable: true,
    });

    try {
      // 1. Modo Web con JSON corrupto inicial en localStorage -> recupera y limpia
      webStore.set("deliverytracker_pedidos_v3", "{corrupto");
      await jest.isolateModulesAsync(async () => {
        const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
        const apiWeb = require("../../src/services/pedidosApi") as typeof import("../../src/services/pedidosApi");
        const res0 = await apiWeb.obtenerPedidos();
        expect(res0.data).toEqual([]);
        expect(storageMock.removeItem).toHaveBeenCalledWith(
          "deliverytracker_pedidos_v3"
        );

        const creada = await apiWeb.crearPedido(
          "Web Client",
          "Calle 1",
          "Providencia",
          [{ nombre: "Tee", cantidad: 1, precioUnitario: 10_000 }]
        );
        expect(creada.status).toBe(201);
        expect(storageMock.setItem).toHaveBeenCalled();

        // Evento storage desde otra pestaña (ignora otras claves y procesa clave propia)
        const listenerWeb = jest.fn();
        apiWeb.suscribirACambios(listenerWeb);
        storageHandlers.forEach((h) => h({ key: "otra_clave" }));
        expect(listenerWeb).not.toHaveBeenCalled();
        storageHandlers.forEach((h) => h({ key: "deliverytracker_pedidos_v3" }));
        expect(listenerWeb).toHaveBeenCalled();

        await apiWeb.vaciarPedidos();
        warnSpy.mockRestore();
      });
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: {
          ...(winRef ?? {}),
          localStorage: origLocalStorage,
          addEventListener: origAddEvent,
        },
        configurable: true,
      });
    }

    // 2. Modo Nativo (sin localStorage web ni process.versions.node -> AsyncStorage)
    const origVersions = process.versions;
    Object.defineProperty(process, "versions", {
      value: {},
      configurable: true,
    });
    try {
      await AsyncStorage.setItem(
        "deliverytracker_pedidos_v3",
        JSON.stringify({
          NAT1: {
            codigo: "NAT1",
            clienteNombre: "Nativo",
            direccionDespacho: "Dir",
            comuna: "Ñuñoa",
            items: [{ nombre: "Cap", cantidad: 1, precioUnitario: 20_000 }],
            estado: "recibido",
            creadoEn: new Date().toISOString(),
            actualizadoEn: new Date().toISOString(),
            metodoEnvio: "Courier",
            totalEstimado: 20_000,
          },
        })
      );

      await jest.isolateModulesAsync(async () => {
        const apiNat = require("../../src/services/pedidosApi") as typeof import("../../src/services/pedidosApi");
        const list = await apiNat.obtenerPedidos();
        expect(list.data.map((p) => p.codigo)).toContain("NAT1");
        await apiNat.crearPedido("Nativo 2", "Dir 2", "Providencia", [
          { nombre: "Cap", cantidad: 1, precioUnitario: 20_000 },
        ]);
        await apiNat.vaciarPedidos();
      });
    } finally {
      Object.defineProperty(process, "versions", {
        value: origVersions,
        configurable: true,
      });
    }
  });

  it("cancelarPedido revierte stock, sella la bitácora y rechaza órdenes no cancelables", async () => {
    // 404 para códigos inexistentes
    const res404 = await cancelarPedido("ZZZZ");
    expect(res404.status).toBe(404);
    expect(res404.ok).toBe(false);
    expect(res404.data).toBeNull();

    // Éxito en 'recibido' con reversión de stock
    const stockAntes = obtenerStockPorSku("AN-CRG-32") ?? 0;
    const creada = await crearPedido(
      "Camila Ríos",
      "Irarrázaval 2820",
      "Ñuñoa",
      [
        {
          sku: "AN-CRG-32",
          nombre: "Cargo 02 — Ash",
          talla: "32",
          cantidad: 2,
          precioUnitario: 64_990,
        },
      ],
      "Courier Express 24h"
    );
    expect(creada.status).toBe(201);
    expect(obtenerStockPorSku("AN-CRG-32")).toBe(stockAntes - 2);

    const cancelada = await cancelarPedido(
      creada.data.codigo,
      "Cancelado por cliente"
    );
    expect(cancelada.status).toBe(200);
    expect(cancelada.ok).toBe(true);
    expect(cancelada.data?.cancelado).toBe(true);
    expect(cancelada.data?.canceladoEn).toEqual(expect.any(String));
    expect(cancelada.data?.actualizadoEn).toEqual(expect.any(String));
    expect(cancelada.data?.motivoCancelacion).toBe("Cancelado por cliente");
    expect(cancelada.data?.historialEstados?.map((h) => h.estado)).toEqual([
      "recibido",
      "cancelado",
    ]);
    expect(obtenerStockPorSku("AN-CRG-32")).toBe(stockAntes);

    // 409 al reintentar la cancelación de la misma orden
    const repetida = await cancelarPedido(creada.data.codigo);
    expect(repetida.status).toBe(409);
    expect(repetida.data?.cancelado).toBe(true);

    // 409 al avanzar una orden cancelada (terminal)
    const avance = await avanzarEstado(creada.data.codigo);
    expect(avance.status).toBe(409);

    // 409 al cancelar una orden que ya avanzó de estado
    const segunda = await crearPedido(
      "Diego Araya",
      "Av. Apoquindo 4700",
      "Las Condes",
      [
        {
          sku: "AN-BMB-L",
          nombre: "Bomber Nylon Tech",
          talla: "L",
          cantidad: 1,
          precioUnitario: 79_990,
        },
      ]
    );
    await avanzarEstado(segunda.data.codigo);
    const rechazada = await cancelarPedido(segunda.data.codigo);
    expect(rechazada.status).toBe(409);
    expect(rechazada.data?.cancelado).toBeUndefined();

    // La analítica operativa ignora las órdenes canceladas
    const avanzado = await obtenerPedidoPorCodigo(segunda.data.codigo);
    const pedidosOperativos = [cancelada.data, avanzado.data].filter(
      (p): p is NonNullable<typeof p> => p !== null
    );
    const analitica = calcularAnaliticaOperacion(
      pedidosOperativos,
      obtenerCatalogoConStock()
    );
    expect(analitica.total).toBe(1);
    expect(analitica.ventasNetas).toBe(segunda.data.totalEstimado);
    expect(analitica.porEstado.recibido).toBe(0);
    expect(analitica.porEstado.preparando).toBe(1);

    // Motivo por defecto cuando el cliente no informa uno
    const tercera = await crearPedido(
      "Martina Soto",
      "Av. Providencia 1450",
      "Providencia",
      [
        {
          sku: "AN-TSH-L",
          nombre: "Signal Tee Cobalto",
          talla: "L",
          cantidad: 1,
          precioUnitario: 29_990,
        },
      ]
    );
    const cancelDefecto = await cancelarPedido(tercera.data.codigo, "   ");
    expect(cancelDefecto.status).toBe(200);
    expect(cancelDefecto.data?.motivoCancelacion).toBe("Cancelado por cliente");
  });

  it("restaurarStockAtomico repone dentro del tope físico y resetearCatalogoBase restaura el catálogo", () => {
    const stockBase = obtenerStockPorSku("AN-CAP-U") ?? 0;

    // Ítems sin SKU, con cantidad inválida o SKU inexistente no tocan stock
    restaurarStockAtomico([{ nombre: "Sin SKU", cantidad: 3 }]);
    restaurarStockAtomico([
      { sku: "AN-CAP-U", nombre: "Studio Cap", cantidad: 0 },
    ]);
    restaurarStockAtomico([
      { sku: "SKU-inexistente", nombre: "X", cantidad: 2 },
    ]);
    expect(obtenerStockPorSku("AN-CAP-U")).toBe(stockBase);

    // La reposición nunca supera el stockInicial de la variante (12 u.)
    restaurarStockAtomico([
      { sku: "AN-CAP-U", nombre: "Studio Cap", cantidad: 99 },
    ]);
    expect(obtenerStockPorSku("AN-CAP-U")).toBe(12);

    resetearCatalogoBase();
    expect(obtenerStockPorSku("AN-CAP-U")).toBe(stockBase);
  });

  it("operacionesMock persiste el inventario de SKUs en Web (sync multi-pestaña) y lo hidrata en nativo", async () => {
    const winRef = (globalThis as unknown as { window?: Record<string, unknown> })
      .window;
    const origLocalStorage = winRef?.localStorage;
    const origAddEvent = winRef?.addEventListener;
    const webStore = new Map<string, string>();
    const storageMock = {
      getItem: jest.fn((k: string) => webStore.get(k) ?? null),
      setItem: jest.fn((k: string, v: string) => {
        webStore.set(k, v);
      }),
      removeItem: jest.fn((k: string) => {
        webStore.delete(k);
      }),
    };
    const storageHandlers: ((
      e: { key: string; newValue: string | null }
    ) => void)[] = [];

    // Snapshot dejado por "otra pestaña": AN-HDY-M quedó en 5 unidades.
    webStore.set(
      "deliverytracker_stock_v1",
      JSON.stringify({ "AN-HDY-M": { stock: 5, stockInicial: 10 } })
    );

    Object.defineProperty(globalThis, "window", {
      value: {
        ...(winRef ?? {}),
        localStorage: storageMock,
        addEventListener: jest.fn(
          (
            ev: string,
            cb: (e: { key: string; newValue: string | null }) => void
          ) => {
            if (ev === "storage") storageHandlers.push(cb);
          }
        ),
      },
      configurable: true,
    });

    try {
      await jest.isolateModulesAsync(async () => {
        const ops = require("../../src/services/operacionesMock") as typeof import("../../src/services/operacionesMock");

        // Hidratación síncrona desde localStorage
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(5);

        // Toda mutación persiste el inventario
        ops.reponerStockSku("AN-HDY-M", 2);
        expect(storageMock.setItem).toHaveBeenCalledWith(
          "deliverytracker_stock_v1",
          expect.any(String)
        );
        const snapshotWeb = JSON.parse(
          webStore.get("deliverytracker_stock_v1") ?? "{}"
        );
        expect(snapshotWeb["AN-HDY-M"].stock).toBe(7);

        // Evento `storage`: sincroniza el stock de otra pestaña
        const listener = jest.fn();
        ops.suscribirStock(listener);
        storageHandlers.forEach((h) => h({ key: "otra_clave", newValue: null }));
        expect(listener).not.toHaveBeenCalled();
        storageHandlers.forEach((h) =>
          h({
            key: "deliverytracker_stock_v1",
            newValue: JSON.stringify({
              "AN-HDY-M": { stock: 1, stockInicial: 10 },
            }),
          })
        );
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(1);
        expect(listener).toHaveBeenCalled();

        // Evento con payload corrupto: el stock local no se rompe
        storageHandlers.forEach((h) =>
          h({ key: "deliverytracker_stock_v1", newValue: "{roto" })
        );
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(1);

        // Snapshot con stock inválido se descarta sin romper el catálogo
        storageHandlers.forEach((h) =>
          h({
            key: "deliverytracker_stock_v1",
            newValue: JSON.stringify({
              "AN-HDY-M": { stock: "cinco", stockInicial: 10 },
            }),
          })
        );
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(1);

        // Hidratación explícita (misma ruta de lectura Web)
        await ops.asegurarStockHidratado();
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(7);

        // Reset: borra el inventario persistido y restaura el catálogo base
        ops.resetearCatalogoBase();
        expect(storageMock.removeItem).toHaveBeenCalledWith(
          "deliverytracker_stock_v1"
        );
        expect(ops.obtenerStockPorSku("AN-HDY-M")).toBe(4);
      });
    } finally {
      Object.defineProperty(globalThis, "window", {
        value: {
          ...(winRef ?? {}),
          localStorage: origLocalStorage,
          addEventListener: origAddEvent,
        },
        configurable: true,
      });
    }

    // ── Modo nativo (AsyncStorage, sin localStorage ni Node) ─────
    const origVersions = process.versions;
    Object.defineProperty(process, "versions", {
      value: {},
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      value: { localStorage: undefined },
      configurable: true,
    });
    try {
      await AsyncStorage.setItem(
        "deliverytracker_stock_v1",
        JSON.stringify({ "AN-HDY-S": { stock: 2, stockInicial: 10 } })
      );

      await jest.isolateModulesAsync(async () => {
        const ops = require("../../src/services/operacionesMock") as typeof import("../../src/services/operacionesMock");
        await ops.asegurarStockHidratado();
        expect(ops.obtenerStockPorSku("AN-HDY-S")).toBe(2);

        // La reposición persiste en AsyncStorage
        ops.reponerStockSku("AN-HDY-S", 3);
        const snapshotNat = await AsyncStorage.getItem(
          "deliverytracker_stock_v1"
        );
        expect(snapshotNat).toContain("AN-HDY-S");
        expect(JSON.parse(snapshotNat ?? "{}")["AN-HDY-S"].stock).toBe(5);

        // Reset nativo: borra la clave persistida y restaura el catálogo
        ops.resetearCatalogoBase();
        expect(ops.obtenerStockPorSku("AN-HDY-S")).toBe(7);
      });

      await AsyncStorage.clear();
    } finally {
      Object.defineProperty(process, "versions", {
        value: origVersions,
        configurable: true,
      });
      Object.defineProperty(globalThis, "window", {
        value: {
          ...(winRef ?? {}),
          localStorage: origLocalStorage,
          addEventListener: origAddEvent,
        },
        configurable: true,
      });
    }
  });
});
