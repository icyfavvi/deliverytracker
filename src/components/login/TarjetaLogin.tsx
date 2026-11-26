// ─── Tarjeta de Acceso / Registro (Login Atelier Noir) ──────────

import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { InterruptorTema } from "../InterruptorTema";
import { MIN_CLAVE, MODO_DEMO_AUTH } from "../../services/authLocal";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, FUENTES, RADIOS, sombraTarjeta } from "../../theme/tokens";

interface Props {
  esAncho: boolean;
  modoRegistro: boolean;
  usuario: string;
  clave: string;
  confirmar: string;
  recordarme: boolean;
  error: string | null;
  enviando: boolean;
  onCambiarUsuario: (val: string) => void;
  onCambiarClave: (val: string) => void;
  onCambiarConfirmar: (val: string) => void;
  onToggleRecordarme: () => void;
  onCambiarModo: () => void;
  onEnviar: () => void;
  onExplorarCliente: () => void;
  onExplorarAdmin: () => void;
}

export function TarjetaLogin({
  esAncho,
  modoRegistro,
  usuario,
  clave,
  confirmar,
  recordarme,
  error,
  enviando,
  onCambiarUsuario,
  onCambiarClave,
  onCambiarConfirmar,
  onToggleRecordarme,
  onCambiarModo,
  onEnviar,
  onExplorarCliente,
  onExplorarAdmin,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View style={[styles.stageDerecho, esAncho && styles.stageDerechoAncho]}>
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
              style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
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
            onCambio={onCambiarUsuario}
            placeholder="tu.usuario"
            icono="user"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
          />
          <CampoTexto
            etiqueta="Contraseña"
            valor={clave}
            onCambio={onCambiarClave}
            placeholder="••••••••"
            icono="lock"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            ayuda={modoRegistro ? `Mínimo ${MIN_CLAVE} caracteres.` : undefined}
            returnKeyType={modoRegistro ? "next" : "go"}
            onSubmit={modoRegistro ? undefined : onEnviar}
          />
          {modoRegistro ? (
            <CampoTexto
              etiqueta="Repetir contraseña"
              valor={confirmar}
              onCambio={onCambiarConfirmar}
              placeholder="••••••••"
              icono="lock"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmit={onEnviar}
            />
          ) : null}

          {!modoRegistro ? (
            <View style={styles.formRow}>
              <Pressable
                onPress={onToggleRecordarme}
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
                onPress={onCambiarModo}
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
            etiqueta={modoRegistro ? "Crear cuenta" : "Entrar al portal"}
            iconoDerecha="arrow-right"
            onPress={onEnviar}
            cargando={enviando}
            anchoCompleto
          />

          {modoRegistro ? (
            <Boton
              etiqueta="Ya tengo cuenta"
              variante="fantasma"
              anchoCompleto
              onPress={onCambiarModo}
              style={styles.secundario}
            />
          ) : (
            <View style={[styles.demoBox, { borderTopColor: colores.borde }]}>
              <Text
                style={[
                  tipografia.caption,
                  { color: colores.tintaSecundaria, textAlign: "center" },
                ]}
              >
                Acceso rápido para explorar el prototipo
              </Text>

              <View style={styles.demoActions}>
                <Pressable
                  onPress={onExplorarCliente}
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
                  <Icon name="shopping-bag" size={15} color={colores.tinta} />
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    Vista cliente
                  </Text>
                </Pressable>

                {MODO_DEMO_AUTH ? (
                  <Pressable
                    onPress={onExplorarAdmin}
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
            <Icon name="lock" size={13} color={colores.tintaTerciaria} />
            <Text
              style={[tipografia.caption, { color: colores.tintaTerciaria }]}
            >
              Tus datos viajan cifrados y protegidos.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
