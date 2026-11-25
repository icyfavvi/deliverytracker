// ─── Layout raíz (Expo Router) ───────────────────────────────────
//
// Aquí arranca la app: tipografías (Space Grotesk, Manrope, DM Mono),
// tema, datos y navegación. Las rutas cuelgan de <Stack>; las pestañas
// reales viven en (tabs).

import React, { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from "@expo-google-fonts/manrope";
import {
  DMMono_400Regular,
  DMMono_500Medium,
} from "@expo-google-fonts/dm-mono";

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
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    DMMono_400Regular,
    DMMono_500Medium,
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

/** La barra del sistema acompaña al tema: oscura sobre claro, clara sobre ink. */
function BarraDeEstado() {
  const { modo } = useTema();
  return <StatusBar style={modo === "oscuro" ? "light" : "dark"} />;
}
