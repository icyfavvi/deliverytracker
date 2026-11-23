// ─── Ruta: Bodega / Despacho ─────────────────────────────────────
//
// La pantalla vive en src/screens para mantener los archivos manejables;
// esta ruta solo la monta. Cada archivo dentro de src/app/ es una
// pantalla navegable.

import React from "react";
import { ActivityIndicator, View } from "react-native";

import { LocalScreen } from "../../screens/LocalScreen";
import { LoginDemoScreen } from "../../screens/LoginDemoScreen";
import { useSesionDemo } from "../../context/SesionDemoContext";
import { useTema } from "../../theme/ThemeProvider";

export default function BodegaRoute() {
  const { estado } = useSesionDemo();
  const { colores } = useTema();

  if (estado === "cargando") {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colores.fondo,
          justifyContent: "center",
        }}
      >
        <ActivityIndicator
          size="large"
          color={colores.acento}
        />
      </View>
    );
  }

  return estado === "autenticado"
    ? <LocalScreen />
    : <LoginDemoScreen />;
}
