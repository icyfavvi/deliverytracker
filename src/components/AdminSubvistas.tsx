// ─── Subvistas Modulares Admin / Operaciones (Prototipo Atelier Noir) ─
//
// Implementa las vistas Resumen, Bodega, Despachos y Seguimiento en vivo
// conectadas en 100% tiempo real a PedidosContext y operacionesMock (O(1) SKU).

import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { Boton } from "./Boton";
import { EstadoPedidoBadge } from "./EstadoPedidoBadge";
import { Icon } from "./Icon";
import { TarjetaMetrica } from "./TarjetaMetrica";
import {
  STOCK_CRITICO_MAX,
  TRANSPORTISTAS,
} from "../services/operacionesMock";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraTarjeta,
} from "../theme/tokens";
import {
  AnaliticaOperacion,
  ETIQUETAS_ESTADO,
  FLUJO_ESTADOS,
  Pedido,
  Transportista,
} from "../types/pedido";

function formatearCLP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

// ─── 1. ADMIN: RESUMEN (Imagen 5) ─────────────────────────────────

export function AdminResumenView({
  nombreAdmin,
  pedidos,
  analitica,
  onIrVista,
  onNuevoPedido,
  onAvanzar,
}: {
  nombreAdmin: string;
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onIrVista: (vista: "bodega" | "pedidos" | "despachos" | "seguimiento") => void;
  onNuevoPedido: () => void;
  onAvanzar: (codigo: string) => void;
}) {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const primerNombre = nombreAdmin.split(" ")[0] || "Operaciones";

  return (
    <View style={styles.seccionStack}>
      {/* Cabecera */}
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}>
            PANEL DE CONTROL · OPERACIONES
          </Text>
          <Text accessibilityRole="header" style={[tipografia.display, { color: colores.tinta }]}>
            Buen día,{" "}
            <Text style={{ color: colores.acentoIntenso }}>{primerNombre}.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Pulso en tiempo real de pedidos, despachos e inventario.
          </Text>
        </View>
        <Boton etiqueta="+ Nuevo pedido" onPress={onNuevoPedido} />
      </View>

      {/* Banner oscuro operación */}
      <View
        style={[
          styles.adminBanner,
          {
            backgroundColor: colores.panelOscuro,
            borderColor: colores.panelOscuroBorde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.bannerTextos}>
          <Text style={[tipografia.titulo, { color: "#ffffff" }]}>
            {analitica.total === 0
              ? "Bodega lista para recibir órdenes."
              : "La operación se mueve bien."}
          </Text>
          <Text style={[tipografia.cuerpo, { color: "#c4cdd8" }]}>
            {analitica.activos} pedidos activos en flujo ·{" "}
            {analitica.skusCriticos.length} SKUs en stock crítico requieren
            atención.
          </Text>
        </View>

        <View style={styles.bannerStat}>
          <Text style={[tipografia.subtitulo, { color: "#9ab5ff" }]}>
            {analitica.entregados}/{analitica.total}
          </Text>
          <Text style={[tipografia.caption, { color: "#c4cdd8" }]}>
            entregados hoy
          </Text>
        </View>
      </View>

      {/* 4 Métricas reales */}
      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Ventas netas"
          valor={formatearCLP(analitica.ventasNetas)}
          subtitulo="Acumulado sesión"
          icono="trending-up"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Pedidos"
          valor={analitica.total}
          subtitulo={`${analitica.activos} en curso`}
          icono="package"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Ticket promedio"
          valor={formatearCLP(analitica.ticketPromedio)}
          subtitulo="CLP c/ envío"
          icono="receipt"
          tono="exito"
        />
        <TarjetaMetrica
          etiqueta="Stock crítico"
          valor={analitica.skusCriticos.length}
          subtitulo={`SKUs ≤ ${STOCK_CRITICO_MAX} un.`}
          icono="triangle-alert"
          tono={analitica.skusCriticos.length > 0 ? "advertencia" : "exito"}
        />
      </View>

      {/* Gráficos puros RN: Distribución por estado + Mix de categorías */}
      <View style={esAncho ? styles.dosColumnas : styles.unaColumna}>
        <View
          style={[
            styles.panel,
            esAncho && styles.colMayor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Flujo de pedidos por etapa
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              Distribución en vivo ({analitica.total} órdenes)
            </Text>
          </View>

          <View style={styles.barrasEtapa}>
            {FLUJO_ESTADOS.map((est) => {
              const count = analitica.porEstado[est];
              const pct =
                analitica.total > 0
                  ? Math.round((count / analitica.total) * 100)
                  : 0;
              return (
                <View key={est} style={styles.barraRow}>
                  <View style={styles.barraLabels}>
                    <Text
                      style={[tipografia.caption, { color: colores.tinta }]}
                    >
                      {ETIQUETAS_ESTADO[est]}
                    </Text>
                    <Text
                      style={[
                        tipografia.micro,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {count} ({pct}%)
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.superficieHundida },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: colores.puntoEstado[est],
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View
          style={[
            styles.panel,
            esAncho && styles.colMenor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Mix de categorías
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              {analitica.total > 0
                ? "Unidades en pedidos"
                : "Participación en inventario"}
            </Text>
          </View>

          <View style={styles.barrasEtapa}>
            {analitica.mixCategorias.map((cat, idx) => {
              const coloresCat = [
                colores.acento,
                colores.puntoEstado.entregado,
                colores.puntoEstado.preparando,
                colores.tintaSecundaria,
              ];
              return (
                <View key={cat.categoria} style={styles.mixFila}>
                  <View style={styles.mixIzq}>
                    <View
                      style={[
                        styles.mixDot,
                        { backgroundColor: coloresCat[idx % coloresCat.length] },
                      ]}
                    />
                    <Text
                      style={[tipografia.caption, { color: colores.tinta }]}
                    >
                      {cat.categoria}
                    </Text>
                  </View>
                  <Text
                    style={[
                      tipografia.micro,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {cat.porcentaje}% ({cat.unidades})
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Fila inferior: Pedidos recientes + Stock crítico */}
      <View style={esAncho ? styles.dosColumnas : styles.unaColumna}>
        <View
          style={[
            styles.panel,
            esAncho && styles.colMayor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHeadRow}>
            <View>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                Pedidos recientes
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Últimas órdenes registradas
              </Text>
            </View>
            <Pressable
              onPress={() => onIrVista("pedidos")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: colores.acentoIntenso },
                ]}
              >
                Ver todos →
              </Text>
            </Pressable>
          </View>

          {pedidos.length === 0 ? (
            <View
              style={[
                styles.emptyMini,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Sin pedidos recientes aún. Crea uno o espera órdenes del cliente.
              </Text>
            </View>
          ) : (
            <View style={styles.listaCompacta}>
              {pedidos.slice(0, 4).map((p) => (
                <View
                  key={p.codigo}
                  style={[
                    styles.filaCompacta,
                    {
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <View style={styles.flex}>
                    <Text
                      style={[tipografia.etiqueta, { color: colores.tinta }]}
                      numberOfLines={1}
                    >
                      #{p.codigo} · {p.clienteNombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                      numberOfLines={1}
                    >
                      {p.items[0]?.nombre ?? "Orden"} ·{" "}
                      {formatearCLP(p.totalEstimado)}
                    </Text>
                  </View>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  {p.estado !== "entregado" ? (
                    <Pressable
                      onPress={() => onAvanzar(p.codigo)}
                      accessibilityRole="button"
                      accessibilityLabel={`Avanzar pedido ${p.codigo}`}
                      style={[
                        styles.btnMini,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          backgroundColor: colores.superficie,
                          borderColor: colores.borde,
                          borderRadius: RADIOS.sm,
                        },
                      ]}
                    >
                      <Icon
                        name="arrow-right"
                        size={16}
                        color={colores.acentoIntenso}
                      />
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </View>

        <View
          style={[
            styles.panel,
            esAncho && styles.colMenor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHeadRow}>
            <View>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                Stock crítico
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Requiere reposición
              </Text>
            </View>
            <Pressable
              onPress={() => onIrVista("bodega")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: colores.acentoIntenso },
                ]}
              >
                Ver bodega →
              </Text>
            </Pressable>
          </View>

          <View style={styles.listaCompacta}>
            {analitica.skusCriticos.slice(0, 4).map((sku) => {
              const pct = Math.min(
                100,
                Math.round((sku.stock / Math.max(1, sku.stockInicial)) * 100)
              );
              return (
                <View
                  key={sku.sku}
                  style={[
                    styles.stockCriticoItem,
                    {
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <View style={styles.barraLabels}>
                    <Text
                      style={[tipografia.etiqueta, { color: colores.tinta, flex: 1 }]}
                      numberOfLines={1}
                    >
                      {sku.nombre} ({sku.talla})
                    </Text>
                    <Text
                      style={[
                        tipografia.micro,
                        {
                          color:
                            sku.stock === 0
                              ? colores.error
                              : colores.advertencia,
                        },
                      ]}
                    >
                      {sku.stock} un.
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.borde },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor:
                            sku.stock === 0
                              ? colores.error
                              : colores.puntoEstado.preparando,
                        },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

// ─── 2. ADMIN: BODEGA / INVENTARIO (Imagen 6) ─────────────────────

export function AdminBodegaView({
  analitica,
  busqueda,
  onReponer,
}: {
  analitica: AnaliticaOperacion;
  busqueda: string;
  onReponer: (sku: string, cantidad: number) => void;
}) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const [filtro, setFiltro] = useState<"todos" | "critico" | "saludable">(
    "todos"
  );

  const items = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return analitica.inventarioPlano.filter((item) => {
      if (filtro === "critico" && item.stock > STOCK_CRITICO_MAX) return false;
      if (filtro === "saludable" && item.stock <= STOCK_CRITICO_MAX)
        return false;
      if (!q) return true;
      return (
        item.nombre.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.categoria.toLowerCase().includes(q)
      );
    });
  }, [analitica.inventarioPlano, filtro, busqueda]);

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}>
            OPERACIÓN / INVENTARIO
          </Text>
          <Text accessibilityRole="header" style={[tipografia.display, { color: colores.tinta }]}>
            La <Text style={{ color: colores.acentoIntenso }}>bodega.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Controla el stock disponible por talla SKU y repone unidades en
            vivo.
          </Text>
        </View>
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Unidades totales"
          valor={analitica.stockTotalUnidades}
          subtitulo="Disponibles para despacho"
          icono="layers"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="SKUs activos"
          valor={analitica.skusActivosCount}
          subtitulo="Variantes registradas"
          icono="tag"
          tono="neutro"
        />
        <TarjetaMetrica
          etiqueta="Alertas críticas"
          valor={analitica.skusCriticos.length}
          subtitulo={`≤ ${STOCK_CRITICO_MAX} unidades`}
          icono="triangle-alert"
          tono="advertencia"
        />
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.panelHeadRow}>
          <View>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Inventario actual
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              Sincronizado con cada pedido creado
            </Text>
          </View>
          <View style={styles.chipsWrap}>
            {(
              [
                { id: "todos", label: `Todos (${analitica.inventarioPlano.length})` },
                { id: "critico", label: `Crítico (${analitica.skusCriticos.length})` },
                { id: "saludable", label: "Saludable" },
              ] as const
            ).map((op) => {
              const act = filtro === op.id;
              return (
                <Pressable
                  key={op.id}
                  onPress={() => setFiltro(op.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: act }}
                  style={[
                    styles.chipFiltro,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: act
                        ? colores.acentoSuave
                        : colores.superficieHundida,
                      borderColor: act ? colores.acento : colores.borde,
                      borderRadius: RADIOS.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.caption,
                      {
                        color: act
                          ? colores.acentoIntenso
                          : colores.tintaSecundaria,
                        fontFamily: act ? FUENTES.semi : FUENTES.medio,
                      },
                    ]}
                  >
                    {op.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.listaCompacta}>
          {items.map((sku) => {
            const agotado = sku.stock === 0;
            const critico = sku.stock > 0 && sku.stock <= STOCK_CRITICO_MAX;
            const pct = Math.min(
              100,
              Math.round((sku.stock / Math.max(1, sku.stockInicial)) * 100)
            );
            return (
              <View
                key={sku.sku}
                style={[
                  styles.skuRow,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.skuInfo}>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {sku.nombre}
                  </Text>
                  <Text
                    style={[tipografia.micro, { color: colores.tintaSecundaria }]}
                  >
                    {sku.sku} · Talla {sku.talla} · {formatearCLP(sku.precio)}
                  </Text>
                  <View
                    style={[
                      styles.progressTrack,
                      { backgroundColor: colores.borde, marginTop: 4 },
                    ]}
                  >
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: agotado
                            ? colores.error
                            : critico
                              ? colores.puntoEstado.preparando
                              : colores.puntoEstado.entregado,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.skuControles}>
                  <View
                    style={[
                      styles.pillEstadoSku,
                      {
                        backgroundColor: agotado
                          ? colores.errorSuave
                          : critico
                            ? colores.advertenciaSuave
                            : colores.exitoSuave,
                        borderRadius: RADIOS.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tipografia.micro,
                        {
                          color: agotado
                            ? colores.error
                            : critico
                              ? colores.advertencia
                              : colores.exito,
                        },
                      ]}
                    >
                      {agotado
                        ? "AGOTADO"
                        : critico
                          ? `CRÍTICO (${sku.stock})`
                          : `SALUDABLE (${sku.stock})`}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onReponer(sku.sku, 5)}
                    accessibilityRole="button"
                    accessibilityLabel={`Ingresar 5 unidades a ${sku.nombre} talla ${sku.talla}`}
                    style={[
                      styles.btnReponer,
                      {
                        minHeight: puntoMinimo,
                        backgroundColor: colores.superficie,
                        borderColor: colores.bordeFuerte,
                        borderRadius: RADIOS.sm,
                      },
                    ]}
                  >
                    <Icon name="plus" size={14} color={colores.acentoIntenso} />
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.acentoIntenso, fontFamily: FUENTES.semi },
                      ]}
                    >
                      5 un.
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

// ─── 3. ADMIN: DESPACHOS (Imagen 8) ───────────────────────────────

export function AdminDespachosView({
  pedidos,
  analitica,
  onNuevoPedido,
  onAvanzar,
}: {
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onNuevoPedido: () => void;
  onAvanzar: (codigo: string) => void;
}) {
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const [courierFiltro, setCourierFiltro] = useState<"Todos" | Transportista>(
    "Todos"
  );

  const lista = useMemo(() => {
    if (courierFiltro === "Todos") return pedidos;
    return pedidos.filter((p) => {
      if (p.transportista) return p.transportista === courierFiltro;
      return p.metodoEnvio.toLowerCase().includes(courierFiltro.toLowerCase());
    });
  }, [pedidos, courierFiltro]);

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}>
            OPERACIÓN / LOGÍSTICA
          </Text>
          <Text accessibilityRole="header" style={[tipografia.display, { color: colores.tinta }]}>
            Los <Text style={{ color: colores.acentoIntenso }}>despachos.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Control por transportista de cada salida desde bodega RM.
          </Text>
        </View>
        <Boton
          etiqueta="Crear despacho"
          icono="send"
          onPress={onNuevoPedido}
        />
      </View>

      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="Por preparar"
          valor={analitica.porEstado.recibido + analitica.porEstado.preparando}
          subtitulo="Confirmado + preparando"
          icono="package"
          tono="advertencia"
        />
        <TarjetaMetrica
          etiqueta="En ruta"
          valor={analitica.porEstado.listo}
          subtitulo="Con transportista"
          icono="truck"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Entregados"
          valor={analitica.entregados}
          subtitulo="Completados"
          icono="circle-check"
          tono="exito"
        />
        <TarjetaMetrica
          etiqueta="Total activos"
          valor={analitica.activos}
          subtitulo="En operación"
          icono="activity"
          tono="neutro"
        />
      </View>

      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.panelHeadRow}>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Control de despachos
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsWrap}
          >
            {(["Todos", ...TRANSPORTISTAS.map((t) => t.id)] as const).map(
              (c) => {
                const act = courierFiltro === c;
                return (
                  <Pressable
                    key={c}
                    onPress={() => setCourierFiltro(c)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: act }}
                    style={[
                      styles.chipFiltro,
                      {
                        minHeight: puntoMinimo,
                        backgroundColor: act
                          ? colores.acentoSuave
                          : colores.superficieHundida,
                        borderColor: act ? colores.acento : colores.borde,
                        borderRadius: RADIOS.pill,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        tipografia.caption,
                        {
                          color: act
                            ? colores.acentoIntenso
                            : colores.tintaSecundaria,
                          fontFamily: act ? FUENTES.semi : FUENTES.medio,
                        },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                );
              }
            )}
          </ScrollView>
        </View>

        {lista.length === 0 ? (
          <View
            style={[
              styles.emptyMini,
              {
                backgroundColor: colores.superficieHundida,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              No hay despachos para el filtro seleccionado.
            </Text>
          </View>
        ) : (
          <View style={styles.listaCompacta}>
            {lista.map((p) => (
              <View
                key={p.codigo}
                style={[
                  styles.skuRow,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.skuInfo}>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                  >
                    #{p.codigo} · {p.clienteNombre}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {p.comuna} · {p.metodoEnvio}
                  </Text>
                </View>

                <View style={styles.skuControles}>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  {p.estado !== "entregado" ? (
                    <Boton
                      etiqueta="Avanzar"
                      iconoDerecha="arrow-right"
                      compacto
                      onPress={() => onAvanzar(p.codigo)}
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── 4. ADMIN: SEGUIMIENTO EN VIVO (Imagen 9) ─────────────────────

export function AdminSeguimientoView({
  pedidos,
  analitica,
  onRefrescar,
  onAvanzar,
}: {
  pedidos: Pedido[];
  analitica: AnaliticaOperacion;
  onRefrescar: () => void;
  onAvanzar: (codigo: string) => void;
}) {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo } = useTema();

  const enTransito = useMemo(
    () =>
      pedidos.filter(
        (p) => p.estado === "preparando" || p.estado === "listo"
      ),
    [pedidos]
  );

  const tasaEntrega =
    analitica.total > 0
      ? Math.round((analitica.entregados / analitica.total) * 100)
      : 0;

  return (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}>
            OPERACIÓN / MONITOREO
          </Text>
          <Text accessibilityRole="header" style={[tipografia.display, { color: colores.tinta }]}>
            Seguimiento{" "}
            <Text style={{ color: colores.acentoIntenso }}>en vivo.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Monitorea pedidos activos y concentración de entregas por comuna RM.
          </Text>
        </View>
        <Boton
          etiqueta="Actualizar"
          icono="refresh-cw"
          variante="secundario"
          onPress={onRefrescar}
        />
      </View>

      <View style={esAncho ? styles.dosColumnas : styles.unaColumna}>
        <View
          style={[
            styles.panel,
            esAncho && styles.colMayor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHeadRow}>
            <View>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                Pedidos en tránsito
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                {enTransito.length} despachos en preparación o ruta
              </Text>
            </View>
            <View
              style={[
                styles.liveBadge,
                {
                  backgroundColor: colores.acentoSuave,
                  borderRadius: RADIOS.pill,
                },
              ]}
            >
              <View
                style={[
                  styles.mixDot,
                  { backgroundColor: colores.acentoIntenso },
                ]}
              />
              <Text style={[tipografia.micro, { color: colores.acentoIntenso }]}>
                LIVE
              </Text>
            </View>
          </View>

          {enTransito.length === 0 ? (
            <View
              style={[
                styles.emptyMini,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
                Sin despachos en tránsito en este momento.
              </Text>
            </View>
          ) : (
            <View style={styles.listaCompacta}>
              {enTransito.map((p) => (
                <View
                  key={p.codigo}
                  style={[
                    styles.skuRow,
                    {
                      backgroundColor: colores.superficieHundida,
                      borderColor: colores.borde,
                      borderRadius: RADIOS.md,
                    },
                  ]}
                >
                  <View style={styles.skuInfo}>
                    <Text
                      style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                    >
                      #{p.codigo} · {p.items[0]?.nombre ?? p.clienteNombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {p.metodoEnvio} · {p.comuna}
                    </Text>
                  </View>
                  <Boton
                    etiqueta={
                      p.estado === "preparando"
                        ? "Despachar"
                        : "Marcar entregado"
                    }
                    compacto
                    onPress={() => onAvanzar(p.codigo)}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        <View
          style={[
            styles.panel,
            esAncho && styles.colMenor,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.lg,
            },
            sombraTarjeta(modo),
          ]}
        >
          <View style={styles.panelHead}>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Rendimiento logístico
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              Tasa de entregas completadas
            </Text>
          </View>

          <View style={styles.rendimientoBox}>
            <Text style={[tipografia.metrica, { color: colores.tinta }]}>
              {tasaEntrega}%
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              {analitica.entregados} completadas de {analitica.total} órdenes
            </Text>
            <View
              style={[
                styles.progressTrack,
                {
                  backgroundColor: colores.superficieHundida,
                  height: 10,
                  marginTop: ESPACIOS.sm,
                },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${tasaEntrega}%`,
                    backgroundColor: colores.puntoEstado.entregado,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Mapa de actividad por comuna RM */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: colores.borde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View style={styles.panelHead}>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Concentración por comuna (RM)
          </Text>
          <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
            Distribución geográfica en vivo de las órdenes creadas
          </Text>
        </View>

        {analitica.porComuna.length === 0 ? (
          <View
            style={[
              styles.emptyMini,
              {
                backgroundColor: colores.superficieHundida,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Icon name="map" size={20} color={colores.tintaTerciaria} />
            <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
              Cuando ingresen pedidos verás aquí las comunas con mayor demanda.
            </Text>
          </View>
        ) : (
          <View style={styles.barrasEtapa}>
            {analitica.porComuna.map((c) => (
              <View key={c.comuna} style={styles.barraRow}>
                <View style={styles.barraLabels}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {c.comuna}
                  </Text>
                  <Text
                    style={[tipografia.micro, { color: colores.tintaSecundaria }]}
                  >
                    {c.cantidad} pedido(s) · {c.porcentaje}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.progressTrack,
                    { backgroundColor: colores.superficieHundida },
                  ]}
                >
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${c.porcentaje}%`,
                        backgroundColor: colores.acento,
                      },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
  seccionStack: { gap: ESPACIOS.lg },
  pageHead: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  pageHeadLeft: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  adminBanner: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  bannerTextos: {
    flex: 1,
    minWidth: 220,
    gap: 4,
  },
  bannerStat: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: ESPACIOS.sm,
    borderRadius: RADIOS.md,
    backgroundColor: "rgba(62, 111, 246, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.35)",
    alignItems: "center",
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  dosColumnas: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.lg,
  },
  unaColumna: {
    gap: ESPACIOS.lg,
  },
  colMayor: { flex: 1.35, minWidth: 0 },
  colMenor: { flex: 0.9, minWidth: 0 },
  panel: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  panelHead: { gap: 2 },
  panelHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  barrasEtapa: { gap: ESPACIOS.md },
  barraRow: { gap: 6 },
  barraLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  mixFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  mixIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  mixDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  listaCompacta: { gap: ESPACIOS.sm },
  filaCompacta: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  btnMini: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  emptyMini: {
    padding: ESPACIOS.lg,
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  stockCriticoItem: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: 6,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  chipFiltro: {
    justifyContent: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  skuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  skuInfo: {
    flex: 1,
    minWidth: 180,
    gap: 3,
  },
  skuControles: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  pillEstadoSku: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: 5,
  },
  btnReponer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: 5,
  },
  rendimientoBox: {
    paddingTop: ESPACIOS.sm,
    gap: 4,
  },
});
