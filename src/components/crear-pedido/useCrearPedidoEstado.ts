// ─── Hook de Estado y Validación para CrearPedidoScreen ──────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard } from "react-native";

import { TonoAviso } from "../AvisoFlotante";
import { usePedidos } from "../../context/PedidosContext";
import { useReducirMovimiento } from "../../hooks/useReducirMovimiento";
import {
  buscarClientes,
  calcularTotalesChile,
  COMUNAS_RM,
  crearClienteDirectorio,
  simularBajaExternaStock,
  STOCK_CRITICO_MAX,
  UMBRAL_CONFIRMACION_DEFAULT,
  VENTANAS_HORARIAS,
} from "../../services/operacionesMock";
import {
  ConflictoStock,
  detectarDuplicadoReciente,
} from "../../services/pedidosApi";
import {
  ClienteAdmin,
  ItemPedido,
  MetodoPago,
  Pedido,
  ProductoCatalogoAdmin,
  Transportista,
} from "../../types/pedido";
import {
  dispararNotificacionError,
  dispararNotificacionExito,
} from "../../utils/haptics";
import { sanitizarInput } from "../../utils/sanitize";

function generarIdempotencyKey(): string {
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export interface ErroresFormulario {
  cliente?: string;
  productos?: string;
  direccion?: string;
  comuna?: string;
}

export function useCrearPedidoEstado() {
  const reducirMovimiento = useReducirMovimiento();
  const { catalogo, crearOrden } = usePedidos();
  const [tecladoVisible, setTecladoVisible] = useState(false);

  useEffect(() => {
    const subShow = Keyboard.addListener("keyboardDidShow", () =>
      setTecladoVisible(true)
    );
    const subHide = Keyboard.addListener("keyboardDidHide", () =>
      setTecladoVisible(false)
    );
    return () => {
      subShow.remove();
      subHide.remove();
    };
  }, []);

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<ClienteAdmin | null>(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoCliNombre, setNuevoCliNombre] = useState("");
  const [nuevoCliCorreo, setNuevoCliCorreo] = useState("");
  const [nuevoCliTelefono, setNuevoCliTelefono] = useState("+56 9 ");
  const [erroresNuevoCli, setErroresNuevoCli] = useState<{
    nombre?: string;
    correo?: string;
    telefono?: string;
  }>({});

  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [filtroStockCritico, setFiltroStockCritico] = useState(false);
  const [tallaPorProducto, setTallaPorProducto] = useState<
    Record<string, string>
  >({});
  const [lineasPedido, setLineasPedido] = useState<ItemPedido[]>([]);
  const [mensajeStockLive, setMensajeStockLive] = useState<string | null>(null);

  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState<string>(COMUNAS_RM[0]);
  const [transportista, setTransportista] = useState<Transportista>("Bluex");
  const [ventanaHoraria, setVentanaHoraria] = useState<string>(
    VENTANAS_HORARIAS[0]
  );
  const [notaInterna, setNotaInterna] = useState("");

  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Transferencia");
  const [umbralTexto, setUmbralTexto] = useState(
    String(UMBRAL_CONFIRMACION_DEFAULT)
  );
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    generarIdempotencyKey()
  );

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [enviando, setEnviando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    tipo: "monto_alto" | "duplicado";
    pedidoPrevio?: Pedido;
  } | null>(null);
  const [pedidoCreado, setPedidoCreado] = useState<Pedido | null>(null);
  const [aviso, setAviso] = useState<{
    titulo: string;
    mensaje: string;
    tono: TonoAviso;
  } | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 5000);
    return () => clearTimeout(t);
  }, [aviso]);

  const clientesFiltrados = buscarClientes(busquedaCliente);

  const productosFiltrados = useMemo(() => {
    const q = busquedaProducto.trim().toLowerCase();
    return catalogo.filter((prod) => {
      const coincideTexto =
        !q ||
        prod.nombre.toLowerCase().includes(q) ||
        prod.categoria.toLowerCase().includes(q) ||
        prod.variantes.some((v) => v.sku.toLowerCase().includes(q));
      if (!coincideTexto) return false;
      if (!filtroStockCritico) return true;
      return prod.variantes.some(
        (v) => v.stock > 0 && v.stock <= STOCK_CRITICO_MAX
      );
    });
  }, [catalogo, busquedaProducto, filtroStockCritico]);

  const subtotalItems = useMemo(
    () =>
      lineasPedido.reduce(
        (acc, it) => acc + (it.precioUnitario ?? 0) * it.cantidad,
        0
      ),
    [lineasPedido]
  );
  const desglose = useMemo(
    () => calcularTotalesChile(subtotalItems),
    [subtotalItems]
  );
  const umbralConfirmacion = useMemo(() => {
    const limpio = Number(umbralTexto.replace(/\D/g, ""));
    return Number.isFinite(limpio) ? limpio : 0;
  }, [umbralTexto]);

  const stockActualPorSku = useMemo(() => {
    const mapa: Record<string, number> = {};
    catalogo.forEach((p) =>
      p.variantes.forEach((v) => {
        mapa[v.sku] = v.stock;
      })
    );
    return mapa;
  }, [catalogo]);

  const conflictosStock = useMemo<ConflictoStock[]>(() => {
    const lista: ConflictoStock[] = [];
    for (const linea of lineasPedido) {
      if (!linea.sku) continue;
      const disponible = stockActualPorSku[linea.sku] ?? 0;
      if (linea.cantidad > disponible) {
        lista.push({
          sku: linea.sku,
          nombre: linea.nombre,
          talla: linea.talla,
          solicitado: linea.cantidad,
          disponible,
        });
      }
    }
    return lista;
  }, [lineasPedido, stockActualPorSku]);

  const seleccionarCliente = (cli: ClienteAdmin) => {
    setClienteSeleccionado(cli);
    setMostrarNuevoCliente(false);
    setErrores((prev) => ({ ...prev, cliente: undefined }));
    if (!direccion.trim() && cli.direccionHabitual) {
      setDireccion(cli.direccionHabitual);
      setErrores((prev) => ({ ...prev, direccion: undefined }));
    }
    if (cli.comunaHabitual) {
      setComuna(cli.comunaHabitual);
      setErrores((prev) => ({ ...prev, comuna: undefined }));
    }
  };

  const guardarNuevoCliente = () => {
    const nombreSanitizado = sanitizarInput(nuevoCliNombre);
    const correoSanitizado = sanitizarInput(nuevoCliCorreo);
    const telefonoSanitizado = sanitizarInput(nuevoCliTelefono);
    const errs: { nombre?: string; correo?: string; telefono?: string } = {};
    if (nombreSanitizado.length < 3) {
      errs.nombre = "Ingresa el nombre completo del cliente.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoSanitizado)) {
      errs.correo = "Ingresa un correo válido (ej. nombre@correo.cl).";
    }
    if (telefonoSanitizado.replace(/\D/g, "").length < 8) {
      errs.telefono = "Ingresa un teléfono válido de al menos 8 dígitos.";
    }
    setErroresNuevoCli(errs);
    if (Object.keys(errs).length > 0) {
      void dispararNotificacionError(reducirMovimiento);
      return;
    }

    const creado = crearClienteDirectorio({
      nombre: nombreSanitizado,
      correo: correoSanitizado,
      telefono: telefonoSanitizado,
    });
    seleccionarCliente(creado);
    setNuevoCliNombre("");
    setNuevoCliCorreo("");
    setNuevoCliTelefono("+56 9 ");
    void dispararNotificacionExito(reducirMovimiento);
    setAviso({
      titulo: "Cliente registrado",
      mensaje: `${creado.nombre} fue asignado al pedido.`,
      tono: "exito",
    });
  };

  const varianteActivaDe = (prod: ProductoCatalogoAdmin) => {
    const tallaElegida = tallaPorProducto[prod.id];
    const porTalla = prod.variantes.find((v) => v.talla === tallaElegida);
    if (
      porTalla &&
      (!filtroStockCritico ||
        (porTalla.stock > 0 && porTalla.stock <= STOCK_CRITICO_MAX))
    ) {
      return porTalla;
    }
    if (filtroStockCritico) {
      return (
        prod.variantes.find(
          (v) => v.stock > 0 && v.stock <= STOCK_CRITICO_MAX
        ) ??
        porTalla ??
        prod.variantes[0]
      );
    }
    return (
      porTalla ??
      prod.variantes.find((v) => v.stock > 0) ??
      prod.variantes[0]
    );
  };

  const cambiarCantidadSku = (
    prod: ProductoCatalogoAdmin,
    sku: string,
    talla: string,
    stockDisponible: number,
    delta: number
  ) => {
    setMensajeStockLive(null);
    setErrores((prev) => ({ ...prev, productos: undefined }));
    const actualActual =
      lineasPedido.find((it) => it.sku === sku)?.cantidad ?? 0;
    if (delta > 0 && actualActual + delta > stockDisponible) {
      void dispararNotificacionError(reducirMovimiento);
      setMensajeStockLive(
        stockDisponible === 0
          ? `${prod.nombre} (Talla ${talla}) está agotado.`
          : `Stock máximo alcanzado para ${prod.nombre} Talla ${talla} (${stockDisponible} un.).`
      );
      return;
    }
    setLineasPedido((prev) => {
      const idx = prev.findIndex((it) => it.sku === sku);
      const actual = idx >= 0 ? prev[idx].cantidad : 0;
      const siguiente = actual + delta;
      if (delta > 0 && siguiente > stockDisponible) return prev;
      if (siguiente <= 0) return prev.filter((it) => it.sku !== sku);
      if (idx >= 0) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: siguiente };
        return copia;
      }
      return [
        ...prev,
        {
          sku,
          nombre: prod.nombre,
          talla,
          color: prod.color,
          cantidad: 1,
          precioUnitario: prod.precio,
        },
      ];
    });
  };

  const ajustarLineaAMaximo = (sku: string, maximo: number) => {
    setLineasPedido((prev) =>
      maximo <= 0
        ? prev.filter((it) => it.sku !== sku)
        : prev.map((it) => (it.sku === sku ? { ...it, cantidad: maximo } : it))
    );
    setMensajeStockLive(null);
  };

  const handleSimularBajaStock = () => {
    const lineaObjetivo =
      lineasPedido.find((l) => l.sku && (stockActualPorSku[l.sku] ?? 0) > 0) ??
      { sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M" };
    if (!lineaObjetivo.sku) return;
    const restante = simularBajaExternaStock(lineaObjetivo.sku);
    if (restante !== null) {
      setAviso({
        titulo: "Stock actualizado en vivo",
        mensaje: `${lineaObjetivo.nombre} (${lineaObjetivo.talla ?? ""}) ahora tiene ${restante} un. disponibles.`,
        tono: "info",
      });
    }
  };

  const validarFormulario = (): boolean => {
    const errs: ErroresFormulario = {};
    if (!clienteSeleccionado) {
      errs.cliente = "Selecciona un cliente o crea uno nuevo para continuar.";
    }
    if (lineasPedido.length === 0) {
      errs.productos = "Agrega al menos un producto al pedido.";
    }
    if (direccion.trim().length < 5) {
      errs.direccion =
        "Ingresa una dirección de despacho válida (mín. 5 caracteres).";
    }
    if (comuna.trim().length < 2) {
      errs.comuna =
        "Selecciona o escribe una comuna de la Región Metropolitana.";
    }
    setErrores(errs);
    if (Object.keys(errs).length > 0) {
      void dispararNotificacionError(reducirMovimiento);
      setAviso({
        titulo: "Revisa los campos obligatorios",
        mensaje: "Hay datos pendientes antes de confirmar el pedido.",
        tono: "error",
      });
      return false;
    }
    if (conflictosStock.length > 0) {
      void dispararNotificacionError(reducirMovimiento);
      setAviso({
        titulo: "Stock insuficiente",
        mensaje: "Ajusta las cantidades que superan el inventario disponible.",
        tono: "error",
      });
      return false;
    }
    return true;
  };

  const ejecutarEnvioPedido = useCallback(async () => {
    if (enviando || !clienteSeleccionado) return;
    setModalConfirmacion(null);
    setEnviando(true);
    try {
      const resultado = await crearOrden(
        sanitizarInput(clienteSeleccionado.nombre),
        sanitizarInput(direccion),
        sanitizarInput(comuna),
        lineasPedido,
        `${transportista} · ${ventanaHoraria}`,
        {
          clienteId: clienteSeleccionado.id,
          clienteEmail: clienteSeleccionado.correo,
          clienteTelefono: clienteSeleccionado.telefono,
          transportista,
          ventanaHoraria,
          notaInterna: sanitizarInput(notaInterna) || undefined,
          metodoPago,
          costoEnvio: desglose.envio,
          creadoPorAdmin: true,
          idempotencyKey,
        }
      );
      if (!resultado.ok || !resultado.pedido) {
        void dispararNotificacionError(reducirMovimiento);
        setAviso({
          titulo: "No se pudo confirmar el pedido",
          mensaje: resultado.mensaje ?? "Intenta nuevamente.",
          tono: "error",
        });
        return;
      }
      void dispararNotificacionExito(reducirMovimiento);
      setPedidoCreado(resultado.pedido);
    } finally {
      setEnviando(false);
    }
  }, [
    enviando,
    clienteSeleccionado,
    crearOrden,
    direccion,
    comuna,
    lineasPedido,
    transportista,
    ventanaHoraria,
    notaInterna,
    metodoPago,
    desglose.envio,
    idempotencyKey,
    reducirMovimiento,
  ]);

  const intentarConfirmar = (onInvalido?: () => void) => {
    if (enviando) return;
    if (!validarFormulario() || !clienteSeleccionado) {
      onInvalido?.();
      return;
    }
    const duplicado = detectarDuplicadoReciente(
      clienteSeleccionado.nombre,
      desglose.total,
      clienteSeleccionado.id
    );
    if (duplicado) {
      setModalConfirmacion({ tipo: "duplicado", pedidoPrevio: duplicado });
      return;
    }
    if (umbralConfirmacion > 0 && desglose.total >= umbralConfirmacion) {
      setModalConfirmacion({ tipo: "monto_alto" });
      return;
    }
    void ejecutarEnvioPedido();
  };

  const reiniciarParaOtroPedido = () => {
    setPedidoCreado(null);
    setClienteSeleccionado(null);
    setBusquedaCliente("");
    setLineasPedido([]);
    setDireccion("");
    setComuna(COMUNAS_RM[0]);
    setNotaInterna("");
    setErrores({});
    setMensajeStockLive(null);
    setIdempotencyKey(generarIdempotencyKey());
  };

  return {
    reducirMovimiento,
    catalogo,
    tecladoVisible,
    busquedaCliente,
    setBusquedaCliente,
    clienteSeleccionado,
    setClienteSeleccionado,
    mostrarNuevoCliente,
    setMostrarNuevoCliente,
    nuevoCliNombre,
    setNuevoCliNombre,
    nuevoCliCorreo,
    setNuevoCliCorreo,
    nuevoCliTelefono,
    setNuevoCliTelefono,
    erroresNuevoCli,
    setErroresNuevoCli,
    busquedaProducto,
    setBusquedaProducto,
    filtroStockCritico,
    setFiltroStockCritico,
    setTallaPorProducto,
    lineasPedido,
    mensajeStockLive,
    direccion,
    setDireccion,
    comuna,
    setComuna,
    transportista,
    setTransportista,
    ventanaHoraria,
    setVentanaHoraria,
    notaInterna,
    setNotaInterna,
    metodoPago,
    setMetodoPago,
    umbralTexto,
    setUmbralTexto,
    errores,
    setErrores,
    enviando,
    modalConfirmacion,
    setModalConfirmacion,
    pedidoCreado,
    aviso,
    setAviso,
    clientesFiltrados,
    productosFiltrados,
    desglose,
    umbralConfirmacion,
    stockActualPorSku,
    conflictosStock,
    seleccionarCliente,
    guardarNuevoCliente,
    varianteActivaDe,
    cambiarCantidadSku,
    ajustarLineaAMaximo,
    handleSimularBajaStock,
    ejecutarEnvioPedido,
    intentarConfirmar,
    reiniciarParaOtroPedido,
  };
}
