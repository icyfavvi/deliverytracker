import {
  CLAVE_DEMO,
  USUARIO_DEMO,
  validarCredencialesDemo,
} from "../src/services/demoAuth";

function verificar(
  condicion: boolean,
  descripcion: string
) {
  if (!condicion) {
    throw new Error(`Fallo: ${descripcion}`);
  }
}

verificar(
  validarCredencialesDemo(USUARIO_DEMO, CLAVE_DEMO),
  "usuario correcto"
);

verificar(
  validarCredencialesDemo(
    ` ${USUARIO_DEMO.toUpperCase()} `,
    CLAVE_DEMO
  ),
  "correo normalizado"
);

verificar(
  !validarCredencialesDemo(USUARIO_DEMO, "incorrecta"),
  "clave incorrecta"
);

verificar(
  !validarCredencialesDemo("otro@demo.cl", CLAVE_DEMO),
  "correo incorrecto"
);

console.log("OK: cuatro pruebas de autenticacion ficticia");
