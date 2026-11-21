// ─── Pestañas (Expo Router) ──────────────────────────────────────
//
// Dos pestañas, dos audiencias: la bodega que despacha y el cliente que
// rastrea. El badge de la primera muestra cuántas órdenes siguen en ruta,
// leído de la misma fuente de verdad que usa la pantalla de bodega.

import React from "react";
import { Tabs } from "expo-router";

import { Icon } from "../../components/Icon";
import { usePedidos } from "../../context/PedidosContext";
import { useTema } from "../../theme/ThemeProvider";

export default function TabsLayout() {
  const { colores } = useTema();
  const { estadisticas } = usePedidos();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.acento,
        tabBarInactiveTintColor: colores.tintaTerciaria,
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          borderTopWidth: 1,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 11,
          letterSpacing: 0.3,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Bodega",
          tabBarLabel: "Bodega",
          tabBarAccessibilityLabel: "Bodega y despacho",
          tabBarIcon: ({ color }) => (
            <Icon name="warehouse" size={20} color={(color as string) ?? colores.acento} />
          ),
          tabBarBadge: estadisticas.activos > 0 ? estadisticas.activos : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colores.acentoSuave,
            color: colores.acentoIntenso,
            fontFamily: "Inter_700Bold",
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="cliente"
        options={{
          title: "Rastreo",
          tabBarLabel: "Rastreo",
          tabBarAccessibilityLabel: "Rastreo del cliente",
          tabBarIcon: ({ color }) => (
            <Icon
              name="package-search"
              size={20}
              color={(color as string) ?? colores.acento}
            />
          ),
        }}
      />
    </Tabs>
  );
}
