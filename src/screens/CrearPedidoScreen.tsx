// ─── Pantalla ADMIN: Crear pedido (Operaciones) ──────────────────
//
// Flujo en 1 pantalla y 4 bloques para crear un pedido en nombre de un cliente:
//   1. Cliente (buscador + historial + creación inline)
//   2. Productos (buscador + variante talla + stock vivo + Crítico <=4)
//   3. Despacho RM (dirección, comuna, Bluex/Starken/Chilexpress, ventana, nota)
//   4. Resumen fijo (sticky en desktop/tablet, teclado-seguro en móvil)

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { router } from "expo-router";

import { AvisoFlotante, TonoAviso } from "../components/AvisoFlotante";
import { Boton } from "../components/Boton";
import { BotonSalir } from "../components/BotonSalir";
import { CampoTexto } from "../components/CampoTexto";
import { EstadoPedidoBadge } from "../components/EstadoPedidoBadge";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { usePedidos } from "../context/PedidosContext";
import { useReducirMovimiento } from "../hooks/useReducirMovimiento";
import {
  buscarClientes,
  calcularTotalesChile,
  COMUNAS_RM,
  crearClienteDirectorio,
  ENVIO_GRATIS_DESDE_CLP,
  simularBajaExternaStock,
  STOCK_CRITICO_MAX,
  TRANSPORTISTAS,
  UMBRAL_CONFIRMACION_DEFAULT,
  VENTANAS_HORARIAS,
} from "../services/operacionesMock";
import {
  ConflictoStock,
  detectarDuplicadoReciente,
} from "../services/pedidosApi";
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
  ClienteAdmin,
  ItemPedido,
  MetodoPago,
  Pedido,
  ProductoCatalogoAdmin,
  Transportista,
} from "../types/pedido";

const METODOS_PAGO: MetodoPago[] = [
  "Transferencia",
  "Link de pago",
  "Débito / Crédito",
];

const PRESETS_UMBRAL = [100_000, 150_000, 250_000, 0] as const;

function generarIdempotencyKey(): string {
  return `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatearCLP(valor: number): string {
  return "$" + Math.round(valor).toLocaleString("es-CL");
}

interface ErroresFormulario {
  cliente?: string;
  productos?: string;
  direccion?: string;
  comuna?: string;
}

interface ModalConfirmacionState {
  tipo: "monto_alto" | "duplicado";
  pedidoPrevio?: Pedido;
}

export function CrearPedidoScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const reducirMovimiento = useReducirMovimiento();
  const { catalogo, crearOrden } = usePedidos();

  const scrollPrincipalRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

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

  // ─── Bloque 1: Cliente ─────────────────────────────────────────
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

  // ─── Bloque 2: Productos ───────────────────────────────────────
  const [busquedaProducto, setBusquedaProducto] = useState("");
  const [filtroStockCritico, setFiltroStockCritico] = useState(false);
  const [tallaPorProducto, setTallaPorProducto] = useState<
    Record<string, string>
  >({});
  const [lineasPedido, setLineasPedido] = useState<ItemPedido[]>([]);
  const [mensajeStockLive, setMensajeStockLive] = useState<string | null>(null);

  // ─── Bloque 3: Despacho (RM) ───────────────────────────────────
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState<string>(COMUNAS_RM[0]);
  const [transportista, setTransportista] = useState<Transportista>("Bluex");
  const [ventanaHoraria, setVentanaHoraria] = useState<string>(
    VENTANAS_HORARIAS[0]
  );
  const [notaInterna, setNotaInterna] = useState("");

  // ─── Bloque 4: Pago, umbral e idempotencia ─────────────────────
  const [metodoPago, setMetodoPago] = useState<MetodoPago>("Transferencia");
  const [umbralTexto, setUmbralTexto] = useState(
    String(UMBRAL_CONFIRMACION_DEFAULT)
  );
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    generarIdempotencyKey()
  );

  // ─── Estados de flujo ──────────────────────────────────────────
  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [enviando, setEnviando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] =
    useState<ModalConfirmacionState | null>(null);
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
    const errs: { nombre?: string; correo?: string; telefono?: string } = {};
    if (nuevoCliNombre.trim().length < 3) {
      errs.nombre = "Ingresa el nombre completo del cliente.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoCliCorreo.trim())) {
      errs.correo = "Ingresa un correo válido (ej. nombre@correo.cl).";
    }
    if (nuevoCliTelefono.replace(/\D/g, "").length < 8) {
      errs.telefono = "Ingresa un teléfono válido de al menos 8 dígitos.";
    }
    setErroresNuevoCli(errs);
    if (Object.keys(errs).length > 0) return;

    const creado = crearClienteDirectorio({
      nombre: nuevoCliNombre,
      correo: nuevoCliCorreo,
      telefono: nuevoCliTelefono,
    });
    seleccionarCliente(creado);
    setNuevoCliNombre("");
    setNuevoCliCorreo("");
    setNuevoCliTelefono("+56 9 ");
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

      if (delta > 0 && siguiente > stockDisponible) {
        return prev;
      }

      if (siguiente <= 0) {
        return prev.filter((it) => it.sku !== sku);
      }

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
      scrollPrincipalRef.current?.scrollTo({
        y: 0,
        animated: !reducirMovimiento,
      });
      setAviso({
        titulo: "Revisa los campos obligatorios",
        mensaje: "Hay datos pendientes antes de confirmar el pedido.",
        tono: "error",
      });
      return false;
    }

    if (conflictosStock.length > 0) {
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
        clienteSeleccionado.nombre,
        direccion.trim(),
        comuna.trim(),
        lineasPedido,
        `${transportista} · ${ventanaHoraria}`,
        {
          clienteId: clienteSeleccionado.id,
          clienteEmail: clienteSeleccionado.correo,
          clienteTelefono: clienteSeleccionado.telefono,
          transportista,
          ventanaHoraria,
          notaInterna,
          metodoPago,
          costoEnvio: desglose.envio,
          creadoPorAdmin: true,
          idempotencyKey,
        }
      );

      if (!resultado.ok || !resultado.pedido) {
        setAviso({
          titulo: "No se pudo confirmar el pedido",
          mensaje: resultado.mensaje ?? "Intenta nuevamente.",
          tono: "error",
        });
        return;
      }

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
  ]);

  const intentarConfirmar = () => {
    if (enviando) return;
    if (!validarFormulario() || !clienteSeleccionado) return;

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

  if (pedidoCreado) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colores.fondo }]}
        edges={["top"]}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollExito,
            esAncho && styles.scrollAncho,
          ]}
        >
          <View
            style={[
              styles.tarjetaExito,
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
                styles.iconoExito,
                {
                  backgroundColor: colores.exitoSuave,
                  borderRadius: RADIOS.pill,
                },
              ]}
            >
              <Icon
                name="circle-check"
                size={34}
                color={colores.puntoEstado.entregado}
              />
            </View>

            <EstadoPedidoBadge estado={pedidoCreado.estado} />

            <Text
              accessibilityRole="header"
              style={[
                tipografia.display,
                styles.tituloExito,
                { color: colores.tinta },
              ]}
            >
              Pedido creado con éxito
            </Text>

            <View
              style={[
                styles.codigoCajaExito,
                {
                  backgroundColor: colores.panelOscuro,
                  borderColor: colores.panelOscuroBorde,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <Text style={[tipografia.micro, { color: "#9ab5ff" }]}>
                NÚMERO DE ORDEN · REFERENCIA AN-{pedidoCreado.codigo}
              </Text>
              <Text
                style={[
                  tipografia.codigo,
                  { color: "#ffffff", fontSize: 28, letterSpacing: 3 },
                ]}
              >
                #{pedidoCreado.codigo}
              </Text>
              <Text style={[tipografia.caption, { color: "#c4cdd8" }]}>
                Comparte el código {pedidoCreado.codigo} para rastreo del
                cliente
              </Text>
            </View>

            <View
              style={[
                styles.resumenExito,
                {
                  backgroundColor: colores.superficieHundida,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.md,
                },
              ]}
            >
              <View style={styles.filaResumen}>
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  Cliente
                </Text>
                <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                  {pedidoCreado.clienteNombre}
                </Text>
              </View>
              <View style={styles.filaResumen}>
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  Despacho
                </Text>
                <Text style={[tipografia.caption, { color: colores.tinta }]}>
                  {pedidoCreado.comuna} · {pedidoCreado.metodoEnvio}
                </Text>
              </View>
              <View style={styles.filaResumen}>
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  Total ({pedidoCreado.metodoPago ?? "Confirmado"})
                </Text>
                <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                  {formatearCLP(pedidoCreado.totalEstimado)}
                </Text>
              </View>
            </View>

            <View style={styles.accionesExito}>
              <Boton
                etiqueta="Ver seguimiento"
                icono="package-search"
                anchoCompleto
                onPress={() =>
                  router.push({
                    pathname: "/cliente",
                    params: { codigo: pedidoCreado.codigo },
                  })
                }
              />
              <Boton
                etiqueta="Crear otro pedido"
                icono="plus"
                variante="secundario"
                anchoCompleto
                onPress={reiniciarParaOtroPedido}
              />
              <Boton
                etiqueta="Volver a Pedidos"
                variante="fantasma"
                anchoCompleto
                onPress={() => router.replace("/")}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const bloqueResumen = (
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
        <Text
          style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
        >
          BLOQUE 4 · RESUMEN
        </Text>
        <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
          Detalle del pedido
        </Text>
      </View>

      {lineasPedido.length === 0 ? (
        <View
          style={[
            styles.vacioResumen,
            {
              backgroundColor: colores.superficieHundida,
              borderColor: errores.productos ? colores.error : colores.borde,
              borderRadius: RADIOS.md,
            },
          ]}
        >
          <Icon
            name="shopping-bag"
            size={22}
            color={errores.productos ? colores.error : colores.tintaTerciaria}
          />
          <Text
            style={[
              tipografia.caption,
              {
                color: errores.productos
                  ? colores.error
                  : colores.tintaSecundaria,
                textAlign: "center",
              },
            ]}
          >
            {errores.productos ??
              "Sin prendas agregadas todavía. Selecciona tallas en el Bloque 2."}
          </Text>
        </View>
      ) : (
        <View style={styles.listaLineas}>
          {lineasPedido.map((linea) => {
            const disp = linea.sku ? (stockActualPorSku[linea.sku] ?? 0) : 99;
            const enConflicto = linea.cantidad > disp;
            const prodRef = catalogo.find((p) =>
              p.variantes.some((v) => v.sku === linea.sku)
            );
            return (
              <View
                key={linea.sku ?? linea.nombre}
                style={[
                  styles.lineaItem,
                  {
                    backgroundColor: enConflicto
                      ? colores.errorSuave
                      : colores.superficieHundida,
                    borderColor: enConflicto ? colores.error : colores.borde,
                    borderRadius: RADIOS.sm,
                  },
                ]}
              >
                <View style={styles.lineaItemInfo}>
                  <Text
                    style={[tipografia.etiqueta, { color: colores.tinta }]}
                    numberOfLines={1}
                  >
                    {linea.cantidad}× {linea.nombre}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Talla {linea.talla} · {linea.sku}
                  </Text>
                  {enConflicto ? (
                    <View style={styles.conflictoLineaFila}>
                      <Text
                        accessibilityRole="alert"
                        style={[tipografia.caption, { color: colores.error }]}
                      >
                        Stock actual: {disp} un.
                      </Text>
                      <Pressable
                        onPress={() =>
                          linea.sku && ajustarLineaAMaximo(linea.sku, disp)
                        }
                        accessibilityRole="button"
                        style={styles.linkAjustar}
                      >
                        <Text
                          style={[
                            tipografia.caption,
                            {
                              color: colores.acentoIntenso,
                              fontFamily: FUENTES.semi,
                            },
                          ]}
                        >
                          {disp === 0 ? "Quitar" : `Ajustar a ${disp}`}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>

                <View style={styles.lineaDerecha}>
                  <Text style={[tipografia.micro, { color: colores.tinta }]}>
                    {formatearCLP((linea.precioUnitario ?? 0) * linea.cantidad)}
                  </Text>
                  {prodRef && linea.sku ? (
                    <Pressable
                      onPress={() =>
                        cambiarCantidadSku(
                          prodRef,
                          linea.sku!,
                          linea.talla ?? "",
                          disp,
                          -linea.cantidad
                        )
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar ${linea.nombre} del pedido`}
                      style={{
                        minWidth: puntoMinimo,
                        minHeight: puntoMinimo,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon name="trash-2" size={16} color={colores.error} />
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {conflictosStock.length > 0 ? (
        <View
          accessibilityLiveRegion="assertive"
          accessibilityRole="alert"
          style={[
            styles.alertaStock,
            {
              backgroundColor: colores.errorSuave,
              borderColor: colores.error,
              borderRadius: RADIOS.sm,
            },
          ]}
        >
          <Icon name="triangle-alert" size={16} color={colores.error} />
          <Text
            style={[tipografia.caption, { color: colores.error, flex: 1 }]}
          >
            {conflictosStock.length} ítem(s) superan el stock actual disponible.
            Ajusta antes de confirmar.
          </Text>
        </View>
      ) : null}

      <View
        accessibilityLiveRegion="polite"
        style={[styles.desgloseCaja, { borderTopColor: colores.borde }]}
      >
        <View style={styles.filaResumen}>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            Subtotal
          </Text>
          <Text style={[tipografia.micro, { color: colores.tinta }]}>
            {formatearCLP(desglose.subtotal)}
          </Text>
        </View>

        <View style={styles.filaResumen}>
          <Text
            style={[tipografia.caption, { color: colores.tintaSecundaria }]}
          >
            IVA 19% incluido
          </Text>
          <Text
            style={[tipografia.micro, { color: colores.tintaSecundaria }]}
          >
            {formatearCLP(desglose.ivaIncluido)}
          </Text>
        </View>

        <View style={styles.filaResumen}>
          <View style={styles.envioLabel}>
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Envío
            </Text>
            {desglose.subtotal > 0 && desglose.envio === 0 ? (
              <View
                style={[
                  styles.pillGratis,
                  {
                    backgroundColor: colores.exitoSuave,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.exito, fontFamily: FUENTES.semi },
                  ]}
                >
                  Gratis &gt;$80k
                </Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              tipografia.micro,
              {
                color:
                  desglose.subtotal > 0 && desglose.envio === 0
                    ? colores.exito
                    : colores.tinta,
              },
            ]}
          >
            {desglose.subtotal === 0
              ? "$0"
              : desglose.envio === 0
                ? "Gratis"
                : formatearCLP(desglose.envio)}
          </Text>
        </View>

        {desglose.subtotal > 0 &&
          desglose.subtotal < ENVIO_GRATIS_DESDE_CLP ? (
          <Text style={[tipografia.caption, { color: colores.acentoIntenso }]}>
            Faltan {formatearCLP(ENVIO_GRATIS_DESDE_CLP - desglose.subtotal)}{" "}
            para envío gratis.
          </Text>
        ) : null}

        <View style={[styles.totalLinea, { borderTopColor: colores.borde }]}>
          <Text style={[tipografia.cuerpoFuerte, { color: colores.tinta }]}>
            Total CLP
          </Text>
          <Text style={[tipografia.metrica, { color: colores.tinta }]}>
            {formatearCLP(desglose.total)}
          </Text>
        </View>
      </View>

      <View style={styles.grupoChips}>
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          MÉTODO DE PAGO
        </Text>
        <View style={styles.chipsWrap}>
          {METODOS_PAGO.map((m) => {
            const activo = metodoPago === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMetodoPago(m)}
                accessibilityRole="button"
                accessibilityState={{ selected: activo }}
                style={({ pressed }) => [
                  styles.chipOpcion,
                  {
                    minHeight: puntoMinimo,
                    backgroundColor: activo
                      ? colores.acentoSuave
                      : colores.superficieHundida,
                    borderColor: activo ? colores.acento : colores.borde,
                    borderRadius: RADIOS.sm,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: activo
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                      fontFamily: activo ? FUENTES.semi : FUENTES.medio,
                    },
                  ]}
                >
                  {m}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View
        style={[
          styles.umbralCaja,
          {
            backgroundColor: colores.superficieHundida,
            borderColor: colores.borde,
            borderRadius: RADIOS.md,
          },
        ]}
      >
        <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
          CONFIRMAR MONTO ALTO DESDE (CLP)
        </Text>
        <View style={styles.umbralInputFila}>
          <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
            $
          </Text>
          <TextInput
            style={[
              styles.umbralInput,
              tipografia.micro,
              {
                color: colores.tinta,
                backgroundColor: colores.superficie,
                borderColor: colores.borde,
                borderRadius: RADIOS.sm,
              },
            ]}
            value={umbralTexto}
            onChangeText={(txt) => setUmbralTexto(txt.replace(/\D/g, ""))}
            keyboardType="numeric"
            placeholder="0 (sin tope)"
            placeholderTextColor={colores.tintaTerciaria}
            accessibilityLabel="Monto umbral en CLP para pedir confirmación previa"
          />
        </View>
        <View style={styles.chipsWrap}>
          {PRESETS_UMBRAL.map((monto) => {
            const seleccionado = umbralConfirmacion === monto;
            return (
              <Pressable
                key={String(monto)}
                onPress={() => setUmbralTexto(String(monto))}
                accessibilityRole="button"
                accessibilityState={{ selected: seleccionado }}
                style={[
                  styles.chipMini,
                  {
                    minHeight: 36,
                    backgroundColor: seleccionado
                      ? colores.acentoSuave
                      : colores.superficie,
                    borderColor: seleccionado ? colores.acento : colores.borde,
                    borderRadius: RADIOS.pill,
                  },
                ]}
              >
                <Text
                  style={[
                    tipografia.caption,
                    {
                      color: seleccionado
                        ? colores.acentoIntenso
                        : colores.tintaSecundaria,
                    },
                  ]}
                >
                  {monto === 0 ? "Sin tope" : formatearCLP(monto)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Boton
        etiqueta={enviando ? "Confirmando pedido…" : "Confirmar pedido"}
        icono="check"
        cargando={enviando}
        deshabilitado={enviando}
        anchoCompleto
        onPress={intentarConfirmar}
      />
    </View>
  );

  const formularioBloques = (
    <View style={styles.bloquesColumna}>
      {/* BLOQUE 1: CLIENTE */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: errores.cliente ? colores.error : colores.borde,
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
            etiqueta={
              mostrarNuevoCliente ? "Cancelar" : "Crear cliente nuevo"
            }
            icono={mostrarNuevoCliente ? "x" : "user-plus"}
            variante="secundario"
            compacto
            onPress={() => setMostrarNuevoCliente((v) => !v)}
          />
        </View>

        {errores.cliente ? (
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
              {errores.cliente}
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
                style={[
                  tipografia.caption,
                  { color: colores.tintaSecundaria },
                ]}
              >
                {clienteSeleccionado.correo} · {clienteSeleccionado.telefono}
              </Text>
              <Text
                style={[tipografia.micro, { color: colores.acentoIntenso }]}
              >
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
              onPress={() => setClienteSeleccionado(null)}
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
              onCambio={(v) => {
                setNuevoCliNombre(v);
                setErroresNuevoCli((p) => ({ ...p, nombre: undefined }));
              }}
              placeholder="Ej: Sofía Méndez"
              icono="user"
              error={erroresNuevoCli.nombre}
            />
            <CampoTexto
              etiqueta="Correo electrónico"
              valor={nuevoCliCorreo}
              onCambio={(v) => {
                setNuevoCliCorreo(v);
                setErroresNuevoCli((p) => ({ ...p, correo: undefined }));
              }}
              placeholder="sofia@correo.cl"
              icono="mail"
              keyboardType="email-address"
              autoCapitalize="none"
              error={erroresNuevoCli.correo}
            />
            <CampoTexto
              etiqueta="Teléfono"
              valor={nuevoCliTelefono}
              onCambio={(v) => {
                setNuevoCliTelefono(v);
                setErroresNuevoCli((p) => ({ ...p, telefono: undefined }));
              }}
              placeholder="+56 9 1234 5678"
              icono="phone"
              keyboardType="phone-pad"
              error={erroresNuevoCli.telefono}
            />
            <Boton
              etiqueta="Guardar y asignar cliente"
              icono="user-check"
              anchoCompleto
              onPress={guardarNuevoCliente}
            />
          </View>
        ) : !clienteSeleccionado ? (
          <View style={styles.buscadorClientesWrap}>
            <CampoTexto
              etiqueta="Buscar cliente"
              valor={busquedaCliente}
              onCambio={setBusquedaCliente}
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
                  style={[
                    tipografia.caption,
                    { color: colores.tintaSecundaria },
                  ]}
                >
                  No encontramos clientes para &ldquo;{busquedaCliente}&rdquo;.
                </Text>
                <Boton
                  etiqueta="Crear cliente nuevo"
                  icono="user-plus"
                  variante="secundario"
                  compacto
                  onPress={() => {
                    setNuevoCliNombre(busquedaCliente.trim());
                    setMostrarNuevoCliente(true);
                  }}
                />
              </View>
            ) : (
              <View style={styles.listaResultados}>
                {clientesFiltrados.map((cli) => (
                  <Pressable
                    key={cli.id}
                    onPress={() => seleccionarCliente(cli)}
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
                ))}
              </View>
            )}
          </View>
        ) : null}
      </View>

      {/* BLOQUE 2: PRODUCTOS */}
      <View
        style={[
          styles.panel,
          {
            backgroundColor: colores.superficie,
            borderColor: errores.productos ? colores.error : colores.borde,
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
              BLOQUE 2 · PRODUCTOS
            </Text>
            <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
              Catálogo y stock en vivo
            </Text>
          </View>

          <Pressable
            onPress={handleSimularBajaStock}
            accessibilityRole="button"
            accessibilityLabel="Simular caída externa de stock para pruebas"
            style={({ pressed }) => [
              styles.chipMini,
              {
                minHeight: puntoMinimo,
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.pill,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon name="activity" size={14} color={colores.tintaSecundaria} />
            <Text
              style={[tipografia.caption, { color: colores.tintaSecundaria }]}
            >
              Simular baja stock
            </Text>
          </Pressable>
        </View>

        <CampoTexto
          etiqueta="Buscar prenda o SKU"
          valor={busquedaProducto}
          onCambio={setBusquedaProducto}
          placeholder="Noir, Denim, AN-HDY…"
          icono="search"
          autoCapitalize="none"
        />

        <View style={styles.chipsWrap}>
          <Pressable
            onPress={() => setFiltroStockCritico(false)}
            accessibilityRole="button"
            accessibilityState={{ selected: !filtroStockCritico }}
            style={[
              styles.chipOpcion,
              {
                minHeight: puntoMinimo,
                backgroundColor: !filtroStockCritico
                  ? colores.acentoSuave
                  : colores.superficieHundida,
                borderColor: !filtroStockCritico
                  ? colores.acento
                  : colores.borde,
                borderRadius: RADIOS.pill,
              },
            ]}
          >
            <Text
              style={[
                tipografia.caption,
                {
                  color: !filtroStockCritico
                    ? colores.acentoIntenso
                    : colores.tintaSecundaria,
                },
              ]}
            >
              Todos ({catalogo.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setFiltroStockCritico(true)}
            accessibilityRole="button"
            accessibilityState={{ selected: filtroStockCritico }}
            style={[
              styles.chipOpcion,
              {
                minHeight: puntoMinimo,
                backgroundColor: filtroStockCritico
                  ? colores.advertenciaSuave
                  : colores.superficieHundida,
                borderColor: filtroStockCritico
                  ? colores.puntoEstado.preparando
                  : colores.borde,
                borderRadius: RADIOS.pill,
              },
            ]}
          >
            <Text
              style={[
                tipografia.caption,
                {
                  color: filtroStockCritico
                    ? colores.advertencia
                    : colores.tintaSecundaria,
                },
              ]}
            >
              Stock crítico (≤{STOCK_CRITICO_MAX} un.)
            </Text>
          </Pressable>
        </View>

        {mensajeStockLive ? (
          <View
            accessibilityLiveRegion="assertive"
            style={[
              styles.alertaInline,
              {
                backgroundColor: colores.advertenciaSuave,
                borderRadius: RADIOS.sm,
              },
            ]}
          >
            <Icon name="triangle-alert" size={15} color={colores.advertencia} />
            <Text
              style={[
                tipografia.caption,
                { color: colores.advertencia, flex: 1 },
              ]}
            >
              {mensajeStockLive}
            </Text>
          </View>
        ) : null}

        {errores.productos ? (
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
              {errores.productos}
            </Text>
          </View>
        ) : null}

        <View style={styles.productosLista}>
          {productosFiltrados.length === 0 ? (
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
                style={[
                  tipografia.caption,
                  { color: colores.tintaSecundaria, textAlign: "center" },
                ]}
              >
                No hay prendas que coincidan con los filtros actuales.
              </Text>
              <Boton
                etiqueta="Limpiar filtros"
                variante="secundario"
                compacto
                onPress={() => {
                  setBusquedaProducto("");
                  setFiltroStockCritico(false);
                }}
              />
            </View>
          ) : null}
          {productosFiltrados.map((prod) => {
            const variante = varianteActivaDe(prod);
            const lineaEnCarrito = lineasPedido.find(
              (l) => l.sku === variante.sku
            );
            const cantidad = lineaEnCarrito?.cantidad ?? 0;
            const esCritico =
              variante.stock > 0 && variante.stock <= STOCK_CRITICO_MAX;
            const agotado = variante.stock === 0;
            const porcentajeStock = Math.min(
              100,
              Math.round(
                (variante.stock / Math.max(1, variante.stockInicial)) * 100
              )
            );

            return (
              <View
                key={prod.id}
                style={[
                  styles.productCard,
                  {
                    backgroundColor: colores.superficieHundida,
                    borderColor: colores.borde,
                    borderRadius: RADIOS.md,
                  },
                ]}
              >
                <View style={styles.productTop}>
                  <View style={styles.productTitulos}>
                    <Text
                      style={[
                        tipografia.micro,
                        { color: colores.tintaTerciaria },
                      ]}
                    >
                      {prod.categoria.toUpperCase()} · {variante.sku}
                    </Text>
                    <Text
                      style={[
                        tipografia.cuerpoFuerte,
                        { color: colores.tinta },
                      ]}
                    >
                      {prod.nombre}
                    </Text>
                    <Text
                      style={[
                        tipografia.caption,
                        { color: colores.tintaSecundaria },
                      ]}
                    >
                      {prod.color}
                    </Text>
                  </View>

                  <Text
                    style={[tipografia.subtitulo, { color: colores.tinta }]}
                  >
                    {formatearCLP(prod.precio)}
                  </Text>
                </View>

                <View style={styles.chipsWrap}>
                  {prod.variantes.map((v) => {
                    const seleccionada = v.sku === variante.sku;
                    const sinStock = v.stock === 0;
                    return (
                      <Pressable
                        key={v.sku}
                        onPress={() =>
                          setTallaPorProducto((prev) => ({
                            ...prev,
                            [prod.id]: v.talla,
                          }))
                        }
                        accessibilityRole="button"
                        accessibilityState={{ selected: seleccionada }}
                        accessibilityLabel={`Talla ${v.talla}, ${v.stock} disponibles`}
                        style={[
                          styles.chipTalla,
                          {
                            minHeight: puntoMinimo,
                            minWidth: 56,
                            backgroundColor: seleccionada
                              ? colores.acentoSuave
                              : colores.superficie,
                            borderColor: seleccionada
                              ? colores.acento
                              : colores.borde,
                            borderRadius: RADIOS.sm,
                            opacity: sinStock && !seleccionada ? 0.55 : 1,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            tipografia.caption,
                            {
                              color: seleccionada
                                ? colores.acentoIntenso
                                : colores.tinta,
                              fontFamily: seleccionada
                                ? FUENTES.semi
                                : FUENTES.regular,
                            },
                          ]}
                        >
                          {v.talla} ({v.stock})
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.productBottom}>
                  <View style={styles.stockColumna}>
                    <View style={styles.stockBadges}>
                      <Text
                        style={[
                          tipografia.caption,
                          {
                            color: agotado
                              ? colores.error
                              : esCritico
                                ? colores.advertencia
                                : colores.tintaSecundaria,
                            fontFamily: FUENTES.semi,
                          },
                        ]}
                      >
                        {agotado
                          ? "Sin stock"
                          : `Stock: ${variante.stock} un.`}
                      </Text>

                      {esCritico ? (
                        <View
                          style={[
                            styles.pillCritico,
                            {
                              backgroundColor: colores.advertenciaSuave,
                              borderRadius: RADIOS.pill,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.dotCritico,
                              {
                                backgroundColor: colores.puntoEstado.preparando,
                              },
                            ]}
                          />
                          <Text
                            style={[
                              tipografia.caption,
                              {
                                color: colores.advertencia,
                                fontFamily: FUENTES.semi,
                              },
                            ]}
                          >
                            Crítico
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    <View
                      style={[
                        styles.stockBarFondo,
                        { backgroundColor: colores.borde },
                      ]}
                    >
                      <View
                        style={[
                          styles.stockBarRelleno,
                          {
                            width: `${porcentajeStock}%`,
                            backgroundColor: agotado
                              ? colores.error
                              : esCritico
                                ? colores.puntoEstado.preparando
                                : colores.puntoEstado.entregado,
                          },
                        ]}
                      />
                    </View>
                  </View>

                  <View style={styles.stepper}>
                    <Pressable
                      onPress={() =>
                        cambiarCantidadSku(
                          prod,
                          variante.sku,
                          variante.talla,
                          variante.stock,
                          -1
                        )
                      }
                      disabled={cantidad === 0}
                      accessibilityRole="button"
                      accessibilityLabel={`Restar ${prod.nombre} talla ${variante.talla}`}
                      style={({ pressed }) => [
                        styles.stepperBoton,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          borderColor: colores.borde,
                          backgroundColor: colores.superficie,
                          opacity: cantidad === 0 ? 0.4 : pressed ? 0.65 : 1,
                        },
                      ]}
                    >
                      <Icon name="minus" size={16} color={colores.tinta} />
                    </Pressable>

                    <Text
                      style={[
                        tipografia.micro,
                        styles.stepperCantidad,
                        { color: colores.tinta },
                      ]}
                    >
                      {cantidad}
                    </Text>

                    <Pressable
                      onPress={() =>
                        cambiarCantidadSku(
                          prod,
                          variante.sku,
                          variante.talla,
                          variante.stock,
                          1
                        )
                      }
                      disabled={agotado || cantidad >= variante.stock}
                      accessibilityRole="button"
                      accessibilityLabel={`Agregar ${prod.nombre} talla ${variante.talla}`}
                      style={({ pressed }) => [
                        styles.stepperBoton,
                        {
                          minWidth: puntoMinimo,
                          minHeight: puntoMinimo,
                          borderColor:
                            cantidad >= variante.stock
                              ? colores.borde
                              : colores.acento,
                          backgroundColor:
                            agotado || cantidad >= variante.stock
                              ? colores.superficie
                              : colores.acentoSuave,
                          opacity:
                            agotado || cantidad >= variante.stock
                              ? 0.45
                              : pressed
                                ? 0.7
                                : 1,
                        },
                      ]}
                    >
                      <Icon
                        name="plus"
                        size={16}
                        color={
                          agotado || cantidad >= variante.stock
                            ? colores.tintaTerciaria
                            : colores.acentoIntenso
                        }
                      />
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* BLOQUE 3: DESPACHO (RM) */}
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
          <Text
            style={[tipografia.eyebrowMono, { color: colores.acentoIntenso }]}
          >
            BLOQUE 3 · DESPACHO (RM)
          </Text>
          <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
            Dirección y courier
          </Text>
        </View>

        <CampoTexto
          etiqueta="Dirección de entrega"
          valor={direccion}
          onCambio={(txt) => {
            setDireccion(txt);
            setErrores((prev) => ({ ...prev, direccion: undefined }));
          }}
          placeholder="Av. Providencia 1450, Dpto 802"
          icono="map-pin"
          error={errores.direccion}
        />

        <View style={styles.grupoChips}>
          <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
            COMUNA (REGIÓN METROPOLITANA)
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsFila}
          >
            {COMUNAS_RM.map((c) => {
              const activa = comuna.trim().toLowerCase() === c.toLowerCase();
              return (
                <Pressable
                  key={c}
                  onPress={() => {
                    setComuna(c);
                    setErrores((prev) => ({ ...prev, comuna: undefined }));
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  style={[
                    styles.chipOpcion,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: activa
                        ? colores.acentoSuave
                        : colores.superficieHundida,
                      borderColor: activa ? colores.acento : colores.borde,
                      borderRadius: RADIOS.pill,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.caption,
                      {
                        color: activa
                          ? colores.acentoIntenso
                          : colores.tintaSecundaria,
                        fontFamily: activa ? FUENTES.semi : FUENTES.medio,
                      },
                    ]}
                  >
                    {c}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          <CampoTexto
            etiqueta="Otra comuna RM / confirmar"
            valor={comuna}
            onCambio={(txt) => {
              setComuna(txt);
              setErrores((prev) => ({ ...prev, comuna: undefined }));
            }}
            placeholder="Ej: Providencia"
            icono="map-pin"
            error={errores.comuna}
          />
        </View>

        <View style={styles.grupoChips}>
          <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
            TRANSPORTISTA
          </Text>
          <View style={styles.chipsWrap}>
            {TRANSPORTISTAS.map((t) => {
              const activo = transportista === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTransportista(t.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activo }}
                  style={[
                    styles.courierCard,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: activo
                        ? colores.acentoSuave
                        : colores.superficieHundida,
                      borderColor: activo ? colores.acento : colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.etiqueta,
                      {
                        color: activo ? colores.acentoIntenso : colores.tinta,
                      },
                    ]}
                  >
                    {t.etiqueta}
                  </Text>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    {t.detalle}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.grupoChips}>
          <Text style={[tipografia.micro, { color: colores.tintaSecundaria }]}>
            VENTANA HORARIA
          </Text>
          <View style={styles.chipsWrap}>
            {VENTANAS_HORARIAS.map((vh) => {
              const activa = ventanaHoraria === vh;
              return (
                <Pressable
                  key={vh}
                  onPress={() => setVentanaHoraria(vh)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activa }}
                  style={[
                    styles.chipOpcion,
                    {
                      minHeight: puntoMinimo,
                      backgroundColor: activa
                        ? colores.acentoSuave
                        : colores.superficieHundida,
                      borderColor: activa ? colores.acento : colores.borde,
                      borderRadius: RADIOS.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      tipografia.caption,
                      {
                        color: activa
                          ? colores.acentoIntenso
                          : colores.tintaSecundaria,
                        fontFamily: activa ? FUENTES.semi : FUENTES.medio,
                      },
                    ]}
                  >
                    {vh}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <CampoTexto
          etiqueta="Nota interna (bodega / courier)"
          valor={notaInterna}
          onCambio={setNotaInterna}
          placeholder="Ej: Llamar al llegar a conserjería, empaque regalo…"
          icono="file-text"
          multilinea
        />
      </View>

      {!esAncho ? bloqueResumen : null}
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colores.fondo }]}
      edges={["top"]}
    >
      <AvisoFlotante
        visible={aviso !== null}
        tono={aviso?.tono ?? "info"}
        icono={aviso?.tono === "error" ? "triangle-alert" : "circle-check"}
        titulo={aviso?.titulo ?? ""}
        mensaje={aviso?.mensaje ?? ""}
        onCerrar={() => setAviso(null)}
      />

      <Modal
        visible={modalConfirmacion !== null}
        transparent
        animationType={reducirMovimiento ? "none" : "fade"}
        onRequestClose={() => setModalConfirmacion(null)}
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
            <View
              style={[
                styles.modalIcono,
                {
                  backgroundColor: colores.advertenciaSuave,
                  borderRadius: RADIOS.pill,
                },
              ]}
            >
              <Icon
                name="shield-alert"
                size={24}
                color={colores.advertencia}
              />
            </View>

            <Text
              accessibilityRole="header"
              style={[tipografia.titulo, { color: colores.tinta }]}
            >
              {modalConfirmacion?.tipo === "duplicado"
                ? "Posible pedido duplicado"
                : "Confirmación de monto alto"}
            </Text>

            <Text
              style={[tipografia.cuerpo, { color: colores.tintaSecundaria }]}
            >
              {modalConfirmacion?.tipo === "duplicado"
                ? `Ya existe el pedido #${modalConfirmacion.pedidoPrevio?.codigo} para ${clienteSeleccionado?.nombre} por ${formatearCLP(desglose.total)} creado hace menos de 3 minutos. ¿Confirmas crear otro?`
                : `Este pedido suma ${formatearCLP(desglose.total)} y supera el umbral configurado (${formatearCLP(umbralConfirmacion)}). ¿Confirmas emitirlo a nombre de ${clienteSeleccionado?.nombre}?`}
            </Text>

            <View style={styles.modalBotones}>
              <Boton
                etiqueta="Revisar pedido"
                variante="secundario"
                anchoCompleto
                onPress={() => setModalConfirmacion(null)}
              />
              <Boton
                etiqueta="Sí, confirmar pedido"
                icono="check"
                anchoCompleto
                onPress={() => void ejecutarEnvioPedido()}
              />
            </View>
          </View>
        </View>
      </Modal>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View
          style={[
            styles.headerBar,
            {
              backgroundColor: colores.superficie,
              borderBottomColor: colores.borde,
            },
          ]}
        >
          <View style={styles.headerIzq}>
            <Pressable
              onPress={() => router.replace("/")}
              accessibilityRole="button"
              accessibilityLabel="Volver a Pedidos"
              style={({ pressed }) => [
                styles.botonAtras,
                {
                  minHeight: puntoMinimo,
                  minWidth: puntoMinimo,
                  backgroundColor: colores.superficieHundida,
                  borderColor: colores.borde,
                  borderRadius: RADIOS.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Icon name="arrow-left" size={17} color={colores.tinta} />
              <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
                Pedidos
              </Text>
            </Pressable>

            <View style={styles.headerTitulos}>
              <Text
                style={[
                  tipografia.eyebrowMono,
                  { color: colores.acentoIntenso },
                ]}
              >
                ADMIN · NUEVO PEDIDO
              </Text>
              <Text
                accessibilityRole="header"
                style={[tipografia.subtitulo, { color: colores.tinta }]}
              >
                Crear pedido
              </Text>
            </View>
          </View>

          <View style={styles.headerDer}>
            <BotonSalir />
            <InterruptorTema />
          </View>
        </View>

        {esAncho ? (
          <View style={styles.layoutDesktop}>
            <ScrollView
              ref={scrollPrincipalRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollDesktopIzq}
            >
              {formularioBloques}
            </ScrollView>
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollDesktopDer}
            >
              {bloqueResumen}
            </ScrollView>
          </View>
        ) : (
          <View style={styles.flex}>
            <ScrollView
              ref={scrollPrincipalRef}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.scrollMovil,
                { paddingBottom: tecladoVisible ? 40 : 120 },
              ]}
            >
              {formularioBloques}
            </ScrollView>

            {!tecladoVisible ? (
              <View
                style={[
                  styles.barraInferiorMovil,
                  {
                    backgroundColor: colores.superficie,
                    borderTopColor: colores.borde,
                    paddingBottom: Math.max(ESPACIOS.md, insets.bottom),
                  },
                  sombraFlotante(modo),
                ]}
              >
                <View style={styles.barraTotalInfo}>
                  <Text
                    style={[
                      tipografia.caption,
                      { color: colores.tintaSecundaria },
                    ]}
                  >
                    Total CLP ({lineasPedido.length} ítems)
                  </Text>
                  <Text style={[tipografia.subtitulo, { color: colores.tinta }]}>
                    {formatearCLP(desglose.total)}
                  </Text>
                </View>
                <Boton
                  etiqueta={enviando ? "Confirmando…" : "Confirmar pedido"}
                  icono="check"
                  cargando={enviando}
                  deshabilitado={enviando}
                  onPress={intentarConfirmar}
                />
              </View>
            ) : null}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: ESPACIOS.lg,
    paddingVertical: ESPACIOS.sm + 2,
    borderBottomWidth: 1,
    gap: ESPACIOS.sm,
  },
  headerIzq: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.md,
    flex: 1,
  },
  headerTitulos: {
    flex: 1,
    minWidth: 0,
  },
  headerDer: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonAtras: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  layoutDesktop: {
    flex: 1,
    flexDirection: "row",
    maxWidth: 1220,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.lg,
    gap: ESPACIOS.lg,
  },
  scrollDesktopIzq: {
    flexGrow: 1,
    paddingBottom: ESPACIOS.xxl * 2,
    minWidth: 460,
  },
  scrollDesktopDer: {
    width: 390,
    paddingBottom: ESPACIOS.xxl * 2,
  },
  scrollMovil: {
    padding: ESPACIOS.lg,
  },
  bloquesColumna: {
    gap: ESPACIOS.lg,
  },
  panel: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  panelHeadFila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  panelHead: {
    gap: 2,
  },
  alertaInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
  },
  buscadorClientesWrap: {
    gap: ESPACIOS.xs,
  },
  listaResultados: {
    gap: ESPACIOS.sm,
  },
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
  clienteInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nuevoClienteBox: {
    padding: ESPACIOS.md,
    borderWidth: 1,
  },
  vacioCaja: {
    padding: ESPACIOS.md,
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.sm,
  },
  chipsFila: {
    gap: ESPACIOS.sm,
    paddingVertical: 2,
  },
  chipOpcion: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  chipMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
    paddingHorizontal: ESPACIOS.md,
    borderWidth: 1,
    cursor: "pointer",
  },
  productosLista: {
    gap: ESPACIOS.md,
  },
  productCard: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  productTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: ESPACIOS.sm,
  },
  productTitulos: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  chipTalla: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: ESPACIOS.sm + 2,
    borderWidth: 1,
    cursor: "pointer",
  },
  productBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  stockColumna: {
    flex: 1,
    minWidth: 140,
    gap: ESPACIOS.xs + 2,
  },
  stockBadges: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  pillCritico: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: ESPACIOS.sm,
    paddingVertical: 2,
  },
  dotCritico: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stockBarFondo: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  stockBarRelleno: {
    height: "100%",
    borderRadius: 3,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
  },
  stepperBoton: {
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  stepperCantidad: {
    minWidth: 26,
    textAlign: "center",
  },
  grupoChips: {
    gap: ESPACIOS.xs + 2,
  },
  courierCard: {
    paddingHorizontal: ESPACIOS.md,
    paddingVertical: ESPACIOS.sm,
    borderWidth: 1,
    minWidth: 105,
    cursor: "pointer",
  },
  vacioResumen: {
    padding: ESPACIOS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  listaLineas: {
    gap: ESPACIOS.sm,
  },
  lineaItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  lineaItemInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  conflictoLineaFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    marginTop: 2,
  },
  linkAjustar: {
    paddingVertical: 4,
  },
  lineaDerecha: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  alertaStock: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
    padding: ESPACIOS.sm + 2,
    borderWidth: 1,
  },
  desgloseCaja: {
    borderTopWidth: 1,
    paddingTop: ESPACIOS.md,
    gap: ESPACIOS.sm,
  },
  filaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  envioLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  pillGratis: {
    paddingHorizontal: ESPACIOS.sm,
    paddingVertical: 2,
  },
  totalLinea: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    paddingTop: ESPACIOS.sm,
    marginTop: ESPACIOS.xs,
  },
  umbralCaja: {
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  umbralInputFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  umbralInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    paddingHorizontal: ESPACIOS.md,
  },
  barraInferiorMovil: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: ESPACIOS.md,
  },
  barraTotalInfo: {
    flex: 1,
    minWidth: 0,
  },
  modalOverlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: ESPACIOS.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 440,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    gap: ESPACIOS.md,
  },
  modalIcono: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBotones: {
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.xs,
  },
  scrollExito: {
    flexGrow: 1,
    padding: ESPACIOS.lg,
    justifyContent: "center",
  },
  scrollAncho: {
    alignItems: "center",
  },
  tarjetaExito: {
    width: "100%",
    maxWidth: 520,
    padding: ESPACIOS.xl,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.md,
  },
  iconoExito: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
  },
  tituloExito: {
    textAlign: "center",
  },
  codigoCajaExito: {
    width: "100%",
    padding: ESPACIOS.lg,
    borderWidth: 1,
    alignItems: "center",
    gap: ESPACIOS.xs,
  },
  resumenExito: {
    width: "100%",
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.sm,
  },
  accionesExito: {
    width: "100%",
    gap: ESPACIOS.sm,
    marginTop: ESPACIOS.xs,
  },
});

