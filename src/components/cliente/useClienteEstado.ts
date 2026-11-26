// ─── Hook de Estado y Flujos para ClienteScreen ─────────────────

import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { TonoAviso } from "../AvisoFlotante";
import { PortalNavItem } from "../PortalShell";
import { usePedidos } from "../../context/PedidosContext";
import { esEstadoTerminal } from "../../hooks/pollingConfig";
import { usePedidoPolling } from "../../hooks/usePedidoPolling";
import { useReducirMovimiento } from "../../hooks/useReducirMovimiento";
import { obtenerPedidoPorCodigo } from "../../services/pedidosApi";
import {
  DESCRIPCIONES_ESTADO,
  EstadoPedido,
  EstadoUI,
  Pedido,
} from "../../types/pedido";
import {
  dispararNotificacionError,
  dispararNotificacionExito,
} from "../../utils/haptics";
import { sanitizarInput } from "../../utils/sanitize";
import { FiltroCliente } from "./MisPedidosList";
import { useCarritoCliente } from "./useCarritoCliente";

export type VistaCliente = "resumen" | "mis-pedidos" | "seguimiento";

const DURACION_AVISO_MS = 7_000;
const CLAVE_NOMBRE_CLIENTE = "@deliverytracker/cliente_nombre";
const CLAVE_CODIGOS_CLIENTE = "@deliverytracker/cliente_codigos";
const NOMBRE_CLIENTE_DEFAULT = "Martina Soto";

export function useClienteEstado() {
  const { codigo: codigoParam } = useLocalSearchParams<{ codigo?: string }>();
  const reducirMovimiento = useReducirMovimiento();
  const { pedidos, catalogo, analitica, crearOrden, cancelar } = usePedidos();

  const [vista, setVista] = useState<VistaCliente>("seguimiento");
  const [busquedaGlobal, setBusquedaGlobal] = useState("");
  const [filtroHistorial, setFiltroHistorial] =
    useState<FiltroCliente>("todos");

  const [codigoInput, setCodigoInput] = useState("");
  const [codigoBuscado, setCodigoBuscado] = useState<string | null>(null);
  const [estadoPedido, setEstadoPedido] = useState<EstadoUI<Pedido> | null>({
    tipo: "vacio",
  });
  const [errorCodigo, setErrorCodigo] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<string | null>(
    null
  );
  const [aviso, setAviso] = useState<{
    titulo: string;
    mensaje: string;
    tono: TonoAviso;
  } | null>(null);

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

  const [nombreCliente, setNombreCliente] = useState(NOMBRE_CLIENTE_DEFAULT);
  const [codigosCliente, setCodigosCliente] = useState<string[]>([]);
  const [modalNombreAbierto, setModalNombreAbierto] = useState(false);
  const [nombreEditInput, setNombreEditInput] = useState("");
  const [errorNombreEdit, setErrorNombreEdit] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const carritoHook = useCarritoCliente(
    catalogo,
    reducirMovimiento,
    NOMBRE_CLIENTE_DEFAULT
  );
  const { setNombreCompra } = carritoHook;

  const registrarCodigoPropio = useCallback((codigo: string) => {
    const norm = codigo.trim().toUpperCase();
    if (!norm) return;
    setCodigosCliente((prev) => {
      if (prev.includes(norm)) return prev;
      const siguiente = [norm, ...prev];
      AsyncStorage.setItem(
        CLAVE_CODIGOS_CLIENTE,
        JSON.stringify(siguiente)
      ).catch(() => {});
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
          } catch {}
        }
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, [setNombreCompra]);

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
    const limpio = sanitizarInput(nombreEditInput);
    if (limpio.length < 2) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorNombreEdit("Ingresa al menos 2 caracteres para tu nombre.");
      return;
    }
    setNombreCliente(limpio);
    setNombreCompra(limpio);
    setModalNombreAbierto(false);
    setErrorNombreEdit(null);
    AsyncStorage.setItem(CLAVE_NOMBRE_CLIENTE, limpio).catch(() => {});
    void dispararNotificacionExito(reducirMovimiento);
    setAviso({
      titulo: "Nombre actualizado",
      mensaje: `Ahora te mostramos como ${limpio}.`,
      tono: "exito",
    });
  }, [nombreEditInput, reducirMovimiento, setNombreCompra]);

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
        void dispararNotificacionExito(reducirMovimiento);
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
  }, [codigoBuscado, registrarCodigoPropio, reducirMovimiento]);

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
      void dispararNotificacionError(reducirMovimiento);
      setErrorCodigo(
        "Ingresa el código que aparece en tu confirmación de compra."
      );
      return;
    }
    if (limpio.length < 4) {
      void dispararNotificacionError(reducirMovimiento);
      setErrorCodigo(
        "El código tiene 4 caracteres. Revisa los que te enviamos."
      );
      return;
    }
    setErrorCodigo(null);
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, [codigoInput, reducirMovimiento]);

  const seleccionarPedidoParaSeguir = useCallback((codigo: string) => {
    const limpio = codigo.trim().toUpperCase();
    setVista("seguimiento");
    setCodigoInput(limpio);
    setErrorCodigo(null);
    setEstadoPedido({ tipo: "cargando" });
    setCodigoBuscado(limpio);
  }, []);

  const handleCancelarPedido = useCallback(
    async (codigo: string) => {
      if (cancelando) return;
      setCancelando(true);
      try {
        const resultado = await cancelar(codigo, "Cancelado por cliente");
        if (!resultado.ok) {
          void dispararNotificacionError(reducirMovimiento);
          setAviso({
            titulo: "No se pudo cancelar el pedido",
            mensaje: resultado.mensaje ?? "Intenta nuevamente.",
            tono: "error",
          });
          return;
        }
        void dispararNotificacionExito(reducirMovimiento);
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
    [cancelando, cancelar, consultarPedido, reducirMovimiento]
  );

  const confirmarPedidoCliente = async () => {
    if (carritoHook.creandoCompra || carritoHook.carrito.length === 0) return;
    const nombreLimpio = sanitizarInput(carritoHook.nombreCompra);
    if (nombreLimpio.length < 2) {
      void dispararNotificacionError(reducirMovimiento);
      carritoHook.setErrorNombreCompra(
        "Ingresa tu nombre completo para recibir el pedido."
      );
      return;
    }
    carritoHook.setErrorNombreCompra(null);
    carritoHook.setCreandoCompra(true);
    try {
      const res = await crearOrden(
        nombreLimpio,
        sanitizarInput(carritoHook.dirCompra) || "Av. Providencia 1450",
        sanitizarInput(carritoHook.comunaCompra) || "Providencia",
        carritoHook.carrito,
        "Courier Express 24h",
        { idempotencyKey: carritoHook.idempotencyCompra }
      );
      if (!res.ok || !res.codigo) {
        void dispararNotificacionError(reducirMovimiento);
        setAviso({
          titulo: "No se pudo crear tu compra",
          mensaje: res.mensaje ?? "Intenta nuevamente.",
          tono: "error",
        });
        return;
      }
      void dispararNotificacionExito(reducirMovimiento);
      registrarCodigoPropio(res.codigo);
      carritoHook.limpiarCarritoPostCompra();
      setAviso({
        titulo: `Pedido #${res.codigo} confirmado`,
        mensaje: "Ya está visible en Bodega y listo para seguir en vivo.",
        tono: "exito",
      });
      seleccionarPedidoParaSeguir(res.codigo);
    } finally {
      carritoHook.setCreandoCompra(false);
    }
  };

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

  return {
    reducirMovimiento,
    vista,
    setVista,
    busquedaGlobal,
    setBusquedaGlobal,
    filtroHistorial,
    setFiltroHistorial,
    codigoInput,
    setCodigoInput,
    codigoBuscado,
    estadoPedido,
    errorCodigo,
    setErrorCodigo,
    ultimaActualizacion,
    aviso,
    setAviso,
    nombreCliente,
    primerNombreCliente,
    inicialesCliente,
    modalNombreAbierto,
    setModalNombreAbierto,
    nombreEditInput,
    setNombreEditInput,
    errorNombreEdit,
    setErrorNombreEdit,
    abrirModalNombre,
    guardarNombreCliente,
    cancelando,
    pollingStatus,
    handleBuscar,
    seleccionarPedidoParaSeguir,
    handleCancelarPedido,
    confirmarPedidoCliente,
    consultarPedido,
    misPedidos,
    misPedidosActivosCount,
    catalogoFiltrado,
    pedidosFiltrados,
    navItems,
    pedidoActivoDestacado,
    stockTotalUnidades: analitica.stockTotalUnidades,
    catalogo,
    ...carritoHook,
  };
}
