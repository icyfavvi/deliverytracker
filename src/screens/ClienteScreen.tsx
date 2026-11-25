// ─── Portal CLIENTE Atelier Noir (Prototipo Imágenes 2, 3, 4) ───
//
// Acopla las vistas del prototipo Cliente (Resumen, Mis pedidos,
// Seguimiento) con la lógica real de pedidosApi, polling adaptativo
// (5s primeros 30s -> 30s + cleanup), estados UI discriminados, y carrito
// rápido para que un cliente pueda hacer pedidos reales visibles en Bodega.

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { AvisoFlotante, TonoAviso } from "../components/AvisoFlotante";
import { Boton } from "../components/Boton";
import { CampoTexto } from "../components/CampoTexto";
import { EstadoPedidoBadge } from "../components/EstadoPedidoBadge";
import { EstadoUIRenderer } from "../components/EstadoUIRenderer";
import { Icon } from "../components/Icon";
import { PortalNavItem, PortalShell } from "../components/PortalShell";
import { ProductoCatalogoCard } from "../components/ProductoCatalogoCard";
import { StepperProgreso } from "../components/StepperProgreso";
import { TarjetaMetrica } from "../components/TarjetaMetrica";
import { usePedidos } from "../context/PedidosContext";
import { esEstadoTerminal } from "../hooks/pollingConfig";
import { usePedidoPolling } from "../hooks/usePedidoPolling";
import { useReducirMovimiento } from "../hooks/useReducirMovimiento";
import { COMUNAS_RM } from "../services/operacionesMock";
import { obtenerPedidoPorCodigo } from "../services/pedidosApi";
import { useTema } from "../theme/ThemeProvider";
import {
  BREAKPOINTS,
  ESPACIOS,
  FUENTES,
  RADIOS,
  sombraFlotante,
  sombraTarjeta,
} from "../theme/tokens";
import {
  DESCRIPCIONES_ESTADO,
  ETIQUETAS_ESTADO,
  EstadoPedido,
  EstadoUI,
  FLUJO_ESTADOS,
  ItemPedido,
  Pedido,
  ProductoCatalogoAdmin,
} from "../types/pedido";

type VistaCliente = "resumen" | "mis-pedidos" | "seguimiento";
type FiltroCliente = "todos" | EstadoPedido;

const DURACION_AVISO_MS = 7_000;
const CLAVE_NOMBRE_CLIENTE = "@deliverytracker/cliente_nombre";
const CLAVE_CODIGOS_CLIENTE = "@deliverytracker/cliente_codigos";
const NOMBRE_CLIENTE_DEFAULT = "Martina Soto";

function generarIdempotencyCliente(): string {
  return `cli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

interface AvisoEstado {
  titulo: string;
  mensaje: string;
  tono: TonoAviso;
}

function formatearCLP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

/** Etiqueta legible de una entrada de la bitácora de estados. */
function etiquetaEstadoHistorial(estado: string): string {
  if (estado === "cancelado") return "Cancelado";
  return ETIQUETAS_ESTADO[estado as EstadoPedido] ?? estado;
}

/** Hora local es-CL (HH:MM) de una marca de tiempo ISO. */
function formatearHoraHistorial(fecha: string): string {
  const instante = new Date(fecha);
  if (Number.isNaN(instante.getTime())) return "--:--";
  return instante.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClienteScreen() {
  const { codigo: codigoParam } = useLocalSearchParams<{ codigo?: string }>();
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const reducirMovimiento = useReducirMovimiento();
  const { pedidos, catalogo, analitica, crearOrden, cancelar } = usePedidos();

  const [vista, setVista] = useState<VistaCliente>("seguimiento");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [filtroHistorial, setFiltroHistorial] =
    useState<FiltroCliente>("todos");

  // ─── Seguimiento por código (lógica original intacta) ──────────
  const [codigoInput, setCodigoInput] = useState("");
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoUI<Pedido> | null>({
    tipo: "vacio",
  });
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(
    null
  );
  const [aviso, setAviso] = useState<AvisoEstado | null>(null);
  const [campoEnfocado, setCampoEnfocado] = useState(false);

  const inputRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const estadoAnteriorRef = useRef<{
    codigo: string;
    estado: EstadoPedido;
  } | null>(null);
  const consultaSeqRef = useRef(0);
  const ultimoParamRef = useRef("");

  const [enFoco, setEnFoco] = useState(false);
  useFocusEffect(
    useCallback(() => {
      setEnFoco(true);
      return () => setEnFoco(false);
    }, [])
  );

  // ─── Perfil de Cliente + Códigos propios (privacidad por cliente) ──
  const [nombreCliente, setNombreCliente] = useState(NOMBRE_CLIENTE_DEFAULT);
  const [codigosCliente, setCodigosCliente] = useState<string[]>([]);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  const [nombreEditInput, setNombreEditInput] = useState("");
  const [errorNombreEdit, setErrorNombreEdit] = useState<string | null>(null);

  // ─── Mini carrito / Nuevo pedido directo de Cliente ────────────
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
  const [nombreCompra, setNombreCompra] = useState(NOMBRE_CLIENTE_DEFAULT);
  const [errorNombreCompra, setErrorNombreCompra] = useState<string | null>(null);
  const [errorCarrito, setErrorCarrito] = useState<string | null>(null);
  const [dirCompra, setDirCompra] = useState("Av. Providencia 1450, Dpto 802");
  const [comunaCompra, setComunaCompra] = useState<string>(COMUNAS_RM[0]);
  const [idempotencyCompra, setIdempotencyCompra] = useState(() =>
    generarIdempotencyCliente()
  );
  const [creandoCompra, setCreandoCompra] = useState(false);
  // Talla elegida por producto (por defecto: primera variante con stock).
  const [tallaPorProducto, setTallaPorProducto] = useState<Record<string, string>>(
    {}
  );
  const [cancelando, setCancelando] = useState(false);

  const registrarCodigoPropio = useCallback((codigo: string) => {
    const norm = codigo.trim().toUpperCase();
    if (!norm) return;
    setCodigosCliente((prev) => {
      if (prev.includes(norm)) return prev;
      const siguiente = [norm, ...prev];
      AsyncStorage.setItem(CLAVE_CODIGOS_CLIENTE, JSON.stringify(siguiente)).catch(
        () => { }
      );
      return siguiente;
    });
  }, []);

  useEffect(() => {
    let activo = true;
    Promise.all([
      AsyncStorage.getItem(CLAVE_NOMBRE_CLIENTE),
      AsyncStorage.getItem(CLAVE_CODIGOS_CLIENTE),
    ])
      .then(([guardadoNombre, guardadoCodigos]) => {
        if (!activo) return;
        if (guardadoNombre && guardadoNombre.trim().length >= 2) {
          const limpio = guardadoNombre.trim();
          setNombreCliente(limpio);
          setNombreCompra(limpio);
        }
        if (guardadoCodigos) {
          try {
            const lista = JSON.parse(guardadoCodigos);
            if (Array.isArray(lista)) {
              setCodigosCliente(
                lista.filter((c): c is string => typeof c === "string")
              );
            }
          } catch { }
        }
      })
      .catch(() => { });
    return () => {
      activo = false;
    };
  }, []);

  // Sincronización con query param ?codigo=XXXX mediante efecto (sin setState en render)
  useEffect(() => {
    const paramLimpio =
      typeof codigoParam === "string" ? codigoParam.trim().toUpperCase() : "";
    if (paramLimpio.length === 4 && paramLimpio !== ultimoParamRef.current) {
      ultimoParamRef.current = paramLimpio;
      setVista("seguimiento");
      setCodigoInput(paramLimpio);
      setErrorCodigo(null);
      setEstadoPedido({ tipo: "cargando" });
      setCodigoBuscado(paramLimpio);
      router.setParams({ codigo: undefined });
    } else if (!paramLimpio) {
      ultimoParamRef.current = "";
    }
  }, [codigoParam]);

  const abrirModalNombre = useCallback(() => {
    setNombreEditInput(nombreCliente);
    setErrorNombreEdit(null);
    setModalNombreAbierto(true);
  }, [nombreCliente]);

  const guardarNombreCliente = useCallback(() => {
    const limpio = nombreEditInput.trim();
    if (limpio.length < 2) {
      setErrorNombreEdit("Ingresa al menos 2 caracteres para tu nombre.");
      return;
    }
    setNombreCliente(limpio);
    setNombreCompra(limpio);
    setModalNombreAbierto(false);
    setErrorNombreEdit(null);
    AsyncStorage.setItem(CLAVE_NOMBRE_CLIENTE, limpio).catch(() => { });
    setAviso({
      titulo: "Nombre actualizado",
      mensaje: `Ahora te mostramos como ${limpio}.`,
      tono: "exito",
    });
  }, [nombreEditInput]);

  const primerNombreCliente = useMemo(
    () => nombreCliente.trim().split(/\s+/)[0] || "Cliente",
    [nombreCliente]
  );

  const inicialesCliente = useMemo(() => {
    const partes = nombreCliente.trim().split(/\s+/).filter(Boolean);
    return (
      partes
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase() ?? "")
        .join("") || "CL"
    );
  }, [nombreCliente]);

  const consultarPedido = useCallback(async () => {
    if (!codigoBuscado) return;
    const seq = ++consultaSeqRef.current;

    try {
      const res = await obtenerPedidoPorCodigo(codigoBuscado);
      if (seq !== consultaSeqRef.current) return;

      if (res.status === 404) {
        setEstadoPedido({ tipo: "vacio" });
        if (estadoAnteriorRef.current?.codigo === codigoBuscado) {
          estadoAnteriorRef.current = null;
        }
        return;
      }

      if (!res.ok || !res.data) {
        setEstadoPedido({
          tipo: "error",
          mensaje: `El servidor respondió con un error (${res.status}).`,
        });
        return;
      }

      const pedidoActualizado = res.data;
      registrarCodigoPropio(pedidoActualizado.codigo);

      const previo = estadoAnteriorRef.current;
      if (
        previo !== null &&
        previo.codigo === pedidoActualizado.codigo &&
        previo.estado !== pedidoActualizado.estado
      ) {
        setAviso({
          titulo: "Tu pedido cambió de estado",
          mensaje: DESCRIPCIONES_ESTADO[pedidoActualizado.estado],
          tono: "acento",
        });
      }
      estadoAnteriorRef.current = {
        codigo: pedidoActualizado.codigo,
        estado: pedidoActualizado.estado,
      };
      setUltimaActualizacion(
        new Date().toLocaleTimeString("es-CL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );

      setEstadoPedido({ tipo: "datos", datos: pedidoActualizado });
    } catch {
      if (seq !== consultaSeqRef.current) return;
      setEstadoPedido({
        tipo: "error",
        mensaje: "Error de conexión al consultar el estado del despacho.",
      });
    }
  }, [codigoBuscado, registrarCodigoPropio]);

  const pedidoEnPantalla =
    estadoPedido?.tipo === "datos" ? estadoPedido.datos : null;
  const esPedidoTerminal =
    pedidoEnPantalla !== null &&
    pedidoEnPantalla.codigo === codigoBuscado &&
    esEstadoTerminal(pedidoEnPantalla.estado);

  const pollingStatus = usePedidoPolling({
    fetchFn: consultarPedido,
    enabled: enFoco && codigoBuscado !== null && !esPedidoTerminal,
    resetKey: codigoBuscado,
    intervaloInicial: 5_000,
    intervaloLargo: 30_000,
    umbralCambio: 30_000,
  });

  useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO_MS);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  const handleBuscar = useCallback(() => {
    const limpio = codigoInput.trim().toUpperCase();
    if (limpio.length === 0) {
      setErrorCodigo(
        "Ingresa el código que aparece en tu confirmación de compra."
      );
      return;
    }
    if (limpio.length < 4) {
      setErrorCodigo(
        "El código tiene 4 caracteres. Revisa los que te enviamos."
      );
      return;
    }
    setErrorCodigo(null);
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, [codigoInput]);

  const seleccionarPedidoParaSeguir = useCallback((codigo: string) => {
    const limpio = codigo.trim().toUpperCase();
    setVista("seguimiento");
    setCodigoInput(limpio);
    setErrorCodigo(null);
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, []);

  const agregarAlCarritoCliente = useCallback(
    (prod: ProductoCatalogoAdmin) => {
      const elegida = tallaPorProducto[prod.id];
      const varDisp =
        (elegida
          ? prod.variantes.find(
              (v) => v.sku === elegida || v.talla === elegida
            )
          : undefined) ?? prod.variantes.find((v) => v.stock > 0);
      if (!varDisp || varDisp.stock <= 0) return;

      setCarrito((prev) => {
        const idx = prev.findIndex((i) => i.sku === varDisp.sku);
        if (idx >= 0) {
          if (prev[idx].cantidad >= varDisp.stock) return prev;
          const copia = [...prev];
          copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
          return copia;
        }
        return [
          ...prev,
          {
            sku: varDisp.sku,
            nombre: prod.nombre,
            talla: varDisp.talla,
            color: prod.color,
            cantidad: 1,
            precioUnitario: prod.precio,
          },
        ];
      });
      setErrorNombreCompra(null);
      setErrorCarrito(null);
      setModalCompraAbierto(true);
    },
    [tallaPorProducto]
  );

  const seleccionarTallaProducto = useCallback(
    (prod: ProductoCatalogoAdmin, sku: string) => {
      setTallaPorProducto((prev) => ({ ...prev, [prod.id]: sku }));
    },
    []
  );

  // Talla vigente: la elegida o, por defecto, la primera con stock.
  const tallaSeleccionadaDe = useCallback(
    (prod: ProductoCatalogoAdmin) => {
      const elegida = tallaPorProducto[prod.id];
      if (elegida) return elegida;
      return prod.variantes.find((v) => v.stock > 0)?.sku;
    },
    [tallaPorProducto]
  );

  // Stock vivo por SKU (respetado al editar el carrito).
  const stockPorSku = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const prod of catalogo) {
      for (const v of prod.variantes) {
        mapa[v.sku] = v.stock;
      }
    }
    return mapa;
  }, [catalogo]);

  const cambiarCantidadCarrito = useCallback(
    (item: ItemPedido, delta: number) => {
      const maximo = item.sku ? (stockPorSku[item.sku] ?? item.cantidad) : item.cantidad;
      if (delta > 0 && item.cantidad + delta > maximo) {
        setErrorCarrito(
          `Stock disponible para ${item.nombre}: ${maximo} un.`
        );
        return;
      }
      setErrorCarrito(null);
      setCarrito((prev) =>
        prev.map((it) =>
          (it.sku ?? it.nombre) === (item.sku ?? item.nombre)
            ? { ...it, cantidad: Math.max(1, it.cantidad + delta) }
            : it
        )
      );
    },
    [stockPorSku]
  );

  const quitarItemCarrito = useCallback((item: ItemPedido) => {
    setErrorCarrito(null);
    setCarrito((prev) =>
      prev.filter((it) => (it.sku ?? it.nombre) !== (item.sku ?? item.nombre))
    );
  }, []);

  const handleCancelarPedido = useCallback(
    async (codigo: string) => {
      if (cancelando) return;
      setCancelando(true);
      try {
        const resultado = await cancelar(codigo, "Cancelado por cliente");
        if (!resultado.ok) {
          setAviso({
            titulo: "No se pudo cancelar el pedido",
            mensaje: resultado.mensaje ?? "Intenta nuevamente.",
            tono: "error",
          });
          return;
        }
        setAviso({
          titulo: `Pedido #${codigo} cancelado`,
          mensaje: "Devolvimos las prendas al stock de bodega.",
          tono: "exito",
        });
        await consultarPedido();
      } finally {
        setCancelando(false);
      }
    },
    [cancelando, cancelar, consultarPedido]
  );

  const confirmarPedidoCliente = async () => {
    if (creandoCompra || carrito.length === 0) return;
    if (nombreCompra.trim().length < 2) {
      setErrorNombreCompra("Ingresa tu nombre completo para recibir el pedido.");
      return;
    }
    setErrorNombreCompra(null);
    setCreandoCompra(true);
    try {
      const res = await crearOrden(
        nombreCompra.trim(),
        dirCompra.trim() || "Av. Providencia 1450",
        comunaCompra.trim() || "Providencia",
        carrito,
        "Courier Express 24h",
        { idempotencyKey: idempotencyCompra }
      );
      if (!res.ok || !res.codigo) {
        setAviso({
          titulo: "No se pudo crear tu compra",
          mensaje: res.mensaje ?? "Intenta nuevamente.",
          tono: "error",
        });
        return;
      }
      registrarCodigoPropio(res.codigo);
      setCarrito([]);
      setIdempotencyCompra(generarIdempotencyCliente());
      setModalCompraAbierto(false);
      setAviso({
        titulo: `Pedido #${res.codigo} confirmado`,
        mensaje: "Ya está visible en Bodega y listo para seguir en vivo.",
        tono: "exito",
      });
      seleccionarPedidoParaSeguir(res.codigo);
    } finally {
      setCreandoCompra(false);
    }
  };

  // Pedidos propios del cliente (aislados del resto de compradores)
  const codigosClienteSet = useMemo(
    () => new Set(codigosCliente),
    [codigosCliente]
  );

  const misPedidos = useMemo(
    () => pedidos.filter((p) => codigosClienteSet.has(p.codigo)),
    [pedidos, codigosClienteSet]
  );

  const misPedidosActivosCount = useMemo(
    () => misPedidos.filter((p) => p.estado !== "entregado").length,
    [misPedidos]
  );

  // Filtrados derivados
  const catalogoFiltrado = useMemo(() => {
    const q = busquedaGlobal.trim().toLowerCase();
    if (!q) return catalogo;
    return catalogo.filter(
      (p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }, [catalogo, busquedaGlobal]);

  const pedidosFiltrados = useMemo(() => {
    const q = busquedaGlobal.trim().toLowerCase();
    return misPedidos.filter((p) => {
      if (filtroHistorial !== "todos" && p.estado !== filtroHistorial)
        return false;
      if (!q) return true;
      return (
        p.codigo.toLowerCase().includes(q) ||
        p.clienteNombre.toLowerCase().includes(q) ||
        p.items.some((i) => i.nombre.toLowerCase().includes(q))
      );
    });
  }, [misPedidos, filtroHistorial, busquedaGlobal]);

  const totalCarrito = useMemo(
    () =>
      carrito.reduce(
        (acc, it) => acc + (it.precioUnitario ?? 0) * it.cantidad,
        0
      ),
    [carrito]
  );

  const navItems: PortalNavItem[] = [
    { id: "resumen", etiqueta: "Resumen", icono: "layout-grid" },
    {
      id: "mis-pedidos",
      etiqueta: "Mis pedidos",
      icono: "shopping-bag",
      badge: misPedidos.length,
    },
    { id: "seguimiento", etiqueta: "Seguimiento", icono: "map" },
  ];

  const pedidoActivoDestacado =
    (estadoPedido?.tipo === "datos" ? estadoPedido.datos : null) ??
    misPedidos[0] ??
    null;

  // ─── Subvista 1: RESUMEN CLIENTE (Imagen 2) ────────────────────
  const renderResumen = () => (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            MI ESPACIO · CHILE
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Hola,{" "}
            <Text style={{ color: colores.acentoIntenso }}>
              {primerNombreCliente}.
            </Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Todo lo que necesitas en un solo lugar.
          </Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: ESPACIOS.sm }}>
          <Boton
            etiqueta="Cambiar nombre"
            icono="pencil"
            variante="secundario"
            onPress={abrirModalNombre}
          />
          <Boton
            etiqueta="Explorar cápsula"
            iconoDerecha="arrow-right"
            onPress={() => setVista("mis-pedidos")}
          />
        </View>
      </View>

      {/* Hero cápsula oscuro + cobalto */}
      <View
        style={[
          styles.heroCapsula,
          {
            backgroundColor: colores.panelOscuro,
            borderColor: colores.panelOscuroBorde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View pointerEvents="none" style={styles.aroExterno} />
        <View pointerEvents="none" style={styles.aroInterno} />

        <View style={styles.heroCapsulaContenido}>
          <View style={styles.heroCapsulaLeft}>
            <Text style={[tipografia.eyebrowMono, { color: "#9ab5ff" }]}>
              NUEVA CÁPSULA / FALL 26
            </Text>
            <Text style={[styles.heroTituloGrande]}>
              Diseñado para{"\n"}moverte{" "}
              <Text style={{ color: "#6f95ff" }}>distinto.</Text>
            </Text>
            <Text style={[tipografia.cuerpo, { color: "#c4cdd8" }]}>
              Texturas honestas, siluetas que viven en la calle y detalles hechos
              en Chile.
            </Text>
            <Pressable
              onPress={() => {
                if (catalogo[0]) agregarAlCarritoCliente(catalogo[0]);
              }}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.heroCtaBlanco,
                {
                  minHeight: puntoMinimo,
                  borderRadius: RADIOS.sm,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text
                style={[
                  tipografia.etiqueta,
                  { color: "#0a0d10", fontFamily: FUENTES.semi },
                ]}
              >
                Comprar cápsula
              </Text>
              <Icon name="arrow-right" size={16} color="#0a0d10" />
            </Pressable>
          </View>

          <View style={styles.heroGarmentWrap}>
            <View style={styles.heroGarmentBox}>
              <Icon name="shirt" size={52} color="#ffffff" />
              <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>NOIR</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3 Métricas reales */}
      <View style={styles.metricasGrid}>
        <TarjetaMetrica
          etiqueta="En tránsito"
          valor={String(misPedidosActivosCount).padStart(2, "0")}
          subtitulo="Órdenes activas"
          icono="truck"
          tono="acento"
        />
        <TarjetaMetrica
          etiqueta="Pedidos totales"
          valor={String(misPedidos.length).padStart(2, "0")}
          subtitulo="En tu cuenta"
          icono="package"
          tono="neutro"
        />
        <TarjetaMetrica
          etiqueta="Prendas en catálogo"
          valor={analitica.stockTotalUnidades}
          subtitulo="Stock disponible hoy"
          icono="sparkles"
          tono="exito"
        />
      </View>

      {/* Seguimiento en vivo + Últimos pedidos */}
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
                Seguimiento en vivo
              </Text>
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Consulta instantánea por código de orden
              </Text>
            </View>
            <Pressable
              onPress={() => setVista("seguimiento")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[tipografia.etiqueta, { color: colores.acentoIntenso }]}
              >
                Ir al buscador →
              </Text>
            </Pressable>
          </View>

          {pedidoActivoDestacado ? (
            <View style={styles.seguimientoVivoBox}>
              <View style={styles.tarjetaHeader}>
                <View>
                  <Text
                    style={[
                      tipografia.micro,
                      { color: colores.tintaTerciaria },
                    ]}
                  >
                    PEDIDO #{pedidoActivoDestacado.codigo}
                  </Text>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                  >
                    {pedidoActivoDestacado.items[0]?.nombre ?? "Orden Atelier"}
                  </Text>
                </View>
                <EstadoPedidoBadge
                  estado={pedidoActivoDestacado.estado}
                  compacto
                />
              </View>
              <StepperProgreso estado={pedidoActivoDestacado.estado} />
            </View>
          ) : (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Aún no tienes pedidos activos. Crea una orden rápida abajo o
                ingresa un código en Seguimiento.
              </Text>
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
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Últimos pedidos
            </Text>
            <Pressable
              onPress={() => setVista("mis-pedidos")}
              accessibilityRole="button"
              style={{ minHeight: puntoMinimo, justifyContent: "center" }}
            >
              <Text
                style={[tipografia.etiqueta, { color: colores.acentoIntenso }]}
              >
                Ver todos →
              </Text>
            </Pressable>
          </View>

          {misPedidos.length === 0 ? (
            <View
              style={[
                styles.emptyBox,
                {
                  backgroundColor: colores.superficieHundida,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text
                style={[tipografia.caption, { color: colores.tintaSecundaria }]}
              >
                Sin compras previas en esta sesión.
              </Text>
            </View>
          ) : (
            <View style={styles.miniLista}>
              {misPedidos.slice(0, 3).map((p) => (
                <Pressable
                  key={p.codigo}
                  onPress={() => seleccionarPedidoParaSeguir(p.codigo)}
                  accessibilityRole="button"
                  style={[
                    styles.miniRow,
                    {
                      minHeight: puntoMinimo,
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
                      #{p.codigo} · {p.items[0]?.nombre ?? "Prenda"}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {p.cancelado ? "Cancelado" : ETIQUETAS_ESTADO[p.estado]}
                    </Text>
                  </View>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    {formatearCLP(p.totalEstimado)}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* Te puede gustar (Catálogo conectado al stock real) */}
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
              Te puede gustar
            </Text>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Selección Atelier Noir · añade para comprar y rastrear al instante
            </Text>
          </View>
        </View>

        <View style={[styles.catalogoGrid, esAncho && styles.catalogoGridAncho]}>
          {catalogoFiltrado.slice(0, 4).map((prod) => (
            <View
              key={prod.id}
              style={esAncho ? styles.catalogoItemAncho : styles.catalogoItemMovil}
            >
              <ProductoCatalogoCard
                producto={prod}
                onAgregar={agregarAlCarritoCliente}
                tallaSeleccionada={tallaSeleccionadaDe(prod)}
                onSeleccionarTalla={(sku) => seleccionarTallaProducto(prod, sku)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── Subvista 2: MIS PEDIDOS (Imagen 3) ────────────────────────
  const renderMisPedidos = () => (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            TU ACTIVIDAD
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Mis <Text style={{ color: colores.acentoIntenso }}>pedidos.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Revisa el estado de cada compra y selecciona cualquiera para
            rastrear.
          </Text>
        </View>
        <Boton
          etiqueta="Nuevo pedido"
          icono="plus"
          onPress={() => {
            if (carrito.length === 0 && catalogo[0]) {
              agregarAlCarritoCliente(catalogo[0]);
            } else {
              setModalCompraAbierto(true);
            }
          }}
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
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Historial de pedidos
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsFila}
        >
          {(
            [
              { id: "todos", label: `Todos · ${misPedidos.length}` },
              ...FLUJO_ESTADOS.map((est) => ({
                id: est,
                label: ETIQUETAS_ESTADO[est],
              })),
            ] as { id: FiltroCliente; label: string }[]
          ).map((op) => {
            const act = filtroHistorial === op.id;
            return (
              <Pressable
                key={op.id}
                onPress={() => setFiltroHistorial(op.id)}
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
        </ScrollView>

        {pedidosFiltrados.length === 0 ? (
          <View
            style={[
              styles.emptyBox,
              {
                backgroundColor: colores.superficieHundida,
                borderRadius: RADIOS.md,
              },
            ]}
          >
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              No hay pedidos en esta categoría todavía.
            </Text>
          </View>
        ) : (
          <View style={styles.miniLista}>
            {pedidosFiltrados.map((p) => (
              <Pressable
                key={p.codigo}
                onPress={() => seleccionarPedidoParaSeguir(p.codigo)}
                accessibilityRole="button"
                accessibilityLabel={`Ver seguimiento del pedido ${p.codigo}`}
                style={[
                  styles.historialRow,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.historialIzq}>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    #{p.codigo}
                  </Text>
                  <Text
                    style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {p.items[0]?.nombre ?? "Orden Atelier Noir"}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {p.comuna} · {formatearCLP(p.totalEstimado)}
                  </Text>
                </View>

                <View style={styles.historialDer}>
                  <EstadoPedidoBadge estado={p.estado} compacto />
                  <Icon
                    name="arrow-right"
                    size={16}
                    color={colores.acentoIntenso}
                  />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {/* Volver a comprar */}
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
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Volver a comprar
        </Text>
        <View style={[styles.catalogoGrid, esAncho && styles.catalogoGridAncho]}>
          {catalogoFiltrado.slice(0, 3).map((prod) => (
            <View
              key={prod.id}
              style={esAncho ? styles.catalogoItemTercios : styles.catalogoItemMovil}
            >
              <ProductoCatalogoCard
                producto={prod}
                onAgregar={agregarAlCarritoCliente}
                tallaSeleccionada={tallaSeleccionadaDe(prod)}
                onSeleccionarTalla={(sku) => seleccionarTallaProducto(prod, sku)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  // ─── Subvista 3: SEGUIMIENTO (Imagen 4 + buscador 4 chars) ──────
  const renderSeguimiento = () => (
    <View style={styles.seccionStack}>
      <View style={styles.pageHead}>
        <View style={styles.pageHeadLeft}>
          <Text
            style={[tipografia.eyebrowMono, { color: colores.tintaTerciaria }]}
          >
            LOGÍSTICA
          </Text>
          <Text
            accessibilityRole="header"
            style={[tipografia.display, { color: colores.tinta }]}
          >
            Rastrea tu{" "}
            <Text style={{ color: colores.acentoIntenso }}>pedido.</Text>
          </Text>
          <Text style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}>
            Sigue cada paso en vivo hasta que llegue a tus manos.
          </Text>
        </View>
      </View>

      {/* Buscador de código de 4 caracteres */}
      <View
        style={[
          styles.heroCard,
          {
            backgroundColor: colores.panelOscuro,
            borderColor: colores.panelOscuroBorde,
            borderRadius: RADIOS.lg,
          },
          sombraTarjeta(modo),
        ]}
      >
        <View pointerEvents="none" style={styles.aroExterno} />
        <View style={styles.heroEncabezado}>
          <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>
            CÓDIGO DE ORDEN (4 CARACTERES)
          </Text>
          <Text style={[tipografia.subtitulo, { color: "#ffffff" }]}>
            Consulta el estado de tu despacho en vivo
          </Text>
        </View>

        <View
          style={[
            styles.buscadorCaja,
            {
              backgroundColor: colores.superficie,
              borderColor: colores.borde,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <View
            style={esAncho ? styles.buscadorFilaAncha : styles.buscadorColumna}
          >
            <View
              style={[
                styles.campoCodigo,
                {
                  backgroundColor: campoEnfocado
                    ? colores.superficie
                    : colores.superficieHundida,
                  borderRadius: RADIOS.sm,
                  borderColor: errorCodigo
                    ? colores.error
                    : campoEnfocado
                      ? colores.acento
                      : colores.borde,
                  minHeight: Math.max(puntoMinimo, 50),
                },
              ]}
            >
              <Icon
                name="hash"
                size={17}
                color={
                  campoEnfocado ? colores.acentoIntenso : colores.tintaTerciaria
                }
              />
              <TextInput
                ref={inputRef}
                style={[
                  styles.inputCodigo,
                  tipografia.codigo,
                  { color: colores.tinta, fontSize: 18 },
                ]}
                placeholder="ABCD"
                placeholderTextColor={colores.tintaTerciaria}
                value={codigoInput}
                onChangeText={(texto) => {
                  setCodigoInput(texto.toUpperCase());
                  if (errorCodigo) setErrorCodigo(null);
                }}
                onFocus={() => setCampoEnfocado(true)}
                onBlur={() => setCampoEnfocado(false)}
                maxLength={4}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={handleBuscar}
                accessibilityLabel="Código de seguimiento de tu orden"
              />
              {codigoInput.length > 0 ? (
                <Pressable
                  onPress={() => setCodigoInput("")}
                  accessibilityRole="button"
                  accessibilityLabel="Limpiar código"
                  style={{
                    minWidth: puntoMinimo,
                    minHeight: puntoMinimo,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="x" size={16} color={colores.tintaSecundaria} />
                </Pressable>
              ) : null}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.botonRastrear,
                esAncho && styles.botonRastrearAncho,
                {
                  backgroundColor: colores.primario,
                  borderRadius: RADIOS.sm,
                  minHeight: Math.max(puntoMinimo, 50),
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              onPress={handleBuscar}
              accessibilityRole="button"
              accessibilityLabel="Rastrear pedido"
            >
              <Icon name="search" size={17} color={colores.sobrePrimario} />
              <Text
                style={[tipografia.boton, { color: colores.sobrePrimario }]}
              >
                Rastrear
              </Text>
            </Pressable>
          </View>

          {errorCodigo ? (
            <View style={styles.errorFila}>
              <Icon name="circle-alert" size={14} color={colores.error} />
              <Text
                accessibilityRole="alert"
                style={[tipografia.caption, { color: colores.error, flex: 1 }]}
              >
                {errorCodigo}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Resultado 4 estados discriminados + Destino */}
      <EstadoUIRenderer
        estado={estadoPedido ?? { tipo: "vacio" }}
        mensajeVacio={
          codigoBuscado
            ? `No encontramos ninguna orden con el código "${codigoBuscado}". Verifica los 4 caracteres de tu confirmación.`
            : "Ingresa tu código de 4 caracteres arriba y presiona 'Rastrear' para ver tu despacho."
        }
        accionVacia={
          codigoBuscado
            ? {
              etiqueta: "Buscar otro código",
              onPress: () => {
                setCodigoInput("");
                setErrorCodigo(null);
                inputRef.current?.focus();
              },
            }
            : misPedidos[0]
              ? {
                etiqueta: `Seguir #${misPedidos[0].codigo}`,
                onPress: () => seleccionarPedidoParaSeguir(misPedidos[0].codigo),
              }
              : undefined
        }
        onReintentar={consultarPedido}
        renderDatos={(pedido) => (
          <View style={esAncho ? styles.dosColumnas : styles.unaColumna}>
            {/* Izquierda: Seguimiento en vivo + Timeline */}
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
              <View style={styles.tarjetaHeader}>
                <View>
                  <Text
                    style={[
                      tipografia.eyebrowMono,
                      { color: colores.tintaTerciaria },
                    ]}
                  >
                    PEDIDO #{pedido.codigo}
                  </Text>
                  <Text style={[tipografia.codigo, { color: colores.tinta }]}>
                    {pedido.items[0]?.nombre ?? `#${pedido.codigo}`}
                  </Text>
                </View>
                <EstadoPedidoBadge estado={pedido.estado} />
              </View>

              {pedido.cancelado ? (
                <View
                  style={[
                    styles.cajaEstado,
                    {
                      backgroundColor: colores.errorSuave,
                      borderColor: colores.error,
                      borderRadius: RADIOS.md,
                    },
                  ]}
                >
                  <View style={styles.pillCancelado}>
                    <Icon name="circle-alert" size={16} color={colores.error} />
                    <Text
                      style={[tipografia.etiqueta, { color: colores.error }]}
                    >
                      Orden cancelada
                    </Text>
                  </View>
                  <Text
                    style={[tipografia.caption, { color: colores.tinta }]}
                  >
                    {pedido.motivoCancelacion ??
                      "La orden fue cancelada y las prendas volvieron al stock de bodega."}
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.cajaEstado,
                    {
                      backgroundColor: colores.estadoSuave[pedido.estado],
                      borderColor: colores.borde,
                      borderRadius: RADIOS.md,
                    },
                  ]}
                >
                  <Text style={[tipografia.cuerpo, { color: colores.tinta }]}>
                    {DESCRIPCIONES_ESTADO[pedido.estado]}
                  </Text>
                </View>
              )}

              {pedido.estado === "recibido" && !pedido.cancelado ? (
                <Boton
                  etiqueta="Cancelar pedido"
                  icono="x"
                  variante="secundario"
                  onPress={() => handleCancelarPedido(pedido.codigo)}
                  deshabilitado={cancelando}
                  style={styles.botonCancelarPedido}
                  accessibilityLabel="Cancelar pedido"
                  accessibilityHint="Cancela la orden y devuelve las prendas al stock"
                />
              ) : null}

              <StepperProgreso estado={pedido.estado} />

              {/* Bitácora de estados */}
              {pedido.historialEstados && pedido.historialEstados.length > 0 ? (
                <View style={styles.historialEstados}>
                  <Text
                    style={[tipografia.micro, { color: colores.tintaTerciaria }]}
                  >
                    HISTORIAL
                  </Text>
                  {pedido.historialEstados.map((h, idx) => (
                    <View
                      key={`${h.estado}-${idx}`}
                      style={styles.historialFila}
                    >
                      <Text
                        style={[tipografia.caption, { color: colores.tinta }]}
                      >
                        {etiquetaEstadoHistorial(h.estado)}
                      </Text>
                      <Text
                        style={[
                          tipografia.micro,
                          { color: colores.tintaTerciaria },
                        ]}
                      >
                        {formatearHoraHistorial(h.fecha)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}

              {/* Prendas */}
              <View
                style={[
                  styles.panelPrendas,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <Text
                  style={[tipografia.micro, { color: colores.tintaTerciaria }]}
                >
                  PRENDAS ({pedido.items.length})
                </Text>
                {pedido.items.map((item, idx) => (
                  <View key={`${item.nombre}-${idx}`} style={styles.prendaFila}>
                    <View style={styles.flex}>
                      <Text
                        style={[tipografia.etiqueta, { color: colores.tinta }]}
                      >
                        {item.cantidad}× {item.nombre}
                      </Text>
                      {(item.talla || item.color) && (
                        <Text
                          style={[
                            tipografia.caption,
                            { color: colores.tintaSecundaria },
                          ]}
                        >
                          {[
                            item.talla ? `Talla ${item.talla}` : null,
                            item.color,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </Text>
                      )}
                    </View>
                    {item.precioUnitario ? (
                      <Text
                        style={[tipografia.micro, { color: colores.tinta }]}
                      >
                        {formatearCLP(item.precioUnitario * item.cantidad)}
                      </Text>
                    ) : null}
                  </View>
                ))}
                <View
                  style={[
                    styles.subtotalFila,
                    { borderTopColor: colores.borde },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.etiqueta,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Total pagado
                  </Text>
                  <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                    {formatearCLP(pedido.totalEstimado)}
                  </Text>
                </View>
              </View>

              {/* Monitoreo polling en vivo */}
              <View style={styles.monitoreoFila}>
                <View
                  style={[
                    styles.pulso,
                    {
                      backgroundColor: esEstadoTerminal(pedido.estado)
                        ? colores.estado.entregado
                        : pollingStatus.enSegundoPlano
                          ? colores.tintaTerciaria
                          : colores.puntoEstado.entregado,
                    },
                  ]}
                />
                <View style={styles.flex}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {esEstadoTerminal(pedido.estado)
                      ? "Pedido entregado"
                      : pollingStatus.enSegundoPlano
                        ? "Monitoreo en pausa"
                        : "Monitoreo activo"}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {esEstadoTerminal(pedido.estado)
                      ? "Entrega completada · polling detenido"
                      : `Cada ${pollingStatus.frecuenciaSegundos}s${pollingStatus.esFrecuenciaLenta ? " · ahorro" : " · en vivo"}${ultimaActualizacion ? ` · ${ultimaActualizacion}` : ""}`}
                  </Text>
                </View>
                <Pressable
                  onPress={consultarPedido}
                  accessibilityRole="button"
                  accessibilityLabel="Consultar estado ahora"
                  style={({ pressed }) => [
                    styles.botonRefrescar,
                    {
                      minWidth: puntoMinimo,
                      minHeight: puntoMinimo,
                      borderColor: colores.borde,
                      backgroundColor: colores.superficieHundida,
                      borderRadius: RADIOS.sm,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Icon name="refresh-cw" size={16} color={colores.tinta} />
                </Pressable>
              </View>
            </View>

            {/* Derecha: Destino */}
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
                  Destino
                </Text>
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  Información de entrega
                </Text>
              </View>

              <View
                style={[
                  styles.rutaCard,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <Icon name="warehouse" size={18} color={colores.tinta} />
                <View style={styles.flex}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    Bodega Atelier Noir
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Av. Italia 1442, Ñuñoa
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.rutaCard,
                  {
                    backgroundColor: colores.acentoSuave,
                    borderColor: colores.acento,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <Icon name="map-pin" size={18} color={colores.acentoIntenso} />
                <View style={styles.flex}>
                  <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                    {pedido.comuna}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {pedido.direccionDespacho}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      {
                        color: colores.acentoIntenso,
                        fontFamily: FUENTES.semi,
                        marginTop: 2,
                      },
                    ]}
                  >
                    {pedido.clienteNombre} · {pedido.metodoEnvio}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      />

      {/* También podría interesarte */}
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
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          También podría interesarte
        </Text>
        <View style={[styles.catalogoGrid, esAncho && styles.catalogoGridAncho]}>
          {catalogoFiltrado.slice(0, 3).map((prod) => (
            <View
              key={prod.id}
              style={
                esAncho ? styles.catalogoItemTercios : styles.catalogoItemMovil
              }
            >
              <ProductoCatalogoCard
                producto={prod}
                onAgregar={agregarAlCarritoCliente}
                tallaSeleccionada={tallaSeleccionadaDe(prod)}
                onSeleccionarTalla={(sku) => seleccionarTallaProducto(prod, sku)}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <PortalShell
      rolLabel="Mi espacio"
      usuarioIniciales={inicialesCliente}
      usuarioNombre={nombreCliente}
      usuarioRol="Cliente Noir"
      items={navItems}
      vistaActiva={vista}
      onCambiarVista={(id) => setVista(id as VistaCliente)}
      onEditarUsuario={abrirModalNombre}
      accionExtra={
        carrito.length > 0
          ? {
            etiqueta: `Finalizar compra (${carrito.length})`,
            icono: "shopping-bag",
            onPress: () => setModalCompraAbierto(true),
          }
          : undefined
      }
      busqueda={busquedaGlobal}
      onCambiarBusqueda={setBusquedaGlobal}
      placeholderBusqueda="Buscar en tu espacio…"
      mostrarSalir={false}
    >
      <AvisoFlotante
        visible={aviso !== null}
        tono={aviso?.tono ?? "acento"}
        icono="bell"
        titulo={aviso?.titulo ?? ""}
        mensaje={aviso?.mensaje ?? ""}
        onCerrar={() => setAviso(null)}
      />

      {/* Modal para cambiar nombre de cliente */}
      <Modal
        visible={modalNombreAbierto}
        transparent
        animationType={reducirMovimiento ? "none" : "fade"}
        onRequestClose={() => setModalNombreAbierto(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colores.overlay }]}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.modalCard,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.lg,
              },
              sombraFlotante(modo),
            ]}
          >
            <View style={styles.panelHeadRow}>
              <Text style={[tipografia.titulo, { color: colores.tinta }]}>
                Cambiar nombre
              </Text>
              <Pressable
                onPress={() => setModalNombreAbierto(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar editor de nombre"
                style={{
                  minWidth: puntoMinimo,
                  minHeight: puntoMinimo,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} color={colores.tinta} />
              </Pressable>
            </View>

            <Text
              style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}
            >
              Este nombre se mostrará en tu espacio y se usará por defecto en
              tus próximas compras.
            </Text>

            <CampoTexto
              etiqueta="Nombre completo"
              valor={nombreEditInput}
              onCambio={(txt) => {
                setNombreEditInput(txt);
                if (errorNombreEdit) setErrorNombreEdit(null);
              }}
              placeholder="Ej: Martina Soto"
              icono="user"
              autoCapitalize="words"
              error={errorNombreEdit}
              returnKeyType="done"
              onSubmit={guardarNombreCliente}
            />

            <View style={{ gap: ESPACIOS.sm }}>
              <Boton
                etiqueta="Guardar nombre"
                icono="check"
                anchoCompleto
                onPress={guardarNombreCliente}
              />
              <Boton
                etiqueta="Cancelar"
                variante="secundario"
                anchoCompleto
                onPress={() => setModalNombreAbierto(false)}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal rápido de compra para cliente -> crea orden real para Bodega */}
      <Modal
        visible={modalCompraAbierto}
        transparent
        animationType={reducirMovimiento ? "none" : "fade"}
        onRequestClose={() => setModalCompraAbierto(false)}
      >
        <View
          style={[styles.modalOverlay, { backgroundColor: colores.overlay }]}
        >
          <View
            accessibilityViewIsModal
            style={[
              styles.modalCard,
              {
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.lg,
              },
              sombraFlotante(modo),
            ]}
          >
            <View style={styles.panelHeadRow}>
              <Text style={[tipografia.titulo, { color: colores.tinta }]}>
                Finalizar compra
              </Text>
              <Pressable
                onPress={() => setModalCompraAbierto(false)}
                accessibilityRole="button"
                accessibilityLabel="Cerrar resumen de compra"
                style={{
                  minWidth: puntoMinimo,
                  minHeight: puntoMinimo,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="x" size={18} color={colores.tinta} />
              </Pressable>
            </View>

            <View style={styles.miniLista}>
              {carrito.map((item) => (
                <View
                  key={item.sku ?? item.nombre}
                  style={[
                    styles.miniRow,
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
                    >
                      {item.cantidad}× {item.nombre} ({item.talla})
                    </Text>
                    <Text style={[tipografia.micro, { color: colores.tinta }]}>
                      {formatearCLP((item.precioUnitario ?? 0) * item.cantidad)}
                    </Text>
                  </View>

                  <View style={styles.carritoStepper}>
                    <Pressable
                      onPress={() => cambiarCantidadCarrito(item, -1)}
                      disabled={item.cantidad <= 1}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar una unidad de ${item.nombre}`}
                      accessibilityState={{ disabled: item.cantidad <= 1 }}
                      style={({ pressed }) => [
                        styles.carritoStepperBoton,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          borderColor: colores.borde,
                          backgroundColor: colores.superficie,
                          opacity:
                            item.cantidad <= 1 ? 0.4 : pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Icon name="minus" size={15} color={colores.tinta} />
                    </Pressable>

                    <Text
                      style={[
                        tipografia.micro,
                        styles.carritoCantidad,
                        { color: colores.tinta },
                      ]}
                    >
                      {item.cantidad}
                    </Text>

                    <Pressable
                      onPress={() => cambiarCantidadCarrito(item, 1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar una unidad de ${item.nombre}`}
                      style={({ pressed }) => [
                        styles.carritoStepperBoton,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          borderColor: colores.borde,
                          backgroundColor: colores.superficie,
                          opacity: pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Icon name="plus" size={15} color={colores.tinta} />
                    </Pressable>

                    <Pressable
                      onPress={() => quitarItemCarrito(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`Eliminar ${item.nombre} del carrito`}
                      style={({ pressed }) => [
                        styles.carritoStepperBoton,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          borderColor: colores.borde,
                          backgroundColor: colores.superficie,
                          opacity: pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Icon name="trash-2" size={16} color={colores.error} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {errorCarrito ? (
              <View style={styles.errorFila}>
                <Icon name="circle-alert" size={14} color={colores.error} />
                <Text
                  accessibilityRole="alert"
                  style={[tipografia.caption, { color: colores.error, flex: 1 }]}
                >
                  {errorCarrito}
                </Text>
              </View>
            ) : null}

            <CampoTexto
              etiqueta="Tu nombre"
              valor={nombreCompra}
              onCambio={(txt) => {
                setNombreCompra(txt);
                if (errorNombreCompra) setErrorNombreCompra(null);
              }}
              icono="user"
              error={errorNombreCompra}
            />
            <CampoTexto
              etiqueta="Dirección de entrega"
              valor={dirCompra}
              onCambio={setDirCompra}
              icono="map-pin"
            />
            <CampoTexto
              etiqueta="Comuna (RM)"
              valor={comunaCompra}
              onCambio={setComunaCompra}
              icono="map-pin"
            />

            <View style={styles.subtotalFila}>
              <Text
                style={[tipografia.etiqueta, { color: colores.tintaSecundaria }]}
              >
                Total productos
              </Text>
              <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                {formatearCLP(totalCarrito)}
              </Text>
            </View>

            <Boton
              etiqueta={creandoCompra ? "Procesando…" : "Confirmar compra"}
              icono="package-check"
              cargando={creandoCompra}
              deshabilitado={creandoCompra || carrito.length === 0}
              anchoCompleto
              onPress={confirmarPedidoCliente}
            />
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.contenidoScroll,
          esAncho && styles.contenidoScrollAncho,
        ]}
      >
        <View style={styles.contenidoInner}>
          {vista === "resumen"
            ? renderResumen()
            : vista === "mis-pedidos"
              ? renderMisPedidos()
              : renderSeguimiento()}
        </View>
      </ScrollView>
    </PortalShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, minWidth: 0 },
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
  seccionStack: {
    gap: ESPACIOS.lg,
  },
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
  heroCapsula: {
    padding: ESPACIOS.xl,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  heroCapsulaContenido: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.lg,
  },
  heroCapsulaLeft: {
    flex: 1.4,
    minWidth: 220,
    gap: ESPACIOS.sm,
  },
  heroTituloGrande: {
    color: "#ffffff",
    fontFamily: FUENTES.fuerte,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
  },
  heroCtaBlanco: {
    marginTop: ESPACIOS.xs,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: ESPACIOS.sm,
    backgroundColor: "#ffffff",
    paddingHorizontal: ESPACIOS.lg,
    cursor: "pointer",
  },
  heroGarmentWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
  heroGarmentBox: {
    width: 112,
    height: 112,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  aroExterno: {
    position: "absolute",
    top: -48,
    right: -48,
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 1,
    borderColor: "rgba(111, 149, 255, 0.24)",
  },
  aroInterno: {
    position: "absolute",
    top: -16,
    right: -16,
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(80, 200, 232, 0.2)",
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
  colMayor: { flex: 1.4, minWidth: 0 },
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
  seguimientoVivoBox: {
    gap: ESPACIOS.md,
  },
  emptyBox: {
    padding: ESPACIOS.lg,
    alignItems: "center",
  },
  miniLista: {
    gap: ESPACIOS.sm,
  },
  miniRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  carritoStepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
  },
  carritoStepperBoton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    cursor: "pointer",
  },
  carritoCantidad: {
    minWidth: 20,
    textAlign: "center",
  },
  catalogoGrid: {
    gap: ESPACIOS.md,
  },
  catalogoGridAncho: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  catalogoItemAncho: {
    width: "23.5%",
    minWidth: 200,
  },
  catalogoItemTercios: {
    width: "31.5%",
    minWidth: 220,
  },
  catalogoItemMovil: {
    width: "100%",
  },
  chipsFila: {
    gap: ESPACIOS.sm,
  },
  chipFiltro: {
    justifyContent: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  historialRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  historialIzq: {
    flex: 1,
    minWidth: 160,
    gap: 2,
  },
  historialDer: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  heroCard: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
  },
  heroEncabezado: {
    marginBottom: ESPACIOS.md,
    gap: ESPACIOS.xs,
  },
  buscadorCaja: {
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  buscadorColumna: {
    gap: ESPACIOS.sm,
  },
  buscadorFilaAncha: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: ESPACIOS.sm,
  },
  campoCodigo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    paddingLeft: ESPACIOS.md,
    paddingRight: ESPACIOS.xs,
    borderWidth: 1.5,
  },
  inputCodigo: {
    flex: 1,
    minWidth: 0,
    letterSpacing: 3,
    paddingVertical: ESPACIOS.sm,
  },
  botonRastrear: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: ESPACIOS.sm,
    paddingHorizontal: ESPACIOS.xl,
    cursor: "pointer",
  },
  botonRastrearAncho: {
    minWidth: 148,
  },
  errorFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.sm,
  },
  tarjetaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  cajaEstado: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.xs + 2,
  },
  pillCancelado: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonCancelarPedido: {
    alignSelf: "flex-start",
  },
  historialEstados: {
    gap: ESPACIOS.xs,
    paddingTop: ESPACIOS.xs,
  },
  historialFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  panelPrendas: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  prendaFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  subtotalFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    marginTop: ESPACIOS.xs,
    paddingTop: ESPACIOS.sm,
  },
  monitoreoFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.md,
  },
  pulso: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  botonRefrescar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    cursor: "pointer",
  },
  rutaCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: ESPACIOS.md,
    padding: ESPACIOS.md,
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 460,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
});
