// ─── Pantalla de acceso (bodega) ─────────────────────────────────
//
// Iniciar sesión o crear cuenta. El rastreo del cliente no la necesita:
// el cliente entra con su código de pedido.

import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Boton } from "../components/Boton";
import { CampoTexto } from "../components/CampoTexto";
import { InterruptorTema } from "../components/InterruptorTema";
import { Masthead } from "../components/Masthead";
import { useAuth } from "../context/AuthContext";
import { MIN_CLAVE } from "../services/authLocal";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS } from "../theme/tokens";

export function LoginScreen() {
  const { colores, tipografia } = useTema();
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
    if (!usuario.trim() || !clave) return setError("Completa usuario y contraseña.");
    if (modoRegistro && clave !== confirmar) return setError("Las contraseñas no coinciden.");
    setEnviando(true);
    try {
      await (modoRegistro ? registrarse(usuario, clave) : entrar(usuario, clave));
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo completar la operación.");
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
    <SafeAreaView style={[styles.pantalla, { backgroundColor: colores.fondo }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <Masthead
            eyebrow="Atelier Noir · Acceso"
            titulo={modoRegistro ? "Crear cuenta" : "Iniciar sesión"}
            variante="tecnico"
            descripcion="Acceso exclusivo para el personal de bodega y despacho."
            acciones={<InterruptorTema />}
          />

          <View style={styles.formulario}>
            <CampoTexto
              etiqueta="Usuario"
              valor={usuario}
              onCambio={setUsuario}
              icono="user"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
            />
            <CampoTexto
              etiqueta="Contraseña"
              valor={clave}
              onCambio={setClave}
              icono="lock"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              ayuda={modoRegistro ? `Mínimo ${MIN_CLAVE} caracteres.` : undefined}
              returnKeyType={modoRegistro ? "next" : "go"}
              onSubmit={modoRegistro ? undefined : enviar}
            />
            {modoRegistro ? (
              <CampoTexto
                etiqueta="Repetir contraseña"
                valor={confirmar}
                onCambio={setConfirmar}
                icono="lock"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="go"
                onSubmit={enviar}
              />
            ) : null}

            {error ? (
              <Text
                accessibilityRole="alert"
                style={[tipografia.caption, styles.error, { color: colores.error }]}
              >
                {error}
              </Text>
            ) : null}

            <Boton
              etiqueta={modoRegistro ? "Crear cuenta" : "Entrar"}
              onPress={enviar}
              cargando={enviando}
              anchoCompleto
              icono={modoRegistro ? "user-plus" : "log-in"}
            />
            <Boton
              etiqueta={modoRegistro ? "Ya tengo cuenta" : "Crear una cuenta"}
              onPress={cambiarModo}
              variante="fantasma"
              anchoCompleto
              style={styles.secundario}
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
    padding: ESPACIOS.lg,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  formulario: { marginTop: ESPACIOS.lg },
  error: { marginBottom: ESPACIOS.md },
  secundario: { marginTop: ESPACIOS.sm },
});
