// ─── Shell de Portal Atelier Noir (Responsive Mobile + Tablet/Web) ─

import React from "react";
import { View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTema } from "../theme/ThemeProvider";
import { BREAKPOINTS } from "../theme/tokens";
import {
  AccionExtraPortal,
  PortalNavItem,
  portalStyles as styles,
} from "./portal/estilosPortal";
import { PortalHeader, PortalTopbarDesktop } from "./portal/PortalHeader";
import { SidebarNav } from "./portal/SidebarNav";

export type { PortalNavItem };

interface Props {
  rolLabel: string;
  usuarioIniciales: string;
  usuarioNombre: string;
  usuarioRol: string;
  items: PortalNavItem[];
  vistaActiva: string;
  onCambiarVista: (id: string) => void;
  accionExtra?: AccionExtraPortal;
  busqueda?: string;
  onCambiarBusqueda?: (txt: string) => void;
  placeholderBusqueda?: string;
  mostrarSalir?: boolean;
  onEditarUsuario?: () => void;
  children: React.ReactNode;
}

export function PortalShell({
  rolLabel,
  usuarioIniciales,
  usuarioNombre,
  usuarioRol,
  items,
  vistaActiva,
  onCambiarVista,
  accionExtra,
  busqueda,
  onCambiarBusqueda,
  placeholderBusqueda = "Buscar en tu espacio…",
  mostrarSalir = true,
  onEditarUsuario,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const esDesktop = width >= BREAKPOINTS.tablet;
  const { colores } = useTema();

  if (esDesktop) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colores.fondo }]}
        edges={["top"]}
      >
        <View style={styles.desktopRoot}>
          <SidebarNav
            rolLabel={rolLabel}
            usuarioIniciales={usuarioIniciales}
            usuarioNombre={usuarioNombre}
            usuarioRol={usuarioRol}
            items={items}
            vistaActiva={vistaActiva}
            onCambiarVista={onCambiarVista}
            accionExtra={accionExtra}
          />

          <View style={styles.mainDesktop}>
            <PortalTopbarDesktop
              usuarioIniciales={usuarioIniciales}
              usuarioNombre={usuarioNombre}
              usuarioRol={usuarioRol}
              busqueda={busqueda}
              onCambiarBusqueda={onCambiarBusqueda}
              placeholderBusqueda={placeholderBusqueda}
              mostrarSalir={mostrarSalir}
              onEditarUsuario={onEditarUsuario}
            />
            <View style={styles.flex}>{children}</View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <PortalHeader
        usuarioIniciales={usuarioIniciales}
        usuarioNombre={usuarioNombre}
        usuarioRol={usuarioRol}
        items={items}
        vistaActiva={vistaActiva}
        onCambiarVista={onCambiarVista}
        accionExtra={accionExtra}
        busqueda={busqueda}
        onCambiarBusqueda={onCambiarBusqueda}
        placeholderBusqueda={placeholderBusqueda}
        mostrarSalir={mostrarSalir}
        onEditarUsuario={onEditarUsuario}
      />
      <View style={styles.flex}>{children}</View>
    </SafeAreaView>
  );
}
