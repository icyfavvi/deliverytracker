import {
  obtenerPedidos,
  obtenerPedidoPorCodigo,
  crearPedido,
  avanzarEstado,
  resetearSemilla,
} from "../src/services/pedidosApi";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    process.exit(1);
  }
  console.log(`✅ OK: ${message}`);
}

async function runTests() {
  console.log("=== PRUEBAS E-COMMERCE ROPA: ARQUITECTURA Y RÚBRICA UTEM ===\n");

  // 1. Resetear y verificar inicio limpio (0 órdenes precargadas)
  console.log("1. Verificando inicio limpio (almacén sin órdenes precargadas):");
  await resetearSemilla();
  const resInicial = await obtenerPedidos();
  assert(resInicial.status === 200, "obtenerPedidos retorna status 200");
  assert(Array.isArray(resInicial.data), "data es un Array");
  assert(resInicial.data.length === 0, "Almacén inicia vacío sin órdenes de ejemplo");
  console.log("   Órdenes iniciales: 0 (inicio limpio verificado)");

  // 2. Consulta 404 discriminada
  console.log("\n2. Verificando estado discriminado vacío (404 Not Found):");
  const resNoExiste = await obtenerPedidoPorCodigo("NOEX");
  assert(resNoExiste.status === 404, "Retorna 404 para código inexistente");
  assert(resNoExiste.ok === false, "res.ok es false para 404");
  assert(resNoExiste.data === null, "data es null para 404");

  // 3. Crear pedido nuevo de prendas (201 Created)
  console.log("\n3. Creación de orden de vestuario (201 Created):");
  const resCrear = await crearPedido(
    "Mariana Valenzuela",
    "Av. Vitacura 3560, Depto 101",
    "Vitacura, Santiago",
    [
      { nombre: "Chaqueta Denim Vintage", cantidad: 1, talla: "M", color: "Azul Petróleo", precioUnitario: 45990 },
      { nombre: "Polera Básica Algodón Pima", cantidad: 2, talla: "S", color: "Negro Lavado", precioUnitario: 19990 },
    ],
    "Courier Express 24h"
  );
  assert(resCrear.status === 201, "crearPedido retorna status 201 Created");
  assert(resCrear.ok === true, "res.ok es true");
  assert(typeof resCrear.data.codigo === "string" && resCrear.data.codigo.length === 4, "Código generado de 4 caracteres");
  assert(resCrear.data.estado === "recibido", "Estado inicial es 'recibido'");
  assert(resCrear.data.totalEstimado === 45990 + 2 * 19990, "Total calculado correctamente derivado de prendas");
  const codigo = resCrear.data.codigo;

  // 4. Consulta directa O(1) por código
  console.log("\n4. Búsqueda directa O(1) por código de orden:");
  const resBuscar = await obtenerPedidoPorCodigo(codigo);
  assert(resBuscar.status === 200, "obtenerPedidoPorCodigo retorna 200");
  assert(resBuscar.data?.codigo === codigo, "Código coincide");
  assert(resBuscar.data?.clienteNombre === "Mariana Valenzuela", "Nombre de clienta verificado");
  assert(resBuscar.data?.items.length === 2, "Items de vestuario presentes");

  // 5. Transición completa de estados
  console.log("\n5. Ciclo de despacho de moda (recibido -> preparando -> listo -> entregado):");
  // recibido -> preparando (Pick & Pack en Bodega)
  const p1 = await avanzarEstado(codigo);
  assert(p1.status === 200 && p1.data?.estado === "preparando", "Avanzado a 'preparando' (Pick & Pack)");

  // preparando -> listo (Despachado / Con Courier)
  const p2 = await avanzarEstado(codigo);
  assert(p2.status === 200 && p2.data?.estado === "listo", "Avanzado a 'listo' (En ruta con courier)");

  // listo -> entregado (Entregado con Éxito)
  const p3 = await avanzarEstado(codigo);
  assert(p3.status === 200 && p3.data?.estado === "entregado", "Avanzado a 'entregado'");

  // Intento de avance adicional (409 Conflict)
  const p4 = await avanzarEstado(codigo);
  assert(p4.status === 409, "Retorna 409 Conflict al intentar avanzar orden ya entregada");

  console.log("\n🎉 TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE (100% OK).");
}

runTests().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
