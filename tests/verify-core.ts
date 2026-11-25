import {
  obtenerPedidos,
  obtenerPedidoPorCodigo,
  crearPedido,
  avanzarEstado,
  vaciarPedidos,
  detectarDuplicadoReciente,
} from "../src/services/pedidosApi";
import {
  calcularAnaliticaOperacion,
  calcularTotalesChile,
  obtenerCatalogoConStock,
  obtenerStockPorSku,
  reponerStockSku,
} from "../src/services/operacionesMock";

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
  await vaciarPedidos();
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
  const p1 = await avanzarEstado(codigo);
  assert(p1.status === 200 && p1.data?.estado === "preparando", "Avanzado a 'preparando' (Pick & Pack)");

  const p2 = await avanzarEstado(codigo);
  assert(p2.status === 200 && p2.data?.estado === "listo", "Avanzado a 'listo' (En ruta con courier)");

  const p3 = await avanzarEstado(codigo);
  assert(p3.status === 200 && p3.data?.estado === "entregado", "Avanzado a 'entregado'");

  const p4 = await avanzarEstado(codigo);
  assert(p4.status === 409, "Retorna 409 Conflict al intentar avanzar orden ya entregada");

  // 6. Reglas Admin, Stock O(1) y Analítica en 1 pasada
  console.log("\n6. Verificando reglas Admin, Stock O(1), Idempotencia y Analítica:");
  const totMenor = calcularTotalesChile(54990);
  assert(totMenor.envio === 4990, "Envío de $4.990 bajo $80.000 CLP");
  assert(totMenor.total === 54990 + 4990, "Total incluye envío bajo umbral");
  assert(totMenor.ivaIncluido === Math.round(54990 - 54990 / 1.19), "IVA 19% incluido calculado correctamente");

  const totGratis = calcularTotalesChile(80000);
  assert(totGratis.envio === 0 && totGratis.total === 80000, "Envío gratis desde $80.000 CLP");

  const stockAntes = obtenerStockPorSku("AN-HDY-M") ?? 0;
  const resAdmin = await crearPedido(
    "Martina Soto",
    "Av. Providencia 1450",
    "Providencia",
    [{ sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M", cantidad: 1, precioUnitario: 54990 }],
    "Bluex · 09:00 – 13:00 (AM)",
    {
      clienteId: "cli-01",
      transportista: "Bluex",
      metodoPago: "Transferencia",
      creadoPorAdmin: true,
      idempotencyKey: "key-test-1",
    }
  );
  assert(resAdmin.status === 201 && resAdmin.ok, "Pedido admin creado (201)");
  assert((obtenerStockPorSku("AN-HDY-M") ?? -1) === stockAntes - 1, "Stock descontado atómicamente vía índice O(1)");
  assert(resAdmin.data.totalEstimado === 59980, "Total admin incluye envío ($54.990 + $4.990 = $59.980)");

  const stockRepuesto = reponerStockSku("AN-HDY-M", 1);
  assert(stockRepuesto === stockAntes, "Reposición de stock en bodega funciona en O(1)");

  const resIdem = await crearPedido(
    "Martina Soto",
    "Av. Providencia 1450",
    "Providencia",
    [{ sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M", cantidad: 1, precioUnitario: 54990 }],
    "Bluex",
    { creadoPorAdmin: true, idempotencyKey: "key-test-1" }
  );
  assert(resIdem.status === 409 && resIdem.errorCode === "IDEMPOTENCY_DUPLICATE", "Doble clic bloqueado por idempotencyKey");

  const resSinStock = await crearPedido(
    "Martina Soto",
    "Av. Providencia 1450",
    "Providencia",
    [{ sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M", cantidad: 99, precioUnitario: 54990 }],
    "Bluex",
    { creadoPorAdmin: true, idempotencyKey: "key-test-2" }
  );
  assert(resSinStock.status === 409 && resSinStock.errorCode === "INSUFFICIENT_STOCK", "Stock insuficiente rechazado con 409");

  const dup = detectarDuplicadoReciente("Martina Soto", 59980, "cli-01");
  assert(dup !== null && dup.codigo === resAdmin.data.codigo, "Detección de pedido duplicado reciente activa");

  const analitica = calcularAnaliticaOperacion([resAdmin.data], obtenerCatalogoConStock());
  assert(analitica.total === 1 && analitica.ventasNetas === 59980, "Analítica en una sola pasada calcula totales reales");
  assert(analitica.porComuna[0]?.comuna === "Providencia", "Analítica por comuna RM agrupa correctamente");

  await vaciarPedidos();
  console.log("\n🎉 TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE (100% OK).");
}

runTests().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
