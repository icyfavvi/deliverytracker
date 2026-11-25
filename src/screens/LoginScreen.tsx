// ─── Pantalla de acceso (Bodega) ─────────────────────────────────
//
// Referencia visual Atelier Noir: panel oscuro de marca (.login-panel)
// con acento cobalto + tarjeta de formulario (.login-card), manteniendo
// 100% intacta la lógica de AuthContext, authLocal y accesibilidad AA.

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Boton } from "../components/Boton";
import { CampoTexto } from "../components/CampoTexto";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { useAuth } from "../context/AuthContext";
import { MIN_CLAVE } from "../services/authLocal";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo } = useTema();
  const { entrar, registrarse } = useAuth();
  const [modoRegistro, setModoRegistro] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [clave, setClave] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async () => {
    if (enviando) return;
    setError(null);
    if (!usuario.trim() || !clave) {
      return setError("Completa usuario y contraseña.");
    }
    if (modoRegistro && clave !== confirmar) {
      return setError("Las contraseñas no coinciden.");
    }
    setEnviando(true);
    try {
      await (modoRegistro ? registrarse(usuario, clave) : entrar(usuario, clave));
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo completar la operación."
      );
    } finally {
      setEnviando(false);
    }
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
          contentContainerStyle={[
            styles.scroll,
            esAncho && styles.scrollAncho,
          ]}
        >
          <View style={[styles.contenedor, esAncho && styles.contenedorAncho]}>
            {/* ─── Panel oscuro de marca (.login-panel) ────────────── */}
            <View
              style={[
                styles.panelMarca,
                esAncho && styles.panelMarcaAncho,
                {
                  backgroundColor: colores.panelOscuro,
                  borderColor: colores.panelOscuroBorde,
                  borderRadius: RADIOS.lg,
                },
                sombraTarjeta(modo),
              ]}
            >
              <View pointerEvents="none" style={styles.aroMarca} />

              <View style={styles.marcaTop}>
                <View style={styles.brandLockup}>
                  <View style={styles.brandBadge}>
                    <Icon name="warehouse" size={16} color="#ffffff" />
                  </View>
                  <Text style={[tipografia.micro, styles.brandNombre]}>
                    ATELIER NOIR
                  </Text>
                </View>

                {!esAncho ? <InterruptorTema /> : null}
              </View>

              <View style={styles.marcaCentro}>
                <View style={styles.rolPill}>
                  <View style={styles.rolPunto} />
                  <Text style={[tipografia.micro, styles.rolTexto]}>
                    BODEGA · ACCESO PRIVADO
                  </Text>
                </View>
                <Text style={[tipografia.display, styles.marcaTitulo]}>
                  Control de despacho en tiempo real
                </Text>
                <Text style={[tipografia.cuerpo, styles.marcaBajada]}>
                  Registra órdenes de vestuario y actualiza cada etapa desde el
                  almacén hasta la entrega.
                </Text>
              </View>

              <Text style={[tipografia.caption, styles.marcaPie]}>
                El rastreo para clientes sigue disponible sin inicio de sesión.
              </Text>
            </View>

            {/* ─── Tarjeta de acceso (.login-card) ─────────────────── */}
            <View
              style={[
                styles.tarjetaLogin,
                esAncho && styles.tarjetaLoginAncho,
                {
                  backgroundColor: colores.superficie,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.lg,
                },
                sombraTarjeta(modo),
              ]}
            >
              <View style={styles.tarjetaHeader}>
                <View style={styles.tarjetaTitulos}>
                  <Text
                    style={[
                      tipografia.eyebrowMono,
                      { color: colores.acentoIntenso },
                    ]}
                  >
                    {modoRegistro ? "ALTA DE OPERADOR" : "SESIÓN DE PERSONAL"}
                  </Text>
                  <Text
                    accessibilityRole="header"
                    style={[tipografia.titulo, { color: colores.tinta }]}
                  >
                    {modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
                  </Text>
                </View>
                {esAncho ? <InterruptorTema /> : null}
              </View>

              <Text
                style={[
                  tipografia.cuerpo,
                  styles.tarjetaSub,
                  { color: colores.tintaSecundaria },
                ]}
              >
                {modoRegistro
                  ? "Configura tus credenciales locales para operar el panel de bodega."
                  : "Ingresa con tu usuario de bodega para gestionar pedidos."}
              </Text>

              <View style={styles.formulario}>
                <CampoTexto
                  etiqueta="Usuario"
                  valor={usuario}
                  onCambio={setUsuario}
                  placeholder="operador.bodega"
                  icono="user"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
                <CampoTexto
                  etiqueta="Contraseña"
                  valor={clave}
                  onCambio={setClave}
                  placeholder="••••••••"
                  icono="lock"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  ayuda={
                    modoRegistro ? `Mínimo ${MIN_CLAVE} caracteres.` : undefined
                  }
                  returnKeyType={modoRegistro ? "next" : "go"}
                  onSubmit={modoRegistro ? undefined : enviar}
                />
                {modoRegistro ? (
                  <CampoTexto
                    etiqueta="Repetir contraseña"
                    valor={confirmar}
                    onCambio={setConfirmar}
                    placeholder="••••••••"
                    icono="lock"
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="go"
                    onSubmit={enviar}
                  />
                ) : null}

                {error ? (
                  <View
                    style={[
                      styles.errorCaja,
                      {
                        backgroundColor: colores.errorSuave,
                        borderRadius: RADIOS.sm,
                      },
                    ]}
                  >
                    <Icon name="circle-alert" size={16} color={colores.error} />
                    <Text
                      accessibilityRole="alert"
                      style={[
                        tipografia.caption,
                        styles.errorTexto,
                        { color: colores.error },
                      ]}
                    >
                      {error}
                    </Text>
                  </View>
                ) : null}

                <Boton
                  etiqueta={modoRegistro ? "Crear cuenta" : "Entrar"}
                  onPress={enviar}
                  cargando={enviando}
                  anchoCompleto
                  icono={modoRegistro ? "user-plus" : "log-in"}
                />
                <Boton
                  etiqueta={
                    modoRegistro ? "Ya tengo cuenta" : "Crear una cuenta"
                  }
                  onPress={cambiarModo}
                  variante="fantasma"
                  anchoCompleto
                  style={styles.secundario}
                />
              </View>
            </View>
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
    maxWidth: 500,
    alignSelf: "center",
    gap: ESPACIOS.lg,
  },
  contenedorAncho: {
    maxWidth: 940,
    flexDirection: "row",
    alignItems: "stretch",
  },
  panelMarca: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: ESPACIOS.lg,
    overflow: "hidden",
    position: "relative",
  },
  panelMarcaAncho: {
    flex: 1,
    minHeight: 480,
  },
  aroMarca: {
    position: "absolute",
    bottom: -70,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(62, 111, 246, 0.25)",
  },
  marcaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
  },
  brandLockup: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  brandBadge: {
    width: 34,
    height: 34,
    borderRadius: RADIOS.sm,
    backgroundColor: "#3e6ff6",
    alignItems: "center",
    justifyContent: "center",
  },
  brandNombre: {
    color: "#ffffff",
    letterSpacing: 1.4,
  },
  marcaCentro: {
    gap: ESPACIOS.sm,
  },
  rolPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ESPACIOS.xs + 2,
    backgroundColor: "rgba(62, 111, 246, 0.18)",
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
    borderRadius: RADIOS.pill,
  },
  rolPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6f95ff",
  },
  rolTexto: {
    color: "#9ab5ff",
  },
  marcaTitulo: {
    color: "#ffffff",
  },
  marcaBajada: {
    color: "#c4cdd8",
  },
  marcaPie: {
    color: "#9aa6b4",
  },
  tarjetaLogin: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    justifyContent: "center",
  },
  tarjetaLoginAncho: {
    flex: 1.05,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
    marginBottom: ESPACIOS.xs,
  },
  tarjetaTitulos: {
    flex: 1,
    gap: ESPACIOS.xs,
  },
  tarjetaSub: {
    marginBottom: ESPACIOS.lg,
  },
  formulario: {
    gap: ESPACIOS.xs,
  },
  errorCaja: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    marginBottom: ESPACIOS.md,
  },
  errorTexto: {
    flex: 1,
  },
  secundario: {
    marginTop: ESPACIOS.xs,
  },
});
