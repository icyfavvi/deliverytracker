import {
  obtenerPedidos,
  obtenerPedidoPorCodigo,
  crearPedido,
  avanzarEstado,
  cancelarPedido,
  vaciarPedidos,
  detectarDuplicadoReciente,
} from "../src/services/pedidosApi";
import {
  buscarClientes,
  calcularAnaliticaOperacion,
  calcularTotalesChile,
  crearClienteDirectorio,
  obtenerCatalogoConStock,
  obtenerStockPorSku,
  reponerStockSku,
  resetearCatalogoBase,
  restaurarStockAtomico,
} from "../src/services/operacionesMock";
import {
  ADMIN_DEMO,
  AuthStorageAdapter,
  crearServicioAuth,
  ErrorAuth,
  MIN_CLAVE,
} from "../src/services/authCore";
import {
  calcularIntervaloPolling,
  esEstadoTerminal,
} from "../src/hooks/pollingConfig";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALLÓ: ${message}`);
    process.exit(1);
  }
  console.log(`✅ OK: ${message}`);
}

function crearMemoriaStorage(): AuthStorageAdapter {
  const mapa = new Map<string, string>();
  return {
    getItem: async (k) => mapa.get(k) ?? null,
    setItem: async (k, v) => {
      mapa.set(k, v);
    },
    removeItem: async (k) => {
      mapa.delete(k);
    },
  };
}

const cryptoNode = {
  sha256Hex: async (input: string) => {
    const digest = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(input)
    );
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },
  randomUuid: () => globalThis.crypto.randomUUID(),
};

async function runTests() {
  console.log("=== PRUEBAS E-COMMERCE ROPA: ARQUITECTURA Y RÚBRICA UTEM ===\n");

  // 1. Resetear y verificar inicio limpio (0 órdenes precargadas)
  console.log("1. Verificando inicio limpio (almacén sin órdenes precargadas):");
  await vaciarPedidos();
  const resInicial = await obtenerPedidos();
  assert(resInicial.status === 200, "obtenerPedidos retorna status 200");
  assert(Array.isArray(resInicial.data), "data es un Array");
  assert(resInicial.data.length === 0, "Almacén inicia vacío sin órdenes de ejemplo");

  // 2. Consulta 404 discriminada + validación 400
  console.log("\n2. Verificando estados discriminados (404 Not Found y 400 Validation):");
  const resNoExiste = await obtenerPedidoPorCodigo("NOEX");
  assert(resNoExiste.status === 404, "Retorna 404 para código inexistente");
  assert(resNoExiste.ok === false, "res.ok es false para 404");
  assert(resNoExiste.data === null, "data es null para 404");

  const resInvalido = await crearPedido("   ", "Dir 1", "Santiago", []);
  assert(
    resInvalido.status === 400 && resInvalido.errorCode === "VALIDATION",
    "Retorna 400 VALIDATION para pedido vacío o sin cliente"
  );

  // 3. Crear pedido cliente sin precio admin ni envío oculto
  console.log("\n3. Creación de orden cliente (201 Created, sin recargo admin oculto):");
  const resSinPrecio = await crearPedido(
    "Cliente Sin Precio",
    "Av. Italia 100",
    "Ñuñoa",
    [{ nombre: "Prenda Sin Precio", cantidad: 2 }]
  );
  assert(
    resSinPrecio.status === 201 && resSinPrecio.data.totalEstimado === 0,
    "Item sin precioUnitario suma 0 consistentemente (sin fallback silencioso $19.990)"
  );

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
  assert(resCrear.data.totalEstimado === 45990 + 2 * 19990, "Total cliente coincide con prendas");
  const codigo = resCrear.data.codigo;

  // 4. Búsqueda directa O(1) por código
  console.log("\n4. Búsqueda directa O(1) por código de orden:");
  const resBuscar = await obtenerPedidoPorCodigo(codigo);
  assert(resBuscar.status === 200, "obtenerPedidoPorCodigo retorna 200");
  assert(resBuscar.data?.codigo === codigo, "Código coincide");
  assert(resBuscar.data?.clienteNombre === "Mariana Valenzuela", "Nombre de clienta verificado");
  assert(resBuscar.data?.items.length === 2, "Items de vestuario presentes");

  // 5. Ciclo completo de estados
  console.log("\n5. Ciclo de despacho (recibido -> preparando -> listo -> entregado):");
  const p1 = await avanzarEstado(codigo);
  assert(p1.status === 200 && p1.data?.estado === "preparando", "Avanzado a 'preparando'");

  const p2 = await avanzarEstado(codigo);
  assert(p2.status === 200 && p2.data?.estado === "listo", "Avanzado a 'listo'");

  const p3 = await avanzarEstado(codigo);
  assert(p3.status === 200 && p3.data?.estado === "entregado", "Avanzado a 'entregado'");

  const p4 = await avanzarEstado(codigo);
  assert(p4.status === 409, "Retorna 409 Conflict al intentar avanzar orden ya entregada");

  // 6. Reglas Admin, Stock O(1), Idempotencia acotada y Atomicidad multi-ítem
  console.log("\n6. Reglas Admin, Stock O(1), Idempotencia y Atomicidad multi-ítem:");
  const totMenor = calcularTotalesChile(54990);
  assert(totMenor.envio === 4990, "Envío de $4.990 bajo $80.000 CLP");
  assert(totMenor.total === 54990 + 4990, "Total incluye envío bajo umbral");
  assert(totMenor.ivaIncluido === Math.round(54990 - 54990 / 1.19), "IVA 19% incluido correcto");

  const totGratis = calcularTotalesChile(80000);
  assert(totGratis.envio === 0 && totGratis.total === 80000, "Envío gratis desde $80.000 CLP");

  const stockAntesS = obtenerStockPorSku("AN-HDY-S") ?? 0;
  const stockAntesM = obtenerStockPorSku("AN-HDY-M") ?? 0;
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
  assert((obtenerStockPorSku("AN-HDY-M") ?? -1) === stockAntesM - 1, "Stock descontado atómicamente vía índice O(1)");
  assert(resAdmin.data.totalEstimado === 59980, "Total admin incluye envío ($54.990 + $4.990 = $59.980)");

  const stockRepuesto = reponerStockSku("AN-HDY-M", 1);
  assert(stockRepuesto === stockAntesM, "Reposición de stock en bodega funciona en O(1)");

  const resIdem = await crearPedido(
    "Martina Soto",
    "Av. Providencia 1450",
    "Providencia",
    [{ sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M", cantidad: 1, precioUnitario: 54990 }],
    "Bluex",
    { creadoPorAdmin: true, idempotencyKey: "key-test-1" }
  );
  assert(resIdem.status === 409 && resIdem.errorCode === "IDEMPOTENCY_DUPLICATE", "Doble clic bloqueado por idempotencyKey");

  // Atomicidad en 2 ítems: si el 2do falla por stock, el 1ro NO se descuenta
  const resParcial = await crearPedido(
    "Martina Soto",
    "Av. Providencia 1450",
    "Providencia",
    [
      { sku: "AN-HDY-S", nombre: "Noir Core Hoodie", talla: "S", cantidad: 1, precioUnitario: 54990 },
      { sku: "AN-HDY-M", nombre: "Noir Core Hoodie", talla: "M", cantidad: 99, precioUnitario: 54990 },
    ],
    "Bluex",
    { creadoPorAdmin: true, idempotencyKey: "key-test-2" }
  );
  assert(
    resParcial.status === 409 && resParcial.errorCode === "INSUFFICIENT_STOCK",
    "Stock insuficiente en 2do ítem rechazado con 409"
  );
  assert(
    obtenerStockPorSku("AN-HDY-S") === stockAntesS,
    "Rollback atómico preserva el stock del 1er ítem sin descontar"
  );

  const dup = detectarDuplicadoReciente("Martina Soto", 59980, "cli-01");
  assert(dup !== null && dup.codigo === resAdmin.data.codigo, "Detección de pedido duplicado reciente activa");

  const analitica = calcularAnaliticaOperacion([resAdmin.data], obtenerCatalogoConStock());
  assert(analitica.total === 1 && analitica.ventasNetas === 59980, "Analítica calcula totales reales");
  assert(analitica.porComuna[0]?.comuna === "Providencia", "Analítica por comuna RM agrupa correctamente");

  // 7. CRM Clientes (búsqueda y alta en directorio)
  console.log("\n7. Verificando CRM de clientes (buscar y crear):");
  const encontrados = buscarClientes("8421");
  assert(encontrados.length === 1 && encontrados[0].id === "cli-01", "Búsqueda por dígitos de teléfono encuentra cliente");
  const cliNuevo = crearClienteDirectorio({
    nombre: "Elena Navarro",
    correo: "ELENA@TEST.CL",
    telefono: "+56 9 4010 2030",
  });
  assert(cliNuevo.correo === "elena@test.cl" && cliNuevo.totalPedidos === 0, "Alta de cliente normaliza correo");
  assert(buscarClientes("elena@test.cl").some((c) => c.id === cliNuevo.id), "Nuevo cliente aparece de inmediato en búsquedas");

  // 8. Autenticación local (roles, validación de clave, demo solo dev)
  console.log("\n8. Verificando autenticación, roles y reglas de contraseña:");
  const authDev = crearServicioAuth(crearMemoriaStorage(), cryptoNode, {
    permitirDemoAdmin: true,
  });
  const sesionAdminDev = await authDev.iniciarSesion(
    ADMIN_DEMO.usuario,
    ADMIN_DEMO.clave
  );
  assert(
    sesionAdminDev.rol === "admin",
    "Modo dev permite inicio con cuenta admin/admin"
  );

  // Regresión: almacenamiento con hash legado v1 (2000 rondas sin prefijo) debe permitir login
  const storageLegado = crearMemoriaStorage();
  const salLegado = "sal-legado-v1";
  let hLegado = `${salLegado}:claveLegada1`;
  for (let i = 0; i < 2000; i++) {
    hLegado = await cryptoNode.sha256Hex(hLegado + salLegado);
  }
  await storageLegado.setItem(
    "@deliverytracker/usuarios",
    JSON.stringify([
      {
        usuario: ADMIN_DEMO.usuario,
        rol: "admin",
        sal: "sal-vieja-admin",
        hash: "hash-legado-invalido-sin-prefijo",
      },
      {
        usuario: "bodeguero",
        rol: "operador",
        sal: salLegado,
        hash: hLegado,
      },
    ])
  );
  const authLegado = crearServicioAuth(storageLegado, cryptoNode, {
    permitirDemoAdmin: true,
  });
  const sesionAdminMigrado = await authLegado.iniciarSesion(
    ADMIN_DEMO.usuario,
    ADMIN_DEMO.clave
  );
  const sesionBodegueroLegado = await authLegado.iniciarSesion(
    "bodeguero",
    "claveLegada1"
  );
  assert(
    sesionAdminMigrado.rol === "admin" && sesionBodegueroLegado.rol === "operador",
    "Compatibilidad con usuarios legados v1 y migración automática de admin/admin"
  );

  let errorClaveCorta = false;
  try {
    await authDev.registrar("nuevo_op", "1234567");
  } catch (e) {
    errorClaveCorta = e instanceof ErrorAuth;
  }
  assert(
    errorClaveCorta,
    `Registro rechaza claves menores a ${MIN_CLAVE} caracteres`
  );

  const sesionOpDev = await authDev.registrar("op_bodega", "claveSegura9");
  assert(
    sesionOpDev.rol === "operador",
    "Cuentas registradas en modo dev obtienen rol 'operador'"
  );

  let errorDuplicado = false;
  try {
    await authDev.registrar("op_bodega", "otraClave99");
  } catch (e) {
    errorDuplicado = e instanceof ErrorAuth;
  }
  assert(errorDuplicado, "Registro rechaza nombres de usuario duplicados");

  const sesionLeida = await authDev.leerSesion();
  assert(sesionLeida?.usuario === "op_bodega", "leerSesion recupera sesión activa");
  await authDev.cerrarSesion();
  assert((await authDev.leerSesion()) === null, "cerrarSesion elimina sesión");

  const authProd = crearServicioAuth(crearMemoriaStorage(), cryptoNode, {
    permitirDemoAdmin: false,
  });
  let falloAdminProd = false;
  try {
    await authProd.iniciarSesion(ADMIN_DEMO.usuario, ADMIN_DEMO.clave);
  } catch (e) {
    falloAdminProd = e instanceof ErrorAuth;
  }
  assert(
    falloAdminProd,
    "Modo producción NO siembra cuenta débil admin/admin"
  );

  const primerAdminProd = await authProd.registrar("jefe.bodega", "ClaveFuerte2026");
  const segundoOpProd = await authProd.registrar("asistente", "ClaveFuerte2026");
  assert(
    primerAdminProd.rol === "admin" && segundoOpProd.rol === "operador",
    "Primer usuario en producción es admin y siguientes son operador"
  );

  // 9. Reglas de polling adaptativo
  console.log("\n9. Verificando backoff de polling y detención en estado terminal:");
  const faseRapida = calcularIntervaloPolling(5_000, 5_000, 30_000, 30_000);
  const faseAhorro = calcularIntervaloPolling(30_000, 5_000, 30_000, 30_000);
  assert(
    faseRapida.intervaloMs === 5_000 && !faseRapida.esFrecuenciaLenta,
    "Polling mantiene 5s antes del umbral de 30s"
  );
  assert(
    faseAhorro.intervaloMs === 30_000 && faseAhorro.esFrecuenciaLenta,
    "Polling cambia a 30s al alcanzar umbral de ahorro"
  );
  assert(
    esEstadoTerminal("entregado") && !esEstadoTerminal("listo"),
    "Estado 'entregado' detiene el polling como estado terminal"
  );

  // 10. Cancelación de orden en 'recibido' + reversión atómica de stock
  console.log("\n10. Verificando cancelación de órdenes, stock y bitácora:");
  const stockAntesCancelacion = obtenerStockPorSku("AN-HDY-L") ?? 0;
  const resCancelable = await crearPedido(
    "Camila Ríos",
    "Irarrázaval 2820, Casa B",
    "Ñuñoa",
    [
      {
        sku: "AN-HDY-L",
        nombre: "Noir Core Hoodie",
        talla: "L",
        cantidad: 2,
        precioUnitario: 54990,
      },
    ],
    "Courier Express 24h"
  );
  assert(resCancelable.status === 201, "Orden de prueba creada para cancelación");
  assert(
    resCancelable.data.historialEstados?.length === 1 &&
      resCancelable.data.historialEstados?.[0].estado === "recibido",
    "Bitácora inicial registra el estado 'recibido'"
  );
  assert(
    obtenerStockPorSku("AN-HDY-L") === stockAntesCancelacion - 2,
    "Stock descontado al crear la orden"
  );

  const resCancelar = await cancelarPedido(
    resCancelable.data.codigo,
    "Cancelado por cliente"
  );
  assert(
    resCancelar.status === 200 && resCancelar.data?.cancelado === true,
    "Cancelación en 'recibido' devuelve 200 y marca la orden"
  );
  assert(
    resCancelar.data?.motivoCancelacion === "Cancelado por cliente",
    "Motivo de cancelación persistido"
  );
  assert(
    resCancelar.data?.historialEstados?.some((h) => h.estado === "cancelado") ===
      true,
    "Bitácora registra el estado 'cancelado'"
  );
  assert(
    obtenerStockPorSku("AN-HDY-L") === stockAntesCancelacion,
    "Stock revertido atómicamente tras la cancelación"
  );

  const resAvanzarCancelado = await avanzarEstado(resCancelable.data.codigo);
  assert(
    resAvanzarCancelado.status === 409,
    "Orden cancelada no admite avance de estado (409)"
  );

  const resCancelarInexistente = await cancelarPedido("ZZZZ");
  assert(
    resCancelarInexistente.status === 404,
    "Cancelar una orden inexistente devuelve 404"
  );

  const stockAntesTsh = obtenerStockPorSku("AN-TSH-M") ?? 0;
  const resPreparando = await crearPedido(
    "Diego Araya",
    "Av. Apoquindo 4700",
    "Las Condes",
    [
      {
        sku: "AN-TSH-M",
        nombre: "Signal Tee Cobalto",
        talla: "M",
        cantidad: 1,
        precioUnitario: 29990,
      },
    ],
    "Courier Express 24h"
  );
  await avanzarEstado(resPreparando.data.codigo);
  const resCancelarPreparando = await cancelarPedido(
    resPreparando.data.codigo
  );
  assert(
    resCancelarPreparando.status === 409,
    "No se puede cancelar una orden en 'preparando' (409)"
  );
  assert(
    obtenerStockPorSku("AN-TSH-M") === stockAntesTsh - 1,
    "El stock NO se revierte cuando la cancelación se rechaza (409)"
  );

  const pedidoCancelado = resCancelar.data;
  const analiticaCancelada = calcularAnaliticaOperacion(
    pedidoCancelado ? [pedidoCancelado] : [],
    obtenerCatalogoConStock()
  );
  assert(
    analiticaCancelada.total === 0 && analiticaCancelada.ventasNetas === 0,
    "La analítica operativa excluye las órdenes canceladas"
  );

  // Restauración manual de stock: respeta el tope físico (stockInicial).
  const stockTope = obtenerStockPorSku("AN-CAP-U") ?? 0;
  restaurarStockAtomico([
    { sku: "AN-CAP-U", nombre: "Studio Cap", cantidad: 999 },
  ]);
  assert(
    obtenerStockPorSku("AN-CAP-U") === 12,
    "restaurarStockAtomico nunca supera el stockInicial de la variante"
  );
  resetearCatalogoBase();
  assert(
    obtenerStockPorSku("AN-CAP-U") === stockTope,
    "resetearCatalogoBase restituye el catálogo base"
  );

  await vaciarPedidos();
  console.log("\n🎉 TODAS LAS PRUEBAS AUTOMATIZADAS PASARON SATISFACTORIAMENTE (100% OK).");
}

runTests().catch((err) => {
  console.error("Error en pruebas:", err);
  process.exit(1);
});
