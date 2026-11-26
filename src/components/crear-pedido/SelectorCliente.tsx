// ─── Bloque 1: Selector / Alta de Cliente (FlatList #12) ──────────

import React from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { Boton } from "../Boton";
import { CampoTexto } from "../CampoTexto";
import { Icon } from "../Icon";
import { useTema } from "../../theme/ThemeProvider";
import { ESPACIOS, RADIOS, sombraTarjeta } from "../../theme/tokens";
import { ClienteAdmin } from "../../types/pedido";

interface Props {
  busquedaCliente: string;
  clientesFiltrados: ClienteAdmin[];
  clienteSeleccionado: ClienteAdmin | null;
  mostrarNuevoCliente: boolean;
  errorCliente?: string;
  nuevoCliNombre: string;
  nuevoCliCorreo: string;
  nuevoCliTelefono: string;
  erroresNuevoCli: { nombre?: string; correo?: string; telefono?: string };
  onCambiarBusqueda: (txt: string) => void;
  onToggleNuevoCliente: () => void;
  onSeleccionarCliente: (cli: ClienteAdmin) => void;
  onCambiarClienteSeleccionado: () => void;
  onIniciarNuevoConBusqueda: () => void;
  onCambiarNuevoNombre: (v: string) => void;
  onCambiarNuevoCorreo: (v: string) => void;
  onCambiarNuevoTelefono: (v: string) => void;
  onGuardarNuevoCliente: () => void;
}

export function SelectorCliente({
  busquedaCliente,
  clientesFiltrados,
  clienteSeleccionado,
  mostrarNuevoCliente,
  errorCliente,
  nuevoCliNombre,
  nuevoCliCorreo,
  nuevoCliTelefono,
  erroresNuevoCli,
  onCambiarBusqueda,
  onToggleNuevoCliente,
  onSeleccionarCliente,
  onCambiarClienteSeleccionado,
  onIniciarNuevoConBusqueda,
  onCambiarNuevoNombre,
  onCambiarNuevoCorreo,
  onCambiarNuevoTelefono,
  onGuardarNuevoCliente,
}: Props) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();

  return (
    <View
      style={[
        styles.panel,
        {
          backgroundColor: colores.superficie,
          borderColor: errorCliente ? colores.error : colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View style={styles.panelHeadFila}>
        <View style={styles.panelHead}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
          >
            BLOQUE 1 · CLIENTE
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            ¿Para quién es el pedido?
          </Text>
        </View>
        <Boton
          etiqueta={mostrarNuevoCliente ? "Cancelar" : "Crear cliente nuevo"}
          icono={mostrarNuevoCliente ? "x" : "user-plus"}
          variante="secundario"
          compacto
          onPress={onToggleNuevoCliente}
        />
      </View>

      {errorCliente ? (
        <View
          accessibilityLiveRegion="assertive"
          style={[
            styles.alertaInline,
            { backgroundColor: colores.errorSuave, borderRadius: RADIOS.sm },
          ]}
        >
          <Icon name="circle-alert" size={15} color={colores.error} />
          <Text
            accessibilityRole="alert"
            style={[tipografia.caption, { color: colores.error, flex: 1 }]}
          >
            {errorCliente}
          </Text>
        </View>
      ) : null}

      {clienteSeleccionado && !mostrarNuevoCliente ? (
        <View
          style={[
            styles.clienteSeleccionadoCard,
            {
              backgroundColor: colores.acentoSuave,
              borderColor: colores.acento,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <View style={styles.clienteInfo}>
            <Text style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}>
              {clienteSeleccionado.nombre}
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              {clienteSeleccionado.correo} · {clienteSeleccionado.telefono}
            </Text>
            <Text style={[tipografia.micro, { color: colores.acentoIntenso }]}>
              {clienteSeleccionado.totalPedidos} pedido(s)
              {clienteSeleccionado.ultimoPedidoCodigo
                ? ` · Último #${clienteSeleccionado.ultimoPedidoCodigo} (${clienteSeleccionado.ultimoPedidoFecha})`
                : " · Sin pedidos previos"}
            </Text>
          </View>
          <Boton
            etiqueta="Cambiar"
            variante="secundario"
            compacto
            onPress={onCambiarClienteSeleccionado}
          />
        </View>
      ) : null}

      {mostrarNuevoCliente ? (
        <View
          style={[
            styles.nuevoClienteBox,
            {
              backgroundColor: colores.superficieHundida,
              borderColor: colores.borde,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <CampoTexto
            etiqueta="Nombre completo"
            valor={nuevoCliNombre}
            onCambio={onCambiarNuevoNombre}
            placeholder="Ej: Sofía Méndez"
            icono="user"
            error={erroresNuevoCli.nombre}
          />
          <CampoTexto
            etiqueta="Correo electrónico"
            valor={nuevoCliCorreo}
            onCambio={onCambiarNuevoCorreo}
            placeholder="sofia@correo.cl"
            icono="mail"
            keyboardType="email-address"
            autoCapitalize="none"
            error={erroresNuevoCli.correo}
          />
          <CampoTexto
            etiqueta="Teléfono"
            valor={nuevoCliTelefono}
            onCambio={onCambiarNuevoTelefono}
            placeholder="+56 9 1234 5678"
            icono="phone"
            keyboardType="phone-pad"
            error={erroresNuevoCli.telefono}
          />
          <Boton
            etiqueta="Guardar y asignar cliente"
            icono="user-check"
            anchoCompleto
            onPress={onGuardarNuevoCliente}
          />
        </View>
      ) : !clienteSeleccionado ? (
        <View style={styles.buscadorClientesWrap}>
          <CampoTexto
            etiqueta="Buscar cliente"
            valor={busquedaCliente}
            onCambio={onCambiarBusqueda}
            placeholder="Nombre, correo o teléfono…"
            icono="search"
            autoCapitalize="none"
          />
          {clientesFiltrados.length === 0 ? (
            <View
              style={[
                styles.vacioCaja,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                No encontramos clientes para &ldquo;{busquedaCliente}&rdquo;.
              </Text>
              <Boton
                etiqueta="Crear cliente nuevo"
                icono="user-plus"
                variante="secundario"
                compacto
                onPress={onIniciarNuevoConBusqueda}
              />
            </View>
          ) : (
            <FlatList
              data={clientesFiltrados}
              keyExtractor={(cli) => cli.id}
              scrollEnabled={false}
              initialNumToRender={10}
              windowSize={5}
              contentContainerStyle={styles.listaResultados}
              renderItem={({ item: cli }) => (
                <Pressable
                  onPress={() => onSeleccionarCliente(cli)}
                  accessibilityRole="button"
                  accessibilityLabel={`Seleccionar cliente ${cli.nombre}`}
                  style={({ pressed }) => [
                    styles.clienteRow,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <View style={styles.clienteInfo}>
                    <Text
                      style={[tipografia.etiqueta, { color: colores.tinta }]}
                    >
                      {cli.nombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {cli.correo} · {cli.telefono}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      {cli.totalPedidos} pedido(s)
                      {cli.ultimoPedidoCodigo
                        ? ` · Último #${cli.ultimoPedidoCodigo} (${cli.ultimoPedidoFecha})`
                        : " · Sin pedidos previos"}
                    </Text>
                  </View>
                  <Icon
                    name="chevron-right"
                    size={18}
                    color={colores.acentoIntenso}
                  />
                </Pressable>
              )}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: ESPACIOS.lg, borderWidth: 1, gap: ESPACIOS.md },
  panelHeadFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  panelHead: { gap: 2 },
  alertaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
  },
  buscadorClientesWrap: { gap: ESPACIOS.xs },
  listaResultados: { gap: ESPACIOS.sm },
  clienteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
    cursor: "pointer",
  },
  clienteSeleccionadoCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ESPACIOS.md,
    borderWidth: 1.5,
    gap: ESPACIOS.sm,
  },
  clienteInfo: { flex: 1, minWidth: 0, gap: 2 },
  nuevoClienteBox: { padding: ESPACIOS.md, borderWidth: 1 },
  vacioCaja: { padding: ESPACIOS.md, alignItems: "center", gap: ESPACIOS.sm },
});
