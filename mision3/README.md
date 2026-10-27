# Analizador de Récords WCA (React Edition)
Misión M3 · Arquitectura de Componentes, Gestión de Estado, Efectos y Custom Hooks en React + TypeScript.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta `npm install` para instalar las dependencias de React 19, TypeScript y Vite.
3. Ejecuta `npm run dev` para levantar el servidor de desarrollo local.
4. Abre la URL proporcionada en tu navegador.
5. Selecciona una de las **13 categorías oficiales de la WCA** (`3x3x3`, `2x2x2`, `4x4x4`, `5x5x5`, `6x6x6`, `7x7x7`, `Blindfolded`, `One-Handed`, `Clock`, `Megaminx`, `Pyraminx`, `Skewb` o `Square-1`), la modalidad (**Single** o **Average**), el país en el menú desplegable y el límite del Top (entre 1 y 1000, por defecto 50), y haz clic en **"Analizar Récords"** (pudiendo abortar cualquier consulta en curso con **"Cancelar"** o cambiando un selector).
6. Tus preferencias de filtrado persisten automáticamente gracias al hook personalizado `useLocalStorage`. Al analizar, el hook `useWcaRanking` descarga el ranking y resuelve las identidades en lotes controlados de 50 peticiones con barra de progreso en tiempo real, renderizando las tarjetas de competidores (con medallas de podio para el Top 3), métricas agregadas y un gráfico de barras de distribución por países.

## Uso de IA
Usé Gemini en la web como pareja de programación para planificar la refactorización desde Vanilla TypeScript hacia React 19 + TypeScript.
Ejemplo de prompt real: "Ayúdame a desacoplar App.tsx en componentes cohesivos (FiltrosPanel, CampoSelect, VistaResultado, BarraProgreso, GraficoPaises) y a extraer la orquestación asíncrona y la caché en Custom Hooks reutilizables con useEffect y cleanup".
Iteré y validé manualmente: La implementación del cleanup del `AbortController` dentro del `useEffect` de `useWcaRanking` para soportar el doble montaje de `StrictMode` sin fugas de memoria ni condiciones de carrera, la eliminación de estado redundante derivando `opcionesPaises` y `paisSeleccionadoValido` directamente de la respuesta activa, y el tipado estricto de las props específicas en `PanelEstadisticas`.

## Autopsia
1. **Descomposición granular de componentes y eliminación del componente-dios:** `App.tsx` actúa únicamente como coordinador declarativo (~100 líneas) delegando la interfaz en componentes especializados con responsabilidad única: `Header`, `FiltrosPanel` (que reutiliza el componente genérico `CampoSelect` para evitar duplicar marcado en los desplegables), `VistaResultado` (que despacha cada rama de la unión discriminada mediante un `switch` con *early returns*), `BarraProgreso`, `PanelEstadisticas` (con props granulares estrictamente tipadas), `GraficoPaises` y `TarjetaCuber`.

2. **Gestión de estado con uniones discriminadas y estado 100% derivado:** El estado del ciclo de vida de la petición se modela con la unión discriminada `EstadoVista` (`inicial` | `cargando` | `cancelado` | `error` | `exito`), haciendo imposibles los estados incoherentes. Se eliminaron las fuentes de verdad duplicadas: `estaCargando`, `opcionesPaises`, `paisSeleccionadoValido` y `limiteDerivado` se calculan como estado derivado puro en cada renderizado en lugar de sincronizarse con `useState` adicionales.

3. **Custom Hook `useWcaRanking` con `useEffect` y cleanup de `AbortController`:** Toda la orquestación asíncrona por lotes vive en `src/hooks/useWcaRanking.ts`. El `useEffect` reacciona a los cambios en el objeto `consulta` e incluye una función de *cleanup* (`return () => controller.abort()`) que cancela automáticamente cualquier petición en vuelo tanto si el usuario cambia de filtro a mitad de carga como si el componente se desmonta (garantizando compatibilidad total con `StrictMode`).

4. **Custom Hook `useLocalStorage` con TTL y sincronización entre pestañas (Reto Bonus):** Además de la caché de red para rankings y perfiles (`cache.ts`), construí `src/hooks/useLocalStorage.ts` para persistir de forma reactiva los filtros del usuario con control de expiración (TTL), manejo de `QuotaExceededError` y un `useEffect` suscrito al evento `window.onstorage` con su correspondiente *cleanup*.

5. **Renderizado declarativo de listas con keys estables:** Todas las colecciones (`CampoSelect`, `GraficoPaises`, métricas en `PanelEstadisticas` y `TarjetaCuber`) utilizan identificadores únicos de dominio (`op.valor`, `pais`, `etiqueta` y `cuber.id`) como `key`, evitando el uso del índice del array como clave de reconciliación.