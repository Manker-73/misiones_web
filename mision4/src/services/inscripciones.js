// Capa de servicios: aquí vive todo lo que sabe de HTTP.
// Los componentes no llaman a fetch: usan los hooks de src/hooks.

const API_URL = import.meta.env.VITE_API_URL;

// Envuelve fetch para dar errores con un mensaje útil para el usuario
async function peticion(ruta, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, opciones);
  } catch {
    // fetch solo rechaza ante fallos de red (servidor apagado, sin conexión, CORS…)
    throw new Error("No se pudo conectar con el servidor. ¿Está arrancada la API (npm run api)?");
  }

  // ⚠️ fetch NO rechaza con 4xx/5xx: hay que comprobarlo a mano
  if (!respuesta.ok) {
    throw new Error(`El servidor respondió con un error (${respuesta.status}). Inténtalo de nuevo.`);
  }
  return respuesta.json();
}

export function obtenerInscripciones() {
  return peticion("/inscripciones");
}
