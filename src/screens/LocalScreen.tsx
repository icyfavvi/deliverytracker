// ─── Pantalla LOCAL / BODEGA: Despacho de E-commerce de Moda ─────────
//
// Requisitos de Rúbrica UTEM:
// 1. Crear pedido (con cliente, prendas, tallas, dirección).
// 2. Avanzar estado (recibido → preparando → listo → entregado).
// 3. Manejo de los 4 estados de UI (cargando, error, vacío, datos).
// 4. Inmutabilidad y estado derivado (conteos, totales, filtros).
// 5. Totalmente responsive en ~5", ~6.7" y tablet (>600px dos columnas).

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
import { CampoTexto } from "../components/CampoTexto";
import { EstadoUIRenderer } from "../components/EstadoUIRenderer";
import { Icon } from "../components/Icon";
import { InterruptorTema } from "../components/InterruptorTema";
import { Masthead } from "../components/Masthead";
import { PedidoCard } from "../components/PedidoCard";
import { usePedidos } from "../context/PedidosContext";
import { usePedidoPolling } from "../hooks/usePedidoPolling";
import { resetearSemilla } from "../services/pedidosApi";
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
  const { colores, tipografia, modo } = useTema();
  const { estado, estadisticas, recargar, crearOrden, avanzar, refrescando } =
    usePedidos();

  // ─── Estado del formulario de despacho ─────────────────────────
  const [nombre, setNombre] = useState("");
  const [direccion, setDireccion] = useState("");
  const [comuna, setComuna] = useState("Providencia, Santiago");
  const [items, setItems] = useState<ItemPedido[]>([
    {
      nombre: PRENDAS_CATALOGO[0].nombre,
      cantidad: 1,
      talla: PRENDAS_CATALOGO[0].talla,
      color: PRENDAS_CATALOGO[0].color,
      precioUnitario: PRENDAS_CATALOGO[0].precio,
    },
  ]);
  const [itemNombreManual, setItemNombreManual] = useState("");
  const [tallaManual, setTallaManual] = useState(TALLA_PREDETERMINADA);
  const [creando, setCreando] = useState(false);
  const [errorNombre, setErrorNombre] = useState<string | null>(null);
  const [errorItems, setErrorItems] = useState<string | null>(null);
  const [aviso, setAviso] = useState<AvisoAccion | null>(null);
  const scrollFormRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollCatalogoRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const scrollCatalogoX = useRef<number>(0);

  const desplazarCatalogo = useCallback((direccion: "izq" | "der") => {
    const paso = 220; // Ancho de tarjeta (~204px) + separación
    const delta = direccion === "izq" ? -paso : paso;
    const ref = scrollCatalogoRef.current as any;
    if (!ref) return;

    // 1. Detección y ejecución para entorno Web (DOM Element / React Native Web)
    const domNode =
      typeof ref.getScrollableNode === "function"
        ? ref.getScrollableNode()
        : ref._scrollNodeRef ?? (typeof ref.scrollBy === "function" || "scrollLeft" in ref ? ref : null);

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

    // 2. Ejecución para React Native nativo (iOS / Android)
    const nuevoX =
      direccion === "izq"
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
  // La bodega no necesita actualizarse en segundo plano: wasted battery.
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

  // El aviso se cierra solo.
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

  // ─── Agregar prenda del catálogo rápido ────────────────────────
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
          i === indice ? { ...item, cantidad: Math.max(1, item.cantidad + delta) } : item
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
      setItems([
        {
          nombre: PRENDAS_CATALOGO[0].nombre,
          cantidad: 1,
          talla: PRENDAS_CATALOGO[0].talla,
          color: PRENDAS_CATALOGO[0].color,
          precioUnitario: PRENDAS_CATALOGO[0].precio,
        },
      ]);
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
                ? { ...previo, accion: undefined, mensaje: "Código copiado al portapapeles." }
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

  // ─── Resetear datos demo ──────────────────────────────────────
  const handleResetearDemo = useCallback(async () => {
    await resetearSemilla();
    await recargar();
    setAviso({
      titulo: "Datos demo restablecidos",
      mensaje: "Volvimos a las órdenes CLO1 y MOD2.",
      tono: "info",
    });
  }, [recargar]);

  // ─── Formulario de Registro de Despacho ─────────────────────────
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
      <Text style={[tipografia.eyebrowMono, styles.eyebrow, { color: colores.acento }]}>
        NUEVO DESPACHO
      </Text>
      <Text style={[tipografia.tituloDashboard, styles.tituloSeccion, { color: colores.tinta }]}>
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

      {/* Catálogo rápido de prendas con flechas de navegación */}
      <View style={styles.catalogoHeader}>
        <Text style={[tipografia.eyebrowMono, styles.eyebrow, { color: colores.tintaTerciaria }]}>
          AÑADIR PRENDAS RÁPIDAS
        </Text>
        <View style={styles.catalogoFlechas}>
          <Pressable
            onPress={() => desplazarCatalogo("izq")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la izquierda"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Icon name="chevron-left" size={16} color={colores.tinta} />
          </Pressable>
          <Pressable
            onPress={() => desplazarCatalogo("der")}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Desplazar catálogo a la derecha"
            style={({ pressed }) => [
              styles.botonFlecha,
              {
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
                opacity: pressed ? 0.6 : 1,
              },
            ]}
          >
            <Icon name="chevron-right" size={16} color={colores.tinta} />
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
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon name="plus" size={13} color={colores.acento} />
            <Text
              style={[tipografia.cuerpoFuerte, styles.prendaRapidaNombre, { color: colores.tinta }]}
              numberOfLines={2}
            >
              {cat.nombre}
            </Text>
            <Text style={[tipografia.caption, { color: colores.tintaTerciaria }]}>
              Talla {cat.talla} · {formatearPrecio(cat.precio)}
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
            borderColor: errorItems ? colores.error : "transparent",
          },
        ]}
      >
        <View style={styles.panelPrendasEncabezado}>
          <Text style={[tipografia.eyebrow, styles.eyebrow, { color: colores.tintaTerciaria }]}>
            PAQUETE ({cantidadPrendas}{prendasPlural(cantidadPrendas)})
          </Text>
          <Text style={[tipografia.etiqueta, { color: colores.tinta }]}>
            {formatearPrecio(totalEstimado)}
          </Text>
        </View>

        {items.length === 0 ? (
          <Text style={[tipografia.caption, { color: colores.tintaTerciaria }]}>
            El paquete está vacío. Agrega prendas desde el catálogo o a mano.
          </Text>
        ) : null}

        {items.map((item, indice) => (
          <View key={`${item.nombre}-${indice}`} style={styles.prendaItemFila}>
            <View style={styles.prendaItemTexto}>
              <Text style={[tipografia.etiqueta, { color: colores.tinta }]} numberOfLines={1}>
                {item.nombre}
              </Text>
              <Text style={[tipografia.caption, { color: colores.tintaSecundaria }]}>
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
                    borderColor: colores.borde,
                    backgroundColor: colores.superficie,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Icon name="minus" size={13} color={colores.tinta} />
              </Pressable>

              <Text style={[tipografia.etiqueta, styles.stepperCantidad, { color: colores.tinta }]}>
                {item.cantidad}
              </Text>

              <Pressable
                onPress={() => cambiarCantidad(indice, 1)}
                accessibilityRole="button"
                accessibilityLabel={`Agregar una unidad de ${item.nombre}`}
                style={({ pressed }) => [
                  styles.stepperBoton,
                  {
                    borderColor: colores.borde,
                    backgroundColor: colores.superficie,
                    opacity: pressed ? 0.6 : 1,
                  },
                ]}
              >
                <Icon name="plus" size={13} color={colores.tinta} />
              </Pressable>
            </View>

            <Pressable
              onPress={() => eliminarItem(indice)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Eliminar ${item.nombre} del paquete`}
              style={({ pressed }) => [
                styles.eliminarItem,
                { opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Icon name="trash-2" size={15} color={colores.tintaTerciaria} />
            </Pressable>
          </View>
        ))}

        {errorItems ? (
          <View style={styles.errorFila}>
            <Icon name="circle-alert" size={13} color={colores.error} />
            <Text style={[tipografia.caption, { color: colores.error }]}>{errorItems}</Text>
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
        descripcion={`${estadisticas.activos} en ruta · ${estadisticas.entregados} entregadas de ${estadisticas.total} órdenes.`}
        acciones={
          <Pressable
            onPress={handleResetearDemo}
            accessibilityRole="button"
            accessibilityLabel="Reiniciar los datos demo"
            style={({ pressed }) => [
              styles.botonIcono,
              {
                borderColor: colores.borde,
                backgroundColor: colores.superficie,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Icon name="rotate-ccw" size={16} color={colores.tintaSecundaria} />
          </Pressable>
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
            <Text style={[tipografia.caption, styles.actualizando, { color: colores.tintaTerciaria }]}>
              Actualizando…
            </Text>
          ) : null}
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colores.fondo }]} edges={["top"]}>
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
          // Tablet / desktop: cabecera a lo ancho, luego dos columnas.
          <View style={styles.layoutAncho}>
            <View style={styles.marcaAncho}>
              <Masthead
                eyebrow="Atelier Noir · Panel de bodega"
                titulo="Bodega y despacho"
                variante="tecnico"
                descripcion="Registra nuevas órdenes de venta y avanza su estado de despacho en tiempo real."
                acciones={<InterruptorTema />}
              />
            </View>

            <View style={styles.columnasAncho}>
              <ScrollView
                ref={scrollFormRef}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[styles.columnaScroll, styles.columnaFormulario]}
              >
                {formulario}
              </ScrollView>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.columnaScroll, styles.columnaLista]}
              >
                {encabezadoLista}
                {listaPedidos}
              </ScrollView>
            </View>
          </View>
        ) : (
          // Móvil: una sola columna con scroll continuo.
          <ScrollView
            ref={scrollFormRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollMovil}
          >
            <Masthead
              eyebrow="Atelier Noir · Panel de bodega"
              titulo="Bodega y despacho"
              variante="tecnico"
              descripcion="Registra nuevas órdenes de venta y avanza su estado de despacho en tiempo real."
              acciones={<InterruptorTema />}
            />
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
  eyebrow: {
    letterSpacing: 1.6,
    marginBottom: ESPACIOS.xs,
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
    gap: ESPACIOS.xs,
  },
  botonFlecha: {
    width: 34,
    height: 34,
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
    width: 204,
    padding: ESPACIOS.md,
    borderWidth: 1,
    gap: ESPACIOS.xs,
    cursor: "pointer",
  },
  prendaRapidaNombre: {
    letterSpacing: -0.1,
    minHeight: 44,
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
    borderWidth: 1.5,
    gap: ESPACIOS.sm,
    marginBottom: ESPACIOS.lg,
  },
  panelPrendasEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prendaItemFila: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  prendaItemTexto: {
    flex: 1,
    minWidth: 0,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.xs + 2,
  },
  stepperBoton: {
    width: 30,
    height: 30,
    borderRadius: RADIOS.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
  stepperCantidad: {
    minWidth: 18,
    textAlign: "center",
  },
  eliminarItem: {
    padding: ESPACIOS.sm,
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
    marginTop: ESPACIOS.lg,
  },
  accionesLista: {
    flexDirection: "row",
    alignItems: "center",
    gap: ESPACIOS.sm,
  },
  botonIcono: {
    width: 44,
    height: 44,
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
