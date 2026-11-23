import React, { useState } from "react";

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { Icon } from "../components/Icon";
import { Boton } from "../components/Boton";
import { InterruptorTema } from "../components/InterruptorTema";
import { useSesionDemo } from "../context/SesionDemoContext";
import { USUARIO_DEMO, CLAVE_DEMO } from "../services/demoAuth";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

const ORO = "#D0AD78";
const TINTA = "#201B18";

export function LoginDemoScreen() {
  const { width } = useWindowDimensions();
  const amplio = width >= 800;

  const { colores, tipografia } = useTema();
  const { ingresar } = useSesionDemo();

  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState("");

  async function entrar() {
    if (esperando) return;

    setError("");

    if (!correo.trim() || !clave) {
      setError("Completa correo y contraseña para ingresar.");
      return;
    }

    setEsperando(true);

    try {
      if (!(await ingresar(correo, clave))) {
        setError(
          "Credenciales incorrectas. Usa la cuenta de demostración."
        );
      }
    } catch {
      setError("No fue posible iniciar sesión. Reintenta.");
    } finally {
      setEsperando(false);
    }
  }

  return (
    <SafeAreaView
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colores.fondo }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={estilos.scroll}
        >
          <View
            style={[
              estilos.contenedor,
              amplio && estilos.fila,
            ]}
          >
            <View
              style={[
                estilos.hero,
                amplio && estilos.heroAncho,
              ]}
            >
              <View style={estilos.heroSello}>
                <View style={estilos.sello}>
                  <Icon
                    name="package-check"
                    size={22}
                    color={TINTA}
                  />
                </View>

                <Text style={estilos.logo}>
                  A T E L I E R  N O I R
                </Text>
              </View>

              <View style={estilos.heroCentro}>
                <Text style={estilos.microHero}>
                  PLATAFORMA PRIVADA · DEMOSTRACIÓN UTEM
                </Text>

                <Text
                  style={[
                    estilos.titular,
                    !amplio && estilos.titularMovil,
                  ]}
                >
                  Cada entrega{"\n"}
                  cuenta una{"\n"}
                  historia.
                </Text>

                <View style={estilos.raya} />

                <Text style={estilos.bajada}>
                  De la bodega a las manos de tus clientes.
                  Un seguimiento diseñado con detalle.
                </Text>
              </View>

              <Text style={estilos.heroPie}>
                01 CONFIRMADO / 02 PREPARACIÓN /
                03 EN CAMINO / 04 ENTREGADO
              </Text>
            </View>

            <View style={estilos.area}>
              <View style={estilos.topBar}>
                <Text
                  style={[
                    tipografia.eyebrowMono,
                    { color: colores.acento },
                  ]}
                >
                  ACCESO DE OPERADOR
                </Text>

                <InterruptorTema />
              </View>

              <View
                style={[
                  estilos.tarjeta,
                  {
                    backgroundColor: colores.superficie,
                    borderColor: colores.borde,
                  },
                ]}
              >
                <View
                  style={[
                    estilos.iconoAcceso,
                    {
                      backgroundColor:
                        colores.superficieHundida,
                    },
                  ]}
                >
                  <Icon
                    name="lock-keyhole"
                    size={23}
                    color={colores.acento}
                  />
                </View>

                <Text
                  style={[
                    estilos.bienvenida,
                    { color: colores.tinta },
                  ]}
                >
                  Bienvenido{"\n"}de nuevo.
                </Text>

                <Text
                  style={[
                    estilos.subtitulo,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  Ingresa a Bodega y despacho para gestionar
                  pedidos y actualizar su seguimiento.
                </Text>

                <Text
                  style={[
                    estilos.etiqueta,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  CORREO DEL OPERADOR
                </Text>

                <View
                  style={[
                    estilos.campo,
                    {
                      backgroundColor: colores.fondo,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  <Icon
                    name="mail"
                    size={18}
                    color={colores.tintaTerciaria}
                  />

                  <TextInput
                    accessibilityLabel="Correo de operador"
                    style={[
                      estilos.input,
                      { color: colores.tinta },
                    ]}
                    value={correo}
                    onChangeText={(valor) => {
                      setCorreo(valor);
                      setError("");
                    }}
                    placeholder="operador@tienda.cl"
                    placeholderTextColor={
                      colores.tintaTerciaria
                    }
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoComplete="username"
                  />
                </View>

                <Text
                  style={[
                    estilos.etiqueta,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  CONTRASEÑA
                </Text>

                <View
                  style={[
                    estilos.campo,
                    {
                      backgroundColor: colores.fondo,
                      borderColor: colores.borde,
                    },
                  ]}
                >
                  <Icon
                    name="key-round"
                    size={18}
                    color={colores.tintaTerciaria}
                  />

                  <TextInput
                    accessibilityLabel="Contraseña de operador"
                    style={[
                      estilos.input,
                      { color: colores.tinta },
                    ]}
                    value={clave}
                    onChangeText={(valor) => {
                      setClave(valor);
                      setError("");
                    }}
                    placeholder="Tu contraseña"
                    placeholderTextColor={
                      colores.tintaTerciaria
                    }
                    secureTextEntry={!mostrar}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={() => {
                      void entrar();
                    }}
                  />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      mostrar
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    onPress={() =>
                      setMostrar((valor) => !valor)
                    }
                    hitSlop={10}
                    style={estilos.ojo}
                  >
                    <Icon
                      name={mostrar ? "eye-off" : "eye"}
                      size={18}
                      color={colores.tintaSecundaria}
                    />
                  </Pressable>
                </View>

                {error ? (
                  <Text
                    accessibilityLiveRegion="polite"
                    style={[
                      estilos.error,
                      { color: colores.error },
                    ]}
                  >
                    {error}
                  </Text>
                ) : null}

                <Boton
                  etiqueta={
                    esperando
                      ? "Validando acceso…"
                      : "Entrar a bodega"
                  }
                  icono="arrow-right"
                  onPress={() => {
                    void entrar();
                  }}
                  cargando={esperando}
                  anchoCompleto
                />

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Completar cuenta de demostración"
                  onPress={() => {
                    setCorreo(USUARIO_DEMO);
                    setClave(CLAVE_DEMO);
                    setError("");
                  }}
                  style={({ pressed }) => [
                    estilos.demo,
                    {
                      borderColor: colores.borde,
                      opacity: pressed ? 0.65 : 1,
                    },
                  ]}
                >
                  <Icon
                    name="sparkles"
                    size={17}
                    color={colores.acento}
                  />

                  <Text
                    style={[
                      tipografia.etiqueta,
                      { color: colores.tinta },
                    ]}
                  >
                    Usar cuenta de demostración
                  </Text>
                </Pressable>

                <View
                  style={[
                    estilos.advertencia,
                    {
                      backgroundColor:
                        colores.superficieHundida,
                    },
                  ]}
                >
                  <Icon
                    name="info"
                    size={17}
                    color={colores.tintaSecundaria}
                  />

                  <Text
                    style={[
                      tipografia.caption,
                      {
                        color: colores.tintaSecundaria,
                        flex: 1,
                      },
                    ]}
                  >
                    Acceso ficticio para evaluación.
                    No reemplaza la autenticación segura
                    de un servidor.
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  tipografia.micro,
                  estilos.firma,
                  { color: colores.tintaTerciaria },
                ]}
              >
                ATELIER NOIR · DELIVERYTRACKER · UTEM
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const estilos = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  contenedor: {
    width: "100%",
    maxWidth: 1120,
    alignSelf: "center",
    gap: ESPACIOS.lg,
  },
  fila: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  hero: {
    backgroundColor: TINTA,
    borderRadius: RADIOS.xl,
    minHeight: 285,
    padding: 28,
    gap: 26,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  heroAncho: {
    flex: 1.1,
    minHeight: 580,
    padding: 40,
  },
  heroSello: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sello: {
    backgroundColor: ORO,
    borderRadius: 11,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    color: "#F6F1E8",
    fontSize: 11,
    fontFamily: "JetBrainsMono_600SemiBold",
  },
  heroCentro: {
    alignItems: "flex-start",
    gap: 16,
  },
  microHero: {
    fontSize: 9,
    letterSpacing: 1.2,
    color: ORO,
    fontFamily: "JetBrainsMono_600SemiBold",
  },
  titular: {
    color: "#FCF6EC",
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 43,
    lineHeight: 51,
  },
  titularMovil: {
    fontSize: 31,
    lineHeight: 37,
  },
  raya: {
    height: 3,
    width: 60,
    backgroundColor: ORO,
    borderRadius: 2,
  },
  bajada: {
    color: "#CFC2B4",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
  },
  heroPie: {
    color: ORO,
    fontFamily: "JetBrainsMono_500Medium",
    fontSize: 9,
    lineHeight: 15,
  },
  area: {
    flex: 1,
    justifyContent: "center",
    gap: 14,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tarjeta: {
    borderWidth: 1,
    borderRadius: RADIOS.xl,
    padding: 25,
  },
  iconoAcceso: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },
  bienvenida: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 33,
    lineHeight: 39,
    marginBottom: 12,
  },
  subtitulo: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 23,
    marginBottom: 23,
  },
  etiqueta: {
    fontFamily: "JetBrainsMono_600SemiBold",
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 7,
  },
  campo: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: RADIOS.md,
    marginBottom: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  ojo: {
    padding: 6,
  },
  error: {
    fontFamily: "Inter_500Medium",
    fontSize: 12,
    marginBottom: 12,
  },
  demo: {
    marginTop: 13,
    minHeight: 48,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  advertencia: {
    marginTop: 16,
    borderRadius: RADIOS.sm,
    padding: 12,
    gap: 8,
    flexDirection: "row",
  },
  firma: {
    textAlign: "center",
    letterSpacing: 0.7,
  },
});
