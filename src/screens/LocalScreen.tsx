// ─── Pantalla LOCAL / BODEGA: Despacho de E-commerce de Moda ─────────
//
// Rediseño visual Atelier Noir (ink + azul cobalto + tarjetas de métrica),
// preservando toda la lógica de negocio, creación de órdenes, polling,
// catálogo rápido, diseño responsivo y accesibilidad >= 44pt / WCAG AA.

import React, { useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import * as Clipboard from "expo-clipboard";

import { AvisoFlotante, TonoAviso } from "../components/AvisoFlotante";
import { Boton } from "../components/Boton";
import { BotonSalir } from "../components/BotonSalir";
import { CampoTexto } from "../components/CampoTexto";
import { EstadoUIRenderer } from "../components/EstadoUIRenderer";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { Masthead } from "../components/Masthead";
import { PedidoCard } from "../components/PedidoCard";
import { TarjetaMetrica } from "../components/TarjetaMetrica";
import { usePedidos } from "../context/PedidosContext";
import { usePedidoPolling } from "../hooks/usePedidoPolling";
import { vaciarPedidos } from "../services/pedidosApi";
import { useTema } from "../theme/ThemeProvider";
import { BREAKPOINTS, ESPACIOS, RADIOS, sombraTarjeta } from "../theme/tokens";
import { ItemPedido, Pedido } from "../types/pedido";

// Catálogo de prendas para creación rápida
const PRENDAS_CATALOGO = [
  { nombre: "Chaqueta Denim Vintage", talla: "M", color: "Azul Petróleo", precio: 45990 },
  { nombre: "Polera Básica Algodón Pima", talla: "L", color: "Negro Lavado", precio: 19990 },
  { nombre: "Pantalón Cargo Street", talla: "42", color: "Caqui", precio: 39990 },
  { nombre: "Hoodie Heavyweight Fleece", talla: "XL", color: "Gris Plomo", precio: 42990 },
  { nombre: "Vestido Midi Satinado", talla: "S", color: "Verde Salvia", precio: 34990 },
];

const TALLA_PREDETERMINADA = "M";
const PRECIO_MANUAL = 29990;

interface AvisoAccion {
  titulo: string;
  mensaje: string;
  tono: TonoAviso;
  accion?: { etiqueta: string; icono?: "copy"; onPress: () => void };
}

export function LocalScreen() {
  const { width } = useWindowDimensions();
  const esAncho = width >= BREAKPOINTS.tablet;
  const { colores, tipografia, modo, puntoMinimo } = useTema();
  const { estado, estadisticas, recargar, crearOrden, avanzar, refrescando } =
    usePedidos();

  // ─── Estado del formulario de despacho ─────────────────────────
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
    const delta = direccionPaso === "izq" ? -paso : paso;
    const ref = scrollCatalogoRef.current as any;
    if (!ref) return;

    const domNode =
      typeof ref.getScrollableNode === "function"
        ? ref.getScrollableNode()
        : ref._scrollNodeRef ??
        (typeof ref.scrollBy === "function" || "scrollLeft" in ref ? ref : null);

    if (domNode) {
      if (typeof domNode.scrollBy === "function") {
        domNode.scrollBy({
          left: delta,
          top: 0,
          behavior: "smooth",
        });
        return;
      }
      if (typeof domNode.scrollLeft === "number") {
        const destino = Math.max(0, domNode.scrollLeft + delta);
        if (typeof domNode.scrollTo === "function") {
          domNode.scrollTo({
            left: destino,
            top: 0,
            behavior: "smooth",
          });
        } else {
          domNode.scrollLeft = destino;
        }
        return;
      }
    }

    const nuevoX =
      direccionPaso === "izq"
        ? Math.max(0, scrollCatalogoX.current - paso)
        : scrollCatalogoX.current + paso;
    scrollCatalogoX.current = nuevoX;

    if (typeof ref.scrollTo === "function") {
      ref.scrollTo({
        x: nuevoX,
        y: 0,
        animated: true,
      });
    }
  }, []);

  // ─── Polling solo mientras la pestaña está a la vista ─────────
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
    intervaloInicial: 8_000,
    intervaloLargo: 25_000,
  });

  React.useEffect(() => {
    if (!aviso) return;
    const temporizador = setTimeout(() => setAviso(null), 6000);
    return () => clearTimeout(temporizador);
  }, [aviso]);

  // ─── Estado derivado: total estimado del paquete ──────────────
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

  // ─── Agregar prenda del catálogo rápido ───────────────────────
  const agregarPrendaCatalogo = (cat: (typeof PRENDAS_CATALOGO)[0]) => {
    setItems((previos) => {
      const indice = previos.findIndex(
        (item) => item.nombre === cat.nombre && item.talla === cat.talla
      );
      if (indice >= 0) {
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
    setItems((previos) =>
      previos
        .map((item, i) =>
          i === indice
            ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
            : item
        )
        .filter((item) => item.cantidad > 0)
    );
  };

  const eliminarItem = (indice: number) => {
    setItems((previos) => previos.filter((_, i) => i !== indice));
  };

  // ─── Crear Pedido (POST /v1/pedidos) ──────────────────────────
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
            Clipboard.setStringAsync(codigo).catch(() => {
              // Si el portapapeles falla, el código sigue visible en la tarjeta.
            });
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
    await Clipboard.setStringAsync(codigo).catch(() => {
      // Sin portapapeles disponible: no es motivo para romper el flujo.
    });
    setAviso({
      titulo: `Código #${codigo} copiado`,
      mensaje: "Pégalo en el chat con el cliente.",
      tono: "info",
    });
  }, []);

  // ─── Vaciar datos de despacho ──────────────────────────────────
  const handleVaciarOrdenes = useCallback(async () => {
    await vaciarPedidos();
    await recargar();
    setAviso({
      titulo: "Lista de pedidos vaciada",
      mensaje: "Se eliminaron todas las órdenes registradas.",
      tono: "info",
    });
  }, [recargar]);

  // ─── Resumen de Métricas de Bodega ─────────────────────────────
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

  // ─── Formulario de Registro de Despacho ────────────────────────
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
          NUEVO DESPACHO
        </Text>
      </View>

      <Text
        style={[
          tipografia.tituloDashboard,
          styles.tituloSeccion,
          { color: colores.tinta },
        ]}
      >
        Crear orden de venta
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

      {/* Catálogo rápido de prendas con flechas >= 44x44 */}
      <View style={styles.catalogoHeader}>
        <Text
          style={[
            tipografia.eyebrowMono,
            { color: colores.tintaTerciaria },
          ]}
        >
          PRENDAS RÁPIDAS
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
        {PRENDAS_CATALOGO.map((cat) => (
          <Pressable
            key={cat.nombre}
            onPress={() => agregarPrendaCatalogo(cat)}
            accessibilityRole="button"
            accessibilityLabel={`Agregar ${cat.nombre}`}
            style={({ pressed }) => [
              styles.prendaRapida,
              {
                backgroundColor: colores.superficieHundida,
                borderColor: colores.borde,
                borderRadius: RADIOS.md,
                opacity: pressed ? 0.75 : 1,
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
                <Icon name="plus" size={13} color={colores.acentoIntenso} />
                <Text
                  style={[
                    tipografia.caption,
                    { color: colores.acentoIntenso },
                  ]}
                >
                  Talla {cat.talla}
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
              {cat.color}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Agregar ítem manual */}
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

      {/* Prendas agregadas */}
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
            key={`${item.nombre}-${indice}`}
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

  // ─── Lista de Despachos en Curso ──────────────────────────────
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
          estadisticas.total > 0 ? (
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
          ) : undefined
        }
      />
    </View>
  );

  const listaPedidos = (
    <EstadoUIRenderer
      estado={estado}
      mensajeVacio="No hay despachos registrados. Crea una orden para comenzar."
      accionVacia={{
        etiqueta: "Crear la primera orden",
        onPress: () => scrollFormRef.current?.scrollTo({ y: 0, animated: true }),
      }}
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
        accion={aviso?.accion}
        onCerrar={() => setAviso(null)}
      />

      <KeyboardAvoidingView
        style={styles.contenedor}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {esAncho ? (
          <View style={styles.layoutAncho}>
            <View style={styles.marcaAncho}>
              <Masthead
                eyebrow="Atelier Noir · Bodega"
                titulo="Bodega y despacho"
                variante="tecnico"
                descripcion="Registra nuevas órdenes de venta y avanza su estado de despacho en tiempo real."
                acciones={
                  <>
                    <BotonSalir />
                    <InterruptorTema />
                  </>
                }
              />
              {resumenMetricas}
            </View>

            <View style={styles.columnasAncho}>
              <ScrollView
                ref={scrollFormRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.columnaScroll,
                  styles.columnaFormulario,
                ]}
              >
                {formulario}
              </ScrollView>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.columnaScroll,
                  styles.columnaLista,
                ]}
              >
                {encabezadoLista}
                {listaPedidos}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView
            ref={scrollFormRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollMovil}
          >
            <Masthead
              eyebrow="Atelier Noir · Bodega"
              titulo="Bodega y despacho"
              variante="tecnico"
              descripcion="Registra nuevas órdenes de venta y avanza su estado de despacho en tiempo real."
              acciones={
                <>
                  <BotonSalir />
                  <InterruptorTema />
                </>
              }
            />
            {resumenMetricas}
            {formulario}
            {encabezadoLista}
            {listaPedidos}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Plural simple: 1 prenda / 2 prendas. */
function prendasPlural(cantidad: number): string {
  return cantidad === 1 ? " prenda" : " prendas";
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  contenedor: {
    flex: 1,
  },
  scrollMovil: {
    padding: ESPACIOS.lg,
    paddingBottom: ESPACIOS.xxl * 2,
    gap: ESPACIOS.lg,
  },
  layoutAncho: {
    flex: 1,
    paddingHorizontal: ESPACIOS.lg,
    paddingTop: ESPACIOS.lg,
    gap: ESPACIOS.lg,
  },
  marcaAncho: {
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  metricasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: ESPACIOS.md,
  },
  columnasAncho: {
    flex: 1,
    flexDirection: "row",
    gap: ESPACIOS.lg,
    width: "100%",
    maxWidth: 1180,
    alignSelf: "center",
  },
  columnaScroll: {
    paddingBottom: ESPACIOS.xxl * 2,
  },
  columnaFormulario: {
    flex: 1,
    maxWidth: 480,
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
