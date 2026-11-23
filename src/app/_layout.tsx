// ─── Layout raíz (Expo Router) ───────────────────────────────────
//
// Aquí arranca la app: tipografías, tema, datos y navegación.
// Las rutas cuelgan de <Stack>; las pestañas reales viven en (tabs).

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
} from "@expo-google-fonts/jetbrains-mono";

import { ProveedorAuth } from "../context/AuthContext";
import { ProveedorPedidos } from "../context/PedidosContext";
import { ProveedorTema, useTema } from "../theme/ThemeProvider";

// La pantalla de inicio se oculta hasta que las tipografías estén listas,
// para que nadie vea un salto de una fuente a otra.
SplashScreen.preventAutoHideAsync().catch(() => {
  // En web no hay splash que esconder: no es un error.
});

export default function RootLayout() {
  const [fuentesListas, errorFuentes] = useFonts({
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
  });

  useEffect(() => {
    if (fuentesListas || errorFuentes) {
      SplashScreen.hideAsync().catch(() => {
        // Si no hay splash configurado, seguimos igual.
      });
    }
  }, [fuentesListas, errorFuentes]);

  if (!fuentesListas && !errorFuentes) return null;

  return (
    <SafeAreaProvider>
      <ProveedorTema>
        <ProveedorAuth>
          <ProveedorPedidos>
            <BarraDeEstado />
            <Stack screenOptions={{ headerShown: false }} />
          </ProveedorPedidos>
        </ProveedorAuth>
      </ProveedorTema>
    </SafeAreaProvider>
  );
}

/** La barra del sistema acompaña al tema: clara sobre papel, oscura sobre tinta. */
function BarraDeEstado() {
  const { modo } = useTema();
  return <StatusBar style={modo === "oscuro" ? "light" : "dark"} />;
}
