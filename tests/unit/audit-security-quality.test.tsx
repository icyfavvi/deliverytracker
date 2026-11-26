import React from "react";
import { Platform, Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { render, waitFor } from "@testing-library/react-native";

import { SESSION_TTL_MS } from "../../src/constants/config";
import {
  CLAVE_SESSION_EXPIRY,
  ProveedorAuth,
  useAuth,
} from "../../src/context/AuthContext";
import {
  AuthStorageAdapter,
  BLOQUEO_LOGIN_MS,
  CLAVE_SESION,
  CLAVE_USUARIOS,
  crearServicioAuth,
  MAX_INTENTOS_LOGIN,
  MENSAJE_BLOQUEO_LOGIN,
} from "../../src/services/authCore";
import { crearAlmacenAuthSeguro } from "../../src/services/authLocal";
import {
  dispararImpactoLigero,
  dispararNotificacionError,
  dispararNotificacionExito,
} from "../../src/utils/haptics";
import { escaparHTML, sanitizarInput } from "../../src/utils/sanitize";

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
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },
  randomUuid: () => globalThis.crypto.randomUUID(),
};

describe("Auditoría SQA: Seguridad ISO 27001/27002, Calidad y Hápticos", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
  });

  it("H3: bloquea tras 5 intentos fallidos por 15 minutos sin revelar existencia y resetea tras éxito", async () => {
    let reloj = 1_700_000_000_000;
    const auth = crearServicioAuth(crearMemoriaStorage(), cryptoStub, {
      permitirDemoAdmin: false,
      ahoraMs: () => reloj,
    });

    await auth.registrar("op.seguro", "ClaveFuerte2026");

    // Intentos 1..4 fallan con error genérico; el 5to activa el bloqueo
    for (let i = 1; i < MAX_INTENTOS_LOGIN; i++) {
      await expect(auth.iniciarSesion("op.seguro", "mala")).rejects.toThrow(
        "Usuario o contraseña incorrectos."
      );
    }
    await expect(auth.iniciarSesion("op.seguro", "mala")).rejects.toThrow(
      MENSAJE_BLOQUEO_LOGIN
    );

    // Incluso con la clave correcta permanece bloqueado dentro de los 15 minutos
    await expect(
      auth.iniciarSesion("op.seguro", "ClaveFuerte2026")
    ).rejects.toThrow(MENSAJE_BLOQUEO_LOGIN);

    // Usuario inexistente también recibe bloqueo sin filtrar si existe
    for (let i = 1; i < MAX_INTENTOS_LOGIN; i++) {
      await expect(auth.iniciarSesion("no.existe", "x")).rejects.toThrow(
        "Usuario o contraseña incorrectos."
      );
    }
    await expect(auth.iniciarSesion("no.existe", "x")).rejects.toThrow(
      MENSAJE_BLOQUEO_LOGIN
    );

    // Pasados los 15 minutos se desbloquea y el login exitoso limpia el contador
    reloj += BLOQUEO_LOGIN_MS + 1;
    const sesion = await auth.iniciarSesion("op.seguro", "ClaveFuerte2026");
    expect(sesion).toEqual({ usuario: "op.seguro", rol: "admin" });

    // 2 fallos seguidos no bloquean porque el contador se reseteó al entrar
    await expect(auth.iniciarSesion("op.seguro", "otra")).rejects.toThrow(
      "Usuario o contraseña incorrectos."
    );
  });

  it("H4: expira la sesión tras SESSION_TTL_MS (24h) en authCore y AuthContext", async () => {
    expect(SESSION_TTL_MS).toBe(86_400_000);

    let reloj = 1_700_000_000_000;
    const storage = crearMemoriaStorage();
    const auth = crearServicioAuth(storage, cryptoStub, {
      permitirDemoAdmin: false,
      ahoraMs: () => reloj,
    });

    await auth.registrar("jefe.ttl", "ClaveSegura2026");
    expect(await auth.leerSesion()).toEqual({
      usuario: "jefe.ttl",
      rol: "admin",
    });

    // Avanzar más allá de 24h -> leerSesion limpia almacenamiento y devuelve null
    reloj += SESSION_TTL_MS + 1;
    expect(await auth.leerSesion()).toBeNull();
    expect(await storage.getItem(CLAVE_SESION)).toBeNull();

    // AuthContext limpia sesión expirada de AsyncStorage al restaurar
    await AsyncStorage.setItem(
      CLAVE_SESSION_EXPIRY,
      String(Date.now() - 10_000)
    );
    function SondaAuth() {
      const { cargando, sesion } = useAuth();
      return (
        <Text testID="auth-state">
          {cargando ? "cargando" : sesion ? sesion.usuario : "sin-sesion"}
        </Text>
      );
    }
    const ui = await render(
      <ProveedorAuth>
        <SondaAuth />
      </ProveedorAuth>
    );
    await waitFor(() => {
      expect(ui.getByTestId("auth-state").props.children).toBe("sin-sesion");
    });
    expect(await AsyncStorage.getItem(CLAVE_SESSION_EXPIRY)).toBeNull();
  });

  it("H5: escaparHTML y sanitizarInput neutralizan etiquetas HTML y espacios", () => {
    expect(escaparHTML(`<script>alert("xss")</script> & 'ok'`)).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt; &amp; &#x27;ok&#x27;"
    );
    expect(sanitizarInput("  <b>Martina</b>  ")).toBe(
      "&lt;b&gt;Martina&lt;/b&gt;"
    );
  });

  it("H6: authLocal usa SecureStore en nativo (migrando legado) y AsyncStorage en Web", async () => {
    // 1. Migración transparente desde AsyncStorage hacia SecureStore en nativo
    await AsyncStorage.setItem(CLAVE_USUARIOS, '[{"usuario":"legacy"}]');
    const adaptadorNativo = crearAlmacenAuthSeguro();
    const valorMigrado = await adaptadorNativo.getItem(CLAVE_USUARIOS);
    expect(valorMigrado).toBe('[{"usuario":"legacy"}]');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      "deliverytracker_usuarios",
      '[{"usuario":"legacy"}]'
    );
    await adaptadorNativo.removeItem(CLAVE_USUARIOS);
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(
      "deliverytracker_usuarios"
    );

    // 2. Web fallback a AsyncStorage cuando Platform.OS === "web"
    const origOS = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
    try {
      const adaptadorWeb = crearAlmacenAuthSeguro();
      await adaptadorWeb.setItem(CLAVE_SESION, '{"usuario":"web"}');
      expect(await AsyncStorage.getItem(CLAVE_SESION)).toBe(
        '{"usuario":"web"}'
      );
      expect(await adaptadorWeb.getItem(CLAVE_SESION)).toBe(
        '{"usuario":"web"}'
      );
      await adaptadorWeb.removeItem(CLAVE_SESION);
      expect(await AsyncStorage.getItem(CLAVE_SESION)).toBeNull();
    } finally {
      Object.defineProperty(Platform, "OS", {
        value: origOS,
        configurable: true,
      });
    }
  });

  it("H7: feature flag EXPO_PUBLIC_SKIP_LATENCY omite demora artificial", async () => {
    const origEnv = process.env.EXPO_PUBLIC_SKIP_LATENCY;
    process.env.EXPO_PUBLIC_SKIP_LATENCY = "1";
    try {
      await jest.isolateModulesAsync(async () => {
        const api = require("../../src/services/pedidosApi") as typeof import("../../src/services/pedidosApi");
        const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");
        const res = await api.obtenerPedidos();
        expect(res.ok).toBe(true);
        expect(setTimeoutSpy).not.toHaveBeenCalled();
        setTimeoutSpy.mockRestore();
      });
    } finally {
      process.env.EXPO_PUBLIC_SKIP_LATENCY = origEnv;
    }
  });

  it("H9: dispara hápticos Light/Success/Error solo si reduced-motion está inactivo", async () => {
    await dispararImpactoLigero(false);
    await dispararNotificacionExito(false);
    await dispararNotificacionError(false);

    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Light
    );
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Success
    );
    expect(Haptics.notificationAsync).toHaveBeenCalledWith(
      Haptics.NotificationFeedbackType.Error
    );

    jest.clearAllMocks();
    await dispararImpactoLigero(true);
    await dispararNotificacionExito(true);
    await dispararNotificacionError(true);

    expect(Haptics.impactAsync).not.toHaveBeenCalled();
    expect(Haptics.notificationAsync).not.toHaveBeenCalled();
  });
});
