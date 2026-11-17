import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { crearInscripcion, obtenerInscripciones } from "../services/inscripciones";

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

export function useCrearInscripcion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: crearInscripcion,
    // Tras crear, invalidamos TODAS las queries de inscripciones (["inscripciones", ...]):
    // Query las marca como obsoletas y vuelve a pedir la lista al servidor.
    // Devolver la promesa hace que la mutación siga "pendiente" hasta que la lista
    // esté actualizada, así el nuevo participante aparece a la vez que el mensaje de éxito.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clavesInscripciones.todas }),
  });
}
