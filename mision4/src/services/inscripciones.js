// Capa de servicios: aquí vive todo lo que sabe de HTTP.
// Los componentes no llaman a fetch: usan los hooks de src/hooks.

import { esquemaInscripcionApi } from "../schemas/inscripcion";

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

// BONUS: validamos la respuesta con Zod antes de dársela a la interfaz.
// Usamos safeParse elemento a elemento: un registro corrupto se descarta
// (y se avisa) en lugar de romper la lista entera.
export async function obtenerInscripciones() {
  const datos = await peticion("/inscripciones");

  if (!Array.isArray(datos)) {
    throw new Error("El servidor devolvió datos con un formato inesperado.");
  }

  const inscripciones = [];
  let descartadas = 0;

  for (const item of datos) {
    const resultado = esquemaInscripcionApi.safeParse(item);
    if (resultado.success) {
      inscripciones.push(resultado.data);
    } else {
      descartadas++;
      // En la consola queda el detalle de qué campos fallan (útil para depurar)
      console.warn(`Inscripción descartada (id: ${item?.id}):`, resultado.error.issues);
    }
  }

  return { inscripciones, descartadas };
}

export function crearInscripcion(datos) {
  return peticion("/inscripciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    // datos ya viene validado y transformado por Zod (fecha ISO, WCA ID en mayúsculas…)
    body: JSON.stringify({ ...datos, fechaInscripcion: new Date().toISOString() }),
  });
}
