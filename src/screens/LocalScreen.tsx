// ─── Portal ADMIN / BODEGA: Atelier Noir (Operaciones) ─────────────
//
// Conecta `PortalShell` + `AdminSubvistas` (`Resumen`, `Bodega`,
// `Despachos`, `Seguimiento`) + vista `Pedidos` con inventario real SKU
// de `operacionesMock` y enlace directo a `/nuevo-pedido` (rol `admin`).

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";

import {
  AdminBodegaView,
  AdminDespachosView,
  AdminResumenView,
  AdminSeguimientoView,
} from "../components/AdminSubvistas";
import { AvisoFlotante, TonoAviso } from "../components/AvisoFlotante";
import { Boton } from "../components/Boton";
import { CampoTexto } from "../components/CampoTexto";
import { EstadoUIRenderer } from "../components/EstadoUIRenderer";
import { Icon } from "../components/Icon";
import { Masthead } from "../components/Masthead";
import { PedidoCard } from "../components/PedidoCard";
import { PortalNavItem, PortalShell } from "../components/PortalShell";
import { TarjetaMetrica } from "../components/TarjetaMetrica";
import { useAuth } from "../context/AuthContext";
import { usePedidos } from "../context/PedidosContext";
import { usePedidoPolling } from "../hooks/usePedidoPolling";
import { ADMIN_DEMO } from "../services/authLocal";
import { vaciarPedidos } from "../services/pedidosApi";
import { useTema } from "../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS, RADIOS, sombraTarjeta } from "../theme/tokens";
import { ItemPedido, Pedido } from "../types/pedido";

type VistaAdmin =
  | "resumen"
  | "bodega"
  | "pedidos"
  | "despachos"
  | "seguimiento";

const TALLA_PREDETERMINADA = "M";
const PRECIO_MANUAL = 29990;

interface AvisoAccion {
  titulo: string;
  mensaje: string;
  tono: TonoAviso;
  accion?: { etiqueta: string; icono?: "copy"; onPress: () => void };
}

interface PrendaRapidaSku {
  id: string;
  sku: string;
  nombre: string;
  talla: string;
  color: string;
  precio: number;
  stock: number;
}

export function LocalScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const { sesion } = useAuth();
  const {
    estado,
    pedidos,
    catalogo,
    analitica,
    estadisticas,
    recargar,
    crearOrden,
    avanzar,
    reponerStock,
    refrescando,
  } = usePedidos();

  const esAdmin = sesion?.rol === "admin";
  const nombreUsuario =
    sesion?.usuario === ADMIN_DEMO.usuario
      ? ADMIN_DEMO.nombreVisible
      : (sesion?.usuario ?? "Operador Bodega");
  const rolUsuario = esAdmin ? ADMIN_DEMO.cargo : "Operador / Despachos";
  const inicialesUsuario =
    nombreUsuario
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("") || "OP";

  const [vista, setVista] = useState<VistaAdmin>(
    esAdmin ? "resumen" : "pedidos"
  );
  const vistaActiva: VistaAdmin =
    !esAdmin && (vista === "resumen" || vista === "bodega")
      ? "pedidos"
      : vista;
  const [busquedaGlobal, setBusquedaGlobal] = useState("");

  // ─── Estado del formulario rápido de despacho ──────────────────
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("");
  const [items, setItems] = useState<ItemPedido[]>([]);
  const [itemNombreManual, setItemNombreManual] = useState("");
  const [tallaManual, setTallaManual] = useState(TALLA_PREDETERMINADA);
  const [creando, setCreando] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoAccion | null>(null);
  const scrollFormRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollCatalogoRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollCatalogoX = useRef<number>(0);

  const desplazarCatalogo = useCallback((direccionPaso: "izq" | "der") => {
    const paso = 220;
    const nuevoX =
      direccionPaso === "izq"
        ? Math.max(0, scrollCatalogoX.current - paso)
        : scrollCatalogoX.current + paso;
    scrollCatalogoX.current = nuevoX;
    scrollCatalogoRef.current?.scrollTo({
      x: nuevoX,
      y: 0,
      animated: true,
    });
  }, []);

  // ─── Polling solo mientras la pestaña está enfocada ────────────
  const [enFoco, setEnFoco] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnFoco(true);
      return () => setEnFoco(false);
    }, [])
  );

  usePedidoPolling({
    fetchFn: recargar,
    enabled: enFoco,
    escucharEventos: false,
    intervaloInicial: 8_000,
    intervaloLargo: 25_000,
  });

  React.useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // ─── Catálogo conectado al stock real SKU ──────────────────────
  const catalogoRapido = useMemo<PrendaRapidaSku[]>(
    () =>
      catalogo.map((prod) => {
        const varActiva =
          prod.variantes.find((v) => v.stock > 0) ?? prod.variantes[0];
        return {
          id: prod.id,
          sku: varActiva.sku,
          nombre: prod.nombre,
          talla: varActiva.talla,
          color: prod.color,
          precio: prod.precio,
          stock: varActiva.stock,
        };
      }),
    [catalogo]
  );

  const stockPorSku = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const prod of catalogo) {
      for (const v of prod.variantes) {
        mapa[v.sku] = v.stock;
      }
    }
    return mapa;
  }, [catalogo]);

  const pedidosFiltrados = useMemo(() => {
    const q = busquedaGlobal.trim().toLowerCase();
    if (!q) return pedidos;
    return pedidos.filter(
      (p) =>
        p.codigo.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.comuna.toLowerCase().includes(q) ||
        p.items.some((i) => i.nombre.toLowerCase().includes(q))
    );
  }, [pedidos, busquedaGlobal]);

  const estadoPedidosFiltrados = useMemo(() => {
    if (estado.tipo !== "datos") return estado;
    if (pedidosFiltrados.length === 0) return { tipo: "vacio" as const };
    return { tipo: "datos" as const, datos: pedidosFiltrados };
  }, [estado, pedidosFiltrados]);

  const totalEstimado = useMemo(
    () =>
      items.reduce(
        (acumulado, item) =>
          acumulado + (item.precioUnitario ?? PRECIO_MANUAL) * item.cantidad,
        0
      ),
    [items]
  );

  const cantidadPrendas = useMemo(
    () => items.reduce((acumulado, item) => acumulado + item.cantidad, 0),
    [items]
  );

  const formatearPrecio = (valor: number) => "$" + valor.toLocaleString("es-CL");

  // ─── Agregar prenda del catálogo real (con SKU y límite stock) ──
  const agregarPrendaCatalogo = (cat: PrendaRapidaSku) => {
    if (cat.stock <= 0) {
      setErrorItems(`${cat.nombre} (${cat.talla}) sin stock disponible.`);
      return;
    }

    const actualEnCarrito =
      items.find((it) => it.sku === cat.sku)?.cantidad ?? 0;
    if (actualEnCarrito >= cat.stock) {
      setErrorItems(
        `Stock máximo alcanzado para ${cat.nombre} (${cat.stock} un.).`
      );
      return;
    }

    setItems((previos) => {
      const indice = previos.findIndex((item) => item.sku === cat.sku);
      if (indice >= 0) {
        if (previos[indice].cantidad >= cat.stock) return previos;
        const copia = [...previos];
        copia[indice] = {
          ...copia[indice],
          cantidad: copia[indice].cantidad + 1,
        };
        return copia;
      }
      return [
        ...previos,
        {
          sku: cat.sku,
          nombre: cat.nombre,
          cantidad: 1,
          talla: cat.talla,
          color: cat.color,
          precioUnitario: cat.precio,
        },
      ];
    });
    setErrorItems(null);
  };

  const agregarItemManual = () => {
    const texto = itemNombreManual.trim();
    if (!texto) return;

    setItems((previos) => [
      ...previos,
      {
        nombre: texto,
        cantidad: 1,
        talla: tallaManual,
        color: "Estándar",
        precioUnitario: PRECIO_MANUAL,
      },
    ]);
    setItemNombreManual("");
    setErrorItems(null);
  };

  const cambiarCantidad = (indice: number, delta: number) => {
    const item = items[indice];
    if (!item) return;
    if (delta > 0 && item.sku) {
      const maxStock = stockPorSku[item.sku] ?? 0;
      if (item.cantidad + delta > maxStock) {
        setErrorItems(
          `Stock disponible para ${item.nombre}: ${maxStock} un.`
        );
        return;
      }
    }

    setItems((previos) =>
      previos
        .map((it, i) =>
          i === indice
            ? { ...it, cantidad: Math.max(1, it.cantidad + delta) }
            : it
        )
        .filter((it) => it.cantidad > 0)
    );
    setErrorItems(null);
  };

  const eliminarItem = (indice: number) => {
    setItems((previos) => previos.filter((_, i) => i !== indice));
  };

  // ─── Crear Pedido rápido (POST /v1/pedidos) ───────────────────
  const handleCrearPedido = useCallback(async () => {
    if (!nombre.trim()) {
      setErrorNombre("Ingresa el nombre de quien recibe el pedido.");
      return;
    }
    if (items.length === 0) {
      setErrorItems("Agrega al menos una prenda al paquete.");
      return;
    }

    setErrorNombre(null);
    setErrorItems(null);
    setCreando(true);
    try {
      const resultado = await crearOrden(
        nombre,
        direccion || "Av. Providencia 1240, Dpto 502",
        comuna,
        items
      );

      if (!resultado.ok) {
        setAviso({
          titulo: "No se pudo crear la orden",
          mensaje: resultado.mensaje ?? "Error desconocido al guardar.",
          tono: "error",
        });
        return;
      }

      const codigo = resultado.codigo ?? "";
      setNombre("");
      setDireccion("");
      setComuna("");
      setItems([]);
      setAviso({
        titulo: `Orden #${codigo} creada`,
        mensaje: "Ya está visible para el cliente en el rastreo.",
        tono: "exito",
        accion: {
          etiqueta: "Copiar",
          icono: "copy",
          onPress: () => {
            Clipboard.setStringAsync(codigo).catch(() => { });
            setAviso((previo) =>
              previo
                ? {
                    ...previo,
                    accion: undefined,
                    mensaje: "Código copiado al portapapeles.",
                  }
                : previo
            );
          },
        },
      });
    } finally {
      setCreando(false);
    }
  }, [nombre, direccion, comuna, items, crearOrden]);

  // ─── Avanzar Estado de Despacho ────────────────────────────────
  const handleAvanzarEstado = useCallback(
    async (codigo: string) => {
      const resultado = await avanzar(codigo);
      if (!resultado.ok) {
        setAviso({
          titulo: "No se pudo actualizar",
          mensaje: resultado.mensaje ?? "Error de red al actualizar el estado.",
          tono: "error",
        });
      }
    },
    [avanzar]
  );

  const handleCopiarCodigo = useCallback(async (codigo: string) => {
    await Clipboard.setStringAsync(codigo).catch(() => { });
    setAviso({
      titulo: `Código #${codigo} copiado`,
      mensaje: "Pégalo en el chat con el cliente.",
      tono: "info",
    });
  }, []);

  const handleVaciarOrdenes = useCallback(async () => {
    await vaciarPedidos();
    await recargar();
    setAviso({
      titulo: "Lista de pedidos vaciada",
      mensaje: "Se eliminaron todas las órdenes registradas.",
      tono: "info",
    });
  }, [recargar]);

  const handleReponerStock = useCallback(
    (sku: string, cantidad: number) => {
      const nuevo = reponerStock(sku, cantidad);
      if (nuevo !== null) {
        setAviso({
          titulo: `Stock actualizado (${sku})`,
          mensaje: `Ahora hay ${nuevo} unidad(es) disponibles en bodega.`,
          tono: "exito",
        });
      }
    },
    [reponerStock]
  );

  const irANuevoPedido = useCallback(() => {
    router.push("/nuevo-pedido");
  }, []);

  const navItems: PortalNavItem[] = useMemo(
    () =>
      esAdmin
        ? [
            { id: "resumen", etiqueta: "Resumen", icono: "layout-grid" },
            {
              id: "bodega",
              etiqueta: "Bodega",
              icono: "layers",
              badge: analitica.skusCriticos.length,
            },
            {
              id: "pedidos",
              etiqueta: "Pedidos",
              icono: "package",
              badge: estadisticas.activos,
            },
            { id: "despachos", etiqueta: "Despachos", icono: "truck" },
            { id: "seguimiento", etiqueta: "Seguimiento", icono: "map" },
          ]
        : [
            {
              id: "pedidos",
              etiqueta: "Pedidos",
              icono: "package",
              badge: estadisticas.activos,
            },
            { id: "despachos", etiqueta: "Despachos", icono: "truck" },
            { id: "seguimiento", etiqueta: "Seguimiento", icono: "map" },
          ],
    [esAdmin, analitica.skusCriticos.length, estadisticas.activos]
  );

  // ─── Subvista Pedidos (órdenes en curso + formulario rápido) ──
  const resumenMetricas = (
    <View style={styles.metricasGrid}>
      <TarjetaMetrica
        etiqueta="Órdenes"
        valor={estadisticas.total}
        subtitulo="Registradas en turno"
        icono="package"
        tono="acento"
      />
      <TarjetaMetrica
        etiqueta="En curso"
        valor={estadisticas.activos}
        subtitulo="Pendientes de entrega"
        icono="truck"
        tono="advertencia"
      />
      <TarjetaMetrica
        etiqueta="Entregadas"
        valor={estadisticas.entregados}
        subtitulo="Completadas"
        icono="circle-check"
        tono="exito"
      />
    </View>
  );

  const formulario = (
    <View
      style={[
        styles.tarjetaFormulario,
        {
          backgroundColor: colores.superficie,
          borderColor: colores.borde,
          borderRadius: RADIOS.lg,
        },
        sombraTarjeta(modo),
      ]}
    >
      <View
        style={[
          styles.badgeSeccion,
          { backgroundColor: colores.acentoSuave, borderRadius: RADIOS.pill },
        ]}
      >
        <Text style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}>
          DESPACHO RÁPIDO
        </Text>
      </View>

      <Text
        style={[
          tipografia.tituloDashboard,
          styles.tituloSeccion,
          { color: colores.tinta },
        ]}
      >
        Crear orden rápida
      </Text>

      <CampoTexto
        etiqueta="Cliente / Comprador"
        valor={nombre}
        onCambio={(texto) => {
          setNombre(texto);
          if (errorNombre) setErrorNombre(null);
        }}
        placeholder="Ej: Camila Silva"
        icono="user"
        error={errorNombre}
        autoCapitalize="words"
      />

      <CampoTexto
        etiqueta="Dirección de envío"
        valor={direccion}
        onCambio={setDireccion}
        placeholder="Ej: Av. Providencia 1450, Dpto 802"
        icono="map-pin"
        autoCapitalize="words"
      />

      <CampoTexto
        etiqueta="Comuna / Ciudad"
        valor={comuna}
        onCambio={setComuna}
        placeholder="Ej: Providencia, Santiago"
        icono="map-pin"
        autoCapitalize="words"
      />

      <View style={styles.catalogoHeader}>
        <Text
          style={[
            tipografia.eyebrowMono,
            { color: colores.tintaTerciaria },
          ]}
        >
          PRENDAS EN STOCK (SKU)
        </Text>
        <View style={styles.catalogoFlechas}>
          <Pressable
            onPress={() => desplazarCatalogo("izq")}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la izquierda"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor: colores.borde,
                backgroundColor: colores.superficieHundida,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Icon name="chevron-left" size={18} color={colores.tinta} />
          </Pressable>
          <Pressable
            onPress={() => desplazarCatalogo("der")}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la derecha"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                minWidth: puntoMinimo,
                minHeight: puntoMinimo,
                borderColor: colores.borde,
                backgroundColor: colores.superficieHundida,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <Icon name="chevron-right" size={18} color={colores.tinta} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        ref={scrollCatalogoRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catalogoFila}
        onScroll={(e) => {
          scrollCatalogoX.current = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
      >
        {catalogoRapido.map((cat) => {
          const agotado = cat.stock <= 0;
          return (
            <Pressable
              key={cat.sku}
              onPress={() => agregarPrendaCatalogo(cat)}
              disabled={agotado}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${cat.nombre}`}
              style={({ pressed }) => [
                styles.prendaRapida,
                {
                  backgroundColor: colores.superficieHundida,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.md,
                  opacity: agotado ? 0.5 : pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={styles.prendaRapidaTop}>
                <View
                  style={[
                    styles.prendaTag,
                    {
                      backgroundColor: colores.acentoSuave,
                      borderRadius: RADIOS.pill,
                    },
                  ]}
                >
                  <Icon
                    name={agotado ? "x" : "plus"}
                    size={13}
                    color={colores.acentoIntenso}
                  />
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.acentoIntenso },
                    ]}
                  >
                    {agotado ? "Agotado" : `${cat.talla} (${cat.stock})`}
                  </Text>
                </View>
                <Text style={[tipografia.micro, { color: colores.tinta }]}>
                  {formatearPrecio(cat.precio)}
                </Text>
              </View>
              <Text
                style={[
                  tipografia.cuerpoFuerte,
                  styles.prendaRapidaNombre,
                  { color: colores.tinta },
                ]}
                numberOfLines={2}
              >
                {cat.nombre}
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
                numberOfLines={1}
              >
                {cat.color} · {cat.sku}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.filaManual}>
        <View style={styles.filaManualCampo}>
          <CampoTexto
            etiqueta="Otra prenda"
            valor={itemNombreManual}
            onCambio={setItemNombreManual}
            placeholder="Escribe el nombre de la prenda"
            icono="shirt"
            autoCapitalize="sentences"
          />
        </View>
        <View style={styles.filaManualTalla}>
          <CampoTexto
            etiqueta="Talla"
            valor={tallaManual}
            onCambio={setTallaManual}
            placeholder="M"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
      </View>
      <Boton
        etiqueta="Agregar prenda personalizada"
        icono="plus"
        variante="secundario"
        onPress={agregarItemManual}
        anchoCompleto
        style={styles.botonAgregarManual}
      />

      <View
        style={[
          styles.panelPrendas,
          {
            backgroundColor: colores.superficieHundida,
            borderRadius: RADIOS.md,
            borderColor: errorItems ? colores.error : colores.borde,
          },
        ]}
      >
        <View style={styles.panelPrendasEncabezado}>
          <Text
            style={[
              tipografia.eyebrowMono,
              { color: colores.tintaSecundaria },
            ]}
          >
            PAQUETE ({cantidadPrendas}
            {prendasPlural(cantidadPrendas)})
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            {formatearPrecio(totalEstimado)}
          </Text>
        </View>

        {items.length === 0 ? (
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            El paquete está vacío. Agrega prendas desde el catálogo o a mano.
          </Text>
        ) : null}

        {items.map((item, indice) => (
          <View
            key={`${item.sku ?? item.nombre}-${indice}`}
            style={[
              styles.prendaItemTarjeta,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.sm,
              },
            ]}
          >
            <View style={styles.prendaItemTexto}>
              <Text
                style={[tipografia.etiqueta, { color: colores.tinta }]}
                numberOfLines={1}
              >
                {item.nombre}
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                {[item.talla ? `Talla ${item.talla}` : null, item.color]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            <View style={styles.stepper}>
              <Pressable
                onPress={() => cambiarCantidad(indice, -1)}
                accessibilityRole="button"
                accessibilityLabel={`Quitar una unidad de ${item.nombre}`}
                style={({ pressed }) => [
                  styles.stepperBoton,
                  {
                    minWidth: puntoMinimo,
                    minHeight: puntoMinimo,
                    borderColor: colores.borde,
                    backgroundColor: colores.superficieHundida,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Icon name="minus" size={15} color={colores.tinta} />
              </Pressable>

              <Text
                style={[
                  tipografia.micro,
                  styles.stepperCantidad,
                  { color: colores.tinta },
                ]}
              >
                {item.cantidad}
              </Text>

              <Pressable
                onPress={() => cambiarCantidad(indice, 1)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar una unidad de ${item.nombre}`}
                style={({ pressed }) => [
                  styles.stepperBoton,
                  {
                    minWidth: puntoMinimo,
                    minHeight: puntoMinimo,
                    borderColor: colores.borde,
                    backgroundColor: colores.superficieHundida,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Icon name="plus" size={15} color={colores.tinta} />
              </Pressable>

              <Pressable
                onPress={() => eliminarItem(indice)}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar ${item.nombre} del paquete`}
                style={({ pressed }) => [
                  styles.eliminarItem,
                  {
                    minWidth: puntoMinimo,
                    minHeight: puntoMinimo,
                    opacity: pressed ? 0.65 : 1,
                  },
                ]}
              >
                <Icon name="trash-2" size={16} color={colores.error} />
              </Pressable>
            </View>
          </View>
        ))}

        {errorItems ? (
          <View style={styles.errorFila}>
            <Icon name="circle-alert" size={14} color={colores.error} />
            <Text
              accessibilityRole="alert"
              style={[tipografia.caption, { color: colores.error, flex: 1 }]}
            >
              {errorItems}
            </Text>
          </View>
        ) : null}
      </View>

      <Boton
        etiqueta={creando ? "Generando orden…" : "Crear orden de despacho"}
        icono="package-check"
        onPress={handleCrearPedido}
        cargando={creando}
        anchoCompleto
        style={styles.botonCrear}
        accessibilityHint="Registra la orden y la publica para el cliente"
      />
    </View>
  );

  const encabezadoLista = (
    <View style={styles.listaEncabezado}>
      <Masthead
        eyebrow="Monitor de courier"
        titulo="Órdenes de envío"
        variante="tecnico"
        descripcion={
          estadisticas.total === 0
            ? "Sin órdenes activas en este momento."
            : `${estadisticas.activos} en ruta · ${estadisticas.entregados} entregadas de ${estadisticas.total} órdenes.`
        }
        acciones={
          <>
            {esAdmin && estadisticas.total > 0 ? (
              <Pressable
                onPress={handleVaciarOrdenes}
                accessibilityRole="button"
                accessibilityLabel="Vaciar las órdenes registradas"
                style={({ pressed }) => [
                  styles.botonIcono,
                  {
                    minWidth: puntoMinimo,
                    minHeight: puntoMinimo,
                    borderColor: colores.borde,
                    backgroundColor: colores.superficie,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Icon
                  name="rotate-ccw"
                  size={17}
                  color={colores.tintaSecundaria}
                />
              </Pressable>
            ) : null}
            {esAdmin ? (
              <Boton
                etiqueta="+ Nuevo pedido"
                compacto
                onPress={irANuevoPedido}
              />
            ) : null}
          </>
        }
      />
    </View>
  );

  const listaPedidos = (
    <EstadoUIRenderer
      estado={estadoPedidosFiltrados}
      mensajeVacio={
        busquedaGlobal.trim()
          ? `Sin órdenes para "${busquedaGlobal.trim()}".`
          : "No hay despachos registrados. Crea una orden para comenzar."
      }
      accionVacia={
        busquedaGlobal.trim()
          ? {
              etiqueta: "Limpiar búsqueda",
              onPress: () => setBusquedaGlobal(""),
            }
          : {
              etiqueta: esAdmin ? "Nuevo pedido completo" : "Crear la primera orden",
              onPress: esAdmin
                ? irANuevoPedido
                : () => scrollFormRef.current?.scrollTo({ y: 0, animated: true }),
            }
      }
      onReintentar={recargar}
      renderDatos={(datos: Pedido[]) => (
        <View style={styles.tarjetasLista}>
          {datos.map((pedido) => (
            <PedidoCard
              key={pedido.codigo}
              pedido={pedido}
              onAvanzarEstado={handleAvanzarEstado}
              onCopiarCodigo={handleCopiarCodigo}
            />
          ))}
          {refrescando ? (
            <Text
              style={[
                tipografia.caption,
                styles.actualizando,
                { color: colores.tintaTerciaria },
              ]}
            >
              Actualizando…
            </Text>
          ) : null}
        </View>
      )}
    />
  );

  const renderPedidos = () => (
    <View style={styles.pedidosWrap}>
      {resumenMetricas}
      {esAncho ? (
        <View style={styles.columnasAncho}>
          <View style={styles.columnaFormulario}>{formulario}</View>
          <View style={styles.columnaLista}>
            {encabezadoLista}
            {listaPedidos}
          </View>
        </View>
      ) : (
        <View style={styles.pedidosMovilStack}>
          {formulario}
          {encabezadoLista}
          {listaPedidos}
        </View>
      )}
    </View>
  );

  return (
    <PortalShell
      rolLabel="Operación"
      usuarioIniciales={inicialesUsuario}
      usuarioNombre={nombreUsuario}
      usuarioRol={rolUsuario}
      items={navItems}
      vistaActiva={vistaActiva}
      onCambiarVista={(id) => setVista(id as VistaAdmin)}
      accionExtra={
        esAdmin
          ? {
              etiqueta: "Nuevo pedido",
              icono: "plus",
              onPress: irANuevoPedido,
            }
          : undefined
      }
      busqueda={busquedaGlobal}
      onCambiarBusqueda={setBusquedaGlobal}
      placeholderBusqueda="Buscar pedido, cliente o SKU…"
      mostrarSalir
    >
      <AvisoFlotante
        visible={aviso !== null}
        tono={aviso?.tono ?? "info"}
        icono={aviso?.tono === "error" ? "triangle-alert" : "circle-check"}
        titulo={aviso?.titulo ?? ""}
        mensaje={aviso?.mensaje ?? ""}
        accion={aviso?.accion}
        onCerrar={() => setAviso(null)}
      />

      <KeyboardAvoidingView
        style={styles.contenedor}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollFormRef}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.contenidoScroll,
            esAncho && styles.contenidoScrollAncho,
          ]}
        >
          <View style={styles.contenidoInner}>
            {vistaActiva === "resumen" ? (
              <AdminResumenView
                nombreAdmin={nombreUsuario}
                pedidos={pedidos}
                analitica={analitica}
                onIrVista={(v) => setVista(v)}
                onNuevoPedido={irANuevoPedido}
                onAvanzar={handleAvanzarEstado}
              />
            ) : vistaActiva === "bodega" ? (
              <AdminBodegaView
                analitica={analitica}
                busqueda={busquedaGlobal}
                onReponer={handleReponerStock}
              />
            ) : vistaActiva === "despachos" ? (
              <AdminDespachosView
                pedidos={pedidos}
                analitica={analitica}
                onNuevoPedido={irANuevoPedido}
                onAvanzar={handleAvanzarEstado}
              />
            ) : vistaActiva === "seguimiento" ? (
              <AdminSeguimientoView
                pedidos={pedidos}
                analitica={analitica}
                onRefrescar={() => void recargar()}
                onAvanzar={handleAvanzarEstado}
              />
            ) : (
              renderPedidos()
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </PortalShell>
  );
}

/** Plural simple: 1 prenda / 2 prendas. */
function prendasPlural(cantidad: number): string {
  return cantidad === 1 ? " prenda" : " prendas";
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  contenidoScroll: {
    flexGrow: 1,
    padding: ESPACIOS.lg,
    paddingBottom: ESPACIOS.xxl * 2,
  },
  contenidoScrollAncho: {
    padding: ESPACIOS.xl,
  },
  contenidoInner: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
  },
  pedidosWrap: {
    gap: ESPACIOS.lg,
  },
  pedidosMovilStack: {
    gap: ESPACIOS.lg,
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  columnasAncho: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.lg,
  },
  columnaFormulario: {
    flex: 1,
    maxWidth: 460,
  },
  columnaLista: {
    flex: 1.15,
    minWidth: 320,
  },
  tarjetaFormulario: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
  },
  badgeSeccion: {
    alignSelf: "flex-start",
    paddingHorizontal: ESPACIOS.sm + 2,
    paddingVertical: ESPACIOS.xs,
    marginBottom: ESPACIOS.sm,
  },
  tituloSeccion: {
    marginBottom: ESPACIOS.lg,
  },
  catalogoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: ESPACIOS.sm,
  },
  catalogoFlechas: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonFlecha: {
    borderRadius: RADIOS.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    userSelect: "none",
  },
  catalogoFila: {
    gap: ESPACIOS.sm,
    paddingBottom: ESPACIOS.md,
  },
  prendaRapida: {
    width: 214,
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.xs + 2,
    cursor: "pointer",
  },
  prendaRapidaTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  prendaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: ESPACIOS.sm,
    paddingVertical: 3,
  },
  prendaRapidaNombre: {
    minHeight: 42,
  },
  filaManual: {
    flexDirection: "row",
    gap: ESPACIOS.md,
  },
  filaManualCampo: {
    flex: 3,
    minWidth: 0,
  },
  filaManualTalla: {
    flex: 1,
    minWidth: 0,
  },
  botonAgregarManual: {
    marginBottom: ESPACIOS.lg,
    marginTop: -ESPACIOS.sm,
  },
  panelPrendas: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
    marginBottom: ESPACIOS.lg,
  },
  panelPrendasEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prendaItemTarjeta: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  prendaItemTexto: {
    gap: 2,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  stepperBoton: {
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  stepperCantidad: {
    minWidth: 22,
    textAlign: "center",
  },
  eliminarItem: {
    marginLeft: "auto",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonCrear: {
    marginTop: ESPACIOS.xs,
  },
  listaEncabezado: {
    marginTop: ESPACIOS.xs,
  },
  botonIcono: {
    borderRadius: RADIOS.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  tarjetasLista: {
    gap: ESPACIOS.md,
  },
  actualizando: {
    textAlign: "center",
    paddingVertical: ESPACIOS.sm,
  },
});
