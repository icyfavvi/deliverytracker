// ─── Pestañas (Expo Router) ──────────────────────────────────────
//
// Dos pestañas, dos audiencias: la bodega que despacha y el cliente que
// rastrea. El badge de la primera muestra cuántas órdenes siguen en ruta.

import React from "react";
import { Tabs } from "expo-router";

import { Icon } from "../../components/Icon";
import { usePedidos } from "../../context/PedidosContext";
import { useTema } from "../../theme/ThemeProvider";
import { FUENTES } from "../../theme/tokens";

export default function TabsLayout() {
  const { colores } = useTema();
  const { estadisticas } = usePedidos();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.acentoIntenso,
        tabBarInactiveTintColor: colores.tintaTerciaria,
        tabBarStyle: {
          backgroundColor: colores.superficie,
          borderTopColor: colores.borde,
          borderTopWidth: 1,
          minHeight: 60,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
        },
        tabBarLabelStyle: {
          fontFamily: FUENTES.semi,
          fontSize: 12,
          letterSpacing: 0.2,
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
            <Icon name="warehouse" size={20} color={(color as string) ?? colores.acentoIntenso} />
          ),
          tabBarBadge: estadisticas.activos > 0 ? estadisticas.activos : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colores.acentoSuave,
            color: colores.acentoIntenso,
            fontFamily: FUENTES.monoBold,
            fontSize: 11,
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
              color={(color as string) ?? colores.acentoIntenso}
            />
          ),
        }}
      />
    </Tabs>
  );
}
