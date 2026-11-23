/** Cuenta ficticia para defensa UTEM; no autoriza operaciones de servidor. */

export const USUARIO_DEMO = "bodega@ateliernoir.cl";
export const CLAVE_DEMO = "Demo2026!";

export function validarCredencialesDemo(
  correo: string,
  clave: string
): boolean {
  return (
    correo.trim().toLowerCase() === USUARIO_DEMO &&
    clave === CLAVE_DEMO
  );
}
