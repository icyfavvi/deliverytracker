// ─── Pantalla de Login Atelier Noir (Prototipo Imagen 1) ────────
//
// Fiel al prototipo: panel oscuro izquierdo ("Viste lo que te mueve.")
// con icono hexagonal, acento cobalto y tarjeta clara derecha ("Entra a tu
// espacio.") con botones rápidos "Vista cliente" y "Vista admin" (`admin`/`admin`).

import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Boton } from "../components/Boton";
import { CampoTexto } from "../components/CampoTexto";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { useAuth } from "../context/AuthContext";
import { ADMIN_DEMO, MIN_CLAVE, MODO_DEMO_AUTH } from "../services/authLocal";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";

export function LoginScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
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
      return setError("Completa usuario y contraseña.");
    }
    if (modoRegistro && clave !== confirmar) {
      return setError("Las contraseñas no coinciden.");
    }
    setEnviando(true);
    try {
      await (modoRegistro
        ? registrarse(usuario, clave)
        : entrar(usuario, clave));
    } catch (e) {
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
    } catch (e) {
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
            {/* ─── Panel oscuro izquierdo (.login-panel) ───────────── */}
            <View
              style={[
                styles.panelMarca,
                esAncho && styles.panelMarcaAncho,
                {
                  backgroundColor: "#0a0d10",
                  borderColor: "#1a2029",
                  borderRadius: esAncho ? RADIOS.lg : RADIOS.lg,
                },
                sombraTarjeta(modo),
              ]}
            >
              <View pointerEvents="none" style={styles.aroMarca} />
              <View pointerEvents="none" style={styles.brilloAzul} />

              <View style={styles.marcaTop}>
                <View style={styles.brandLockup}>
                  <View style={styles.brandIcono}>
                    <Icon name="hexagon" size={18} color="#0a0d10" />
                  </View>
                  <View>
                    <Text style={[tipografia.etiqueta, styles.brandNombre]}>
                      ATELIER NOIR
                    </Text>
                    <Text style={[tipografia.caption, styles.brandSub]}>
                      STREETWEAR / CHILE
                    </Text>
                  </View>
                </View>
                {!esAncho ? <InterruptorTema /> : null}
              </View>

              <View style={styles.marcaCentro}>
                <Text style={[tipografia.eyebrowMono, styles.portalTag]}>
                  PORTAL PRIVADO / 01
                </Text>
                <Text style={[styles.titularHero]}>
                  Viste lo que{"\n"}
                  <Text style={styles.titularAzul}>te mueve.</Text>
                </Text>
                <Text style={[tipografia.cuerpo, styles.marcaBajada]}>
                  Gestiona tus pedidos, descubre nuevas cápsulas y mantén cada
                  despacho bajo control. Un espacio creado para moverse distinto.
                </Text>
              </View>

              <View style={styles.marcaFooter}>
                <Text style={[tipografia.micro, { color: "#9aa6b4" }]}>
                  AN / 2026 — SCL
                </Text>
                <Text style={[tipografia.caption, { color: "#9aa6b4" }]}>
                  Moda urbana con origen local
                </Text>
              </View>
            </View>

            {/* ─── Escenario derecho con tarjeta Login (.login-card) ─ */}
            <View
              style={[
                styles.stageDerecho,
                esAncho && styles.stageDerechoAncho,
              ]}
            >
              <View
                style={[
                  styles.tarjetaLogin,
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
                      {modoRegistro ? "ALTA DE CUENTA" : "BIENVENIDO DE VUELTA"}
                    </Text>
                    <Text
                      accessibilityRole="header"
                      style={[tipografia.display, { color: colores.tinta }]}
                    >
                      {modoRegistro ? "Crea tu cuenta." : "Entra a tu espacio."}
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
                    ? "Registra un usuario operativo para gestionar despachos de bodega."
                    : "Usa tu cuenta Atelier Noir para revisar tus pedidos o administrar tu operación."}
                </Text>

                <View style={styles.formulario}>
                  <CampoTexto
                    etiqueta="Usuario o correo"
                    valor={usuario}
                    onCambio={setUsuario}
                    placeholder="tu.usuario"
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

                  {!modoRegistro ? (
                    <View style={styles.formRow}>
                      <Pressable
                        onPress={() => setRecordarme((r) => !r)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: recordarme }}
                        style={styles.checkRow}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            {
                              backgroundColor: recordarme
                                ? colores.acento
                                : colores.superficieHundida,
                              borderColor: recordarme
                                ? colores.acento
                                : colores.bordeFuerte,
                            },
                          ]}
                        >
                          {recordarme ? (
                            <Icon name="check" size={12} color="#ffffff" />
                          ) : null}
                        </View>
                        <Text
                          style={[
                            tipografia.caption,
                            { color: colores.tintaSecundaria },
                          ]}
                        >
                          Recordarme
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={cambiarModo}
                        accessibilityRole="button"
                        style={{ minHeight: puntoMinimo, justifyContent: "center" }}
                      >
                        <Text
                          style={[
                            tipografia.caption,
                            {
                              color: colores.acentoIntenso,
                              fontFamily: FUENTES.semi,
                            },
                          ]}
                        >
                          Crear otra cuenta
                        </Text>
                      </Pressable>
                    </View>
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
                      <Icon
                        name="circle-alert"
                        size={16}
                        color={colores.error}
                      />
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
                    etiqueta={
                      modoRegistro ? "Crear cuenta" : "Entrar al portal"
                    }
                    iconoDerecha="arrow-right"
                    onPress={enviar}
                    cargando={enviando}
                    anchoCompleto
                  />

                  {modoRegistro ? (
                    <Boton
                      etiqueta="Ya tengo cuenta"
                      variante="fantasma"
                      anchoCompleto
                      onPress={cambiarModo}
                      style={styles.secundario}
                    />
                  ) : (
                    <View
                      style={[
                        styles.demoBox,
                        { borderTopColor: colores.borde },
                      ]}
                    >
                      <Text
                        style={[
                          tipografia.caption,
                          {
                            color: colores.tintaSecundaria,
                            textAlign: "center",
                          },
                        ]}
                      >
                        Acceso rápido para explorar el prototipo
                      </Text>

                      <View style={styles.demoActions}>
                        <Pressable
                          onPress={explorarComoCliente}
                          accessibilityRole="button"
                          accessibilityLabel="Explorar vista cliente"
                          style={({ pressed }) => [
                            styles.demoBtn,
                            {
                              minHeight: puntoMinimo,
                              backgroundColor: colores.superficieHundida,
                              borderColor: colores.borde,
                              borderRadius: RADIOS.sm,
                              opacity: pressed ? 0.72 : 1,
                            },
                          ]}
                        >
                          <Icon
                            name="shopping-bag"
                            size={15}
                            color={colores.tinta}
                          />
                          <Text
                            style={[
                              tipografia.etiqueta,
                              { color: colores.tinta },
                            ]}
                          >
                            Vista cliente
                          </Text>
                        </Pressable>

                        {MODO_DEMO_AUTH ? (
                          <Pressable
                            onPress={explorarComoAdmin}
                            disabled={enviando}
                            accessibilityRole="button"
                            accessibilityLabel="Ingresar como admin a bodega"
                            style={({ pressed }) => [
                              styles.demoBtn,
                              {
                                minHeight: puntoMinimo,
                                backgroundColor: colores.acentoSuave,
                                borderColor: colores.acento,
                                borderRadius: RADIOS.sm,
                                opacity: enviando ? 0.5 : pressed ? 0.75 : 1,
                              },
                            ]}
                          >
                            <Icon
                              name="shield-check"
                              size={15}
                              color={colores.acentoIntenso}
                            />
                            <Text
                              style={[
                                tipografia.etiqueta,
                                { color: colores.acentoIntenso },
                              ]}
                            >
                              Vista admin
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    </View>
                  )}

                  <View style={styles.lockFooter}>
                    <Icon
                      name="lock"
                      size={13}
                      color={colores.tintaTerciaria}
                    />
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      Tus datos viajan cifrados y protegidos.
                    </Text>
                  </View>
                </View>
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
  panelMarca: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    justifyContent: "space-between",
    gap: ESPACIOS.xl,
    overflow: "hidden",
    position: "relative",
  },
  panelMarcaAncho: {
    flex: 1,
    minHeight: 580,
    padding: ESPACIOS.xxl,
  },
  aroMarca: {
    position: "absolute",
    bottom: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 1,
    borderColor: "rgba(62, 111, 246, 0.24)",
  },
  brilloAzul: {
    position: "absolute",
    top: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(62, 111, 246, 0.12)",
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
    gap: ESPACIOS.sm + 2,
  },
  brandIcono: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  brandNombre: {
    color: "#ffffff",
    letterSpacing: 1.4,
  },
  brandSub: {
    color: "#9aa6b4",
    letterSpacing: 0.6,
  },
  marcaCentro: {
    gap: ESPACIOS.md,
  },
  portalTag: {
    color: "#9aa6b4",
    letterSpacing: 1.2,
  },
  titularHero: {
    color: "#ffffff",
    fontFamily: FUENTES.fuerte,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.4,
  },
  titularAzul: {
    color: "#6f95ff",
  },
  marcaBajada: {
    color: "#c4cdd8",
    maxWidth: 380,
  },
  marcaFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
    paddingTop: ESPACIOS.md,
    borderTopWidth: 1,
    borderTopColor: "#1d242f",
  },
  stageDerecho: {
    justifyContent: "center",
  },
  stageDerechoAncho: {
    flex: 1.05,
  },
  tarjetaLogin: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
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
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: ESPACIOS.sm,
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    minHeight: 44,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
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
  demoBox: {
    marginTop: ESPACIOS.lg,
    paddingTop: ESPACIOS.md,
    borderTopWidth: 1,
    gap: ESPACIOS.sm,
  },
  demoActions: {
    flexDirection: "row",
    gap: ESPACIOS.sm,
  },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.xs + 2,
    borderWidth: 1,
    paddingHorizontal: ESPACIOS.sm,
    cursor: "pointer",
  },
  lockFooter: {
    marginTop: ESPACIOS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.xs + 2,
  },
});
