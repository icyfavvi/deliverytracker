// ─── Ruta: Crear pedido (Admin / Operaciones) ────────────────────
//
// Vive fuera de `(tabs)/` como pantalla del Stack raíz para evitar
// aparecer como pestaña ni sufrir redirecciones en Expo Router SDK 58.
// Exige sesión iniciada con rol `admin`.

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Boton } from "../components/Boton";
import { Icon } from "../components/Icon";
import { useAuth } from "../context/AuthContext";
import { CrearPedidoScreen } from "../screens/CrearPedidoScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { useTema } from "../theme/ThemeProvider";
import { ESPACIOS, RADIOS } from "../theme/tokens";

export default function NuevoPedidoRoute() {
  const { sesion, cargando } = useAuth();
  const { colores, tipografia } = useTema();

  if (cargando) return null;
  if (!sesion) return <LoginScreen />;

  if (sesion.rol !== "admin") {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colores.fondo }]}
        edges={["top"]}
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
          ]}
        >
          <Icon name="shield-alert" size={28} color={colores.advertencia} />
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Acceso restringido a Operaciones Admin
          </Text>
          <Text
            style={[
              tipografia.cuerpo,
              { color: colores.tintaSecundaria, textAlign: "center" },
            ]}
          >
            Tu sesión ({sesion.usuario}) tiene rol operador. Inicia sesión con
            una cuenta admin para crear pedidos por clientes.
          </Text>
          <Boton
            etiqueta="Volver a Bodega"
            icono="arrow-left"
            onPress={() => router.replace("/")}
          />
        </View>
      </SafeAreaView>
    );
  }

  return <CrearPedidoScreen />;
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.md,
  },
});
