# Analizador de Récords WCA (React Edition)
Misión M3 · Migración a React, Componentes y Gestión de Estado con TypeScript.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto (`mision3`).
2. Ejecuta el comando `npm install` para instalar las dependencias de React 19, Vite, TypeScript y ESLint.
3. Ejecuta `npm run dev` para levantar el servidor de desarrollo local con *Hot Module Replacement* (HMR).
4. Abre la URL proporcionada en tu navegador.
5. Selecciona una de las **13 categorías oficiales de la WCA** (`3x3x3`, `2x2x2`, `4x4x4`, `5x5x5`, `6x6x6`, `7x7x7`, `Blindfolded`, `One-Handed`, `Clock`, `Megaminx`, `Pyraminx`, `Skewb` o `Square-1`), la modalidad (**Single** o **Average**), el país en el menú desplegable y la cantidad máxima de registros que deseas visualizar (entre 1 y 1000, por defecto 50), y haz clic en **"Analizar Récords"** (pudiendo abortar cualquier consulta en curso mediante el botón **"Cancelar"** o al cambiar de filtro en caliente).
6. La aplicación consultará el ranking mundial de la categoría elegida, resolverá las identidades en lotes controlados de 50 peticiones actualizando el estado reactivo con barra de progreso en tiempo real y renderizará mediante componentes declarativos tanto las tarjetas (`TarjetaCuber` con resaltado de podio para el Top 3) como el panel de análisis estadístico y su gráfico de barras de distribución por países (`PanelEstadisticas`).

## Uso de IA
Usé Gemini en la web como pareja de programación actuando con el rol de desarrollador Frontend Senior experto en migraciones a Vite y React.
Ejemplo de prompt real: "Actúa como un desarrollador Frontend Senior experto en migraciones a Vite. Actualmente estoy migrando mi proyecto a Vite... Necesito tu ayuda para trasladar y adaptar el código del proyecto antiguo al nuevo".
Gemini me ayudó a identificar qué módulos de dominio (`api.ts`, `cache.ts`, `transformers.ts`, `paises.ts`, `formatters.ts` y `types.ts`) eran 100% reutilizables sin cambios y cómo transformar la manipulación imperativa del DOM (`ui.ts` y `main.ts`) en componentes declarativos de React (`.tsx`).
Escribí a mano, adapté e iteré: La integración de la máquina de estados discriminada (`EstadoVista`) en `App.tsx`, el manejo de `useRef` para persistir la instancia activa de `AbortController` entre *re-renders* sin disparar ciclos innecesarios, y el ajuste de encadenamiento de causas de error (`{ cause: error }`) en `api.ts` para cumplir con la regla estricta `preserve-caught-error` de ESLint 10.

## Autopsia
1. **Reutilización intacta de la capa de dominio y servicios (Arquitectura Limpia):** Gracias al desacoplamiento previo en la Misión 2, pude migrar de Vanilla TS a React 19 conservando intactos seis módulos puros en TypeScript (`types.ts`, `formatters.ts`, `paises.ts`, `cache.ts`, `api.ts` y `transformers.ts`), reemplazando únicamente la capa de presentación (`ui.ts` y `main.ts`) por el árbol de componentes en React (`App.tsx`, `PanelEstadisticas.tsx` y `TarjetaCuber.tsx`).

2. **De manipulación imperativa del DOM a UI declarativa y Formularios Controlados:** Sustituí todas las llamadas a `document.createElement`, `replaceChildren` y `addEventListener` por JSX declarativo e *inputs* controlados mediante `useState`. El estado visual de la aplicación ahora se gobierna mediante una unión discriminada en TypeScript (`EstadoVista`: `'inicial' | 'cargando' | 'cancelado' | 'error' | 'exito'`), garantizando que sea imposible representar estados inconsistentes en la interfaz.

3. **Gestión de `AbortController` con `useRef` y concurrencia por lotes:** En lugar de usar una variable global mutable, encapsulé el `AbortController` activo dentro de un hook `useRef<AbortController | null>(null)`. Esto permite abortar peticiones en curso de forma inmediata al pulsar "Cancelar" o al cambiar un selector en mitad de una descarga por lotes (`fetchDetallesEnLotes`), evitando condiciones de carrera sin provocar *re-renders* adicionales al mutar la referencia.

4. **Componentización modular y tipado estricto de `Props`:** Dividí la visualización de resultados en componentes especializados con interfaces de propiedades (`Props`) estrictas: `PanelEstadisticas.tsx` (que encapsula las cajas de métricas, avisos de perfiles omitidos y el gráfico de barras nativo con `<progress>`) y `TarjetaCuber.tsx` (que calcula las insignias y estilos de podio para cada competidor renderizado con su `key` única basada en `cuber.id`).

5. **Cumplimiento estricto de ESLint 10 y TypeScript 6 (`verbatimModuleSyntax` y `preserve-caught-error`):** Configuré el proyecto bajo las reglas más recientes del ecosistema, separando explícitamente las importaciones de tipos (`import type`) y enriqueciendo el manejo de excepciones de red en `api.ts` mediante la propiedad estándar `{ cause: error }` al instanciar nuevos errores en los bloques `catch`, preservando así la traza original del fallo.