// ─── Hook de Carrito y Selección de Tallas (ClienteScreen) ───────

import { useCallback, useMemo, useState } from "react";

import { COMUNAS_RM } from "../../services/operacionesMock";
import { ItemPedido, ProductoCatalogoAdmin } from "../../types/pedido";
import { dispararNotificacionError } from "../../utils/haptics";

export function generarIdempotencyCliente(): string {
  return `cli-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function useCarritoCliente(
  catalogo: ProductoCatalogoAdmin[],
  reducirMovimiento: boolean,
  nombreInicial: string
) {
  const [carrito, setCarrito] = useState<ItemPedido[]>([]);
  const [modalCompraAbierto, setModalCompraAbierto] = useState(false);
  const [nombreCompra, setNombreCompra] = useState(nombreInicial);
  const [errorNombreCompra, setErrorNombreCompra] = useState<string | null>(
    null
  );
  const [errorCarrito, setErrorCarrito] = useState<string | null>(null);
  const [dirCompra, setDirCompra] = useState("Av. Providencia 1450, Dpto 802");
  const [comunaCompra, setComunaCompra] = useState<string>(COMUNAS_RM[0]);
  const [idempotencyCompra, setIdempotencyCompra] = useState(() =>
    generarIdempotencyCliente()
  );
  const [creandoCompra, setCreandoCompra] = useState(false);
  const [tallaPorProducto, setTallaPorProducto] = useState<
    Record<string, string>
  >({});

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

  const tallaSeleccionadaDe = useCallback(
    (prod: ProductoCatalogoAdmin) => {
      const elegida = tallaPorProducto[prod.id];
      if (elegida) return elegida;
      return prod.variantes.find((v) => v.stock > 0)?.sku;
    },
    [tallaPorProducto]
  );

  const stockPorSku = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const prod of catalogo) {
      for (const v of prod.variantes) mapa[v.sku] = v.stock;
    }
    return mapa;
  }, [catalogo]);

  const cambiarCantidadCarrito = useCallback(
    (item: ItemPedido, delta: number) => {
      const maximo = item.sku
        ? (stockPorSku[item.sku] ?? item.cantidad)
        : item.cantidad;
      if (delta > 0 && item.cantidad + delta > maximo) {
        void dispararNotificacionError(reducirMovimiento);
        setErrorCarrito(`Stock disponible para ${item.nombre}: ${maximo} un.`);
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
    [stockPorSku, reducirMovimiento]
  );

  const quitarItemCarrito = useCallback((item: ItemPedido) => {
    setErrorCarrito(null);
    setCarrito((prev) =>
      prev.filter((it) => (it.sku ?? it.nombre) !== (item.sku ?? item.nombre))
    );
  }, []);

  const totalCarrito = useMemo(
    () =>
      carrito.reduce(
        (acc, it) => acc + (it.precioUnitario ?? 0) * it.cantidad,
        0
      ),
    [carrito]
  );

  const limpiarCarritoPostCompra = useCallback(() => {
    setCarrito([]);
    setIdempotencyCompra(generarIdempotencyCliente());
    setModalCompraAbierto(false);
  }, []);

  return {
    carrito,
    modalCompraAbierto,
    setModalCompraAbierto,
    nombreCompra,
    setNombreCompra,
    errorNombreCompra,
    setErrorNombreCompra,
    errorCarrito,
    dirCompra,
    setDirCompra,
    comunaCompra,
    setComunaCompra,
    idempotencyCompra,
    creandoCompra,
    setCreandoCompra,
    agregarAlCarritoCliente,
    seleccionarTallaProducto,
    tallaSeleccionadaDe,
    cambiarCantidadCarrito,
    quitarItemCarrito,
    totalCarrito,
    limpiarCarritoPostCompra,
  };
}
