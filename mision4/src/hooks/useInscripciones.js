import { useQuery } from "@tanstack/react-query";
import { obtenerInscripciones } from "../services/inscripciones";

// Claves de query centralizadas: así la lista y la invalidación (paso 6)
// usan exactamente la misma clave y no hay strings repetidos por el código.
export const clavesInscripciones = {
  todas: ["inscripciones"],
  lista: () => [...clavesInscripciones.todas, "lista"],
};

// Más recientes primero
const porFechaDesc = (a, b) => b.fechaInscripcion.localeCompare(a.fechaInscripcion);

export function useInscripciones() {
  return useQuery({
    queryKey: clavesInscripciones.lista(),
    queryFn: obtenerInscripciones,
    // select transforma los datos para la vista sin tocar lo que hay en caché
    select: (inscripciones) => [...inscripciones].sort(porFechaDesc),
  });
}
