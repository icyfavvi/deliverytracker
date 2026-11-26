// ─── Pantalla de Login Atelier Noir ──────────────────────────────

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { PanelMarca } from "../components/login/PanelMarca";
import { TarjetaLogin } from "../components/login/TarjetaLogin";
import { useAuth } from "../context/AuthContext";
import { useReducirMovimiento } from "../hooks/useReducirMovimiento";
import { ADMIN_DEMO } from "../services/authLocal";
import { useTema } from "../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS } from "../theme/tokens";
import {
  dispararNotificacionError,
  dispararNotificacionExito,
} from "../utils/haptics";

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores } = useTema();
  const reducirMovimiento = useReducirMovimiento();
  const { entrar, registrarse } = useAuth();

  const [modoRegistro, setModoRegistro] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [recordarme, setRecordarme] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (enviando) return;
    setError(null);
    if (!usuario.trim() || !clave) {
      void dispararNotificacionError(reducirMovimiento);
      setError("Completa usuario y contraseña.");
      return;
    }
    if (modoRegistro && clave !== confirmar) {
      void dispararNotificacionError(reducirMovimiento);
      setError("Las contraseñas no coinciden.");
      return;
    }
    setEnviando(true);
    try {
      await (modoRegistro
        ? registrarse(usuario, clave)
        : entrar(usuario, clave));
      void dispararNotificacionExito(reducirMovimiento);
    } catch (e) {
      void dispararNotificacionError(reducirMovimiento);
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación."
      );
    } finally {
      setEnviando(false);
    }
  };

  const explorarComoAdmin = async () => {
    if (enviando) return;
    setModoRegistro(false);
    setUsuario(ADMIN_DEMO.usuario);
    setClave(ADMIN_DEMO.clave);
    setError(null);
    setEnviando(true);
    try {
      await entrar(ADMIN_DEMO.usuario, ADMIN_DEMO.clave);
      void dispararNotificacionExito(reducirMovimiento);
    } catch (e) {
      void dispararNotificacionError(reducirMovimiento);
      setError(
        e instanceof Error ? e.message : "No se pudo iniciar sesión admin."
      );
    } finally {
      setEnviando(false);
    }
  };

  const explorarComoCliente = () => {
    router.push("/cliente");
  };

  const cambiarModo = () => {
    setModoRegistro((m) => !m);
    setError(null);
    setClave("");
    setConfirmar("");
  };

  return (
    <SafeAreaView
      style={[styles.pantalla, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, esAncho && styles.scrollAncho]}
        >
          <View style={[styles.contenedor, esAncho && styles.contenedorAncho]}>
            <PanelMarca esAncho={esAncho} />
            <TarjetaLogin
              esAncho={esAncho}
              modoRegistro={modoRegistro}
              usuario={usuario}
              clave={clave}
              confirmar={confirmar}
              recordarme={recordarme}
              error={error}
              enviando={enviando}
              onCambiarUsuario={setUsuario}
              onCambiarClave={setClave}
              onCambiarConfirmar={setConfirmar}
              onToggleRecordarme={() => setRecordarme((r) => !r)}
              onCambiarModo={cambiarModo}
              onEnviar={enviar}
              onExplorarCliente={explorarComoCliente}
              onExplorarAdmin={explorarComoAdmin}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1 },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: ESPACIOS.lg,
    paddingBottom: ESPACIOS.xxl,
  },
  scrollAncho: {
    justifyContent: "center",
    padding: ESPACIOS.xl,
  },
  contenedor: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    gap: ESPACIOS.lg,
  },
  contenedorAncho: {
    maxWidth: 1080,
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.xl,
  },
});
