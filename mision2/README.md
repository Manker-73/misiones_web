# Analizador de Récords WCA
Misión M2 · Consumo de APIs y Asincronía.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta el comando `npm install` para instalar las dependencias de Vite y TypeScript.
3. Ejecuta `npm run dev` para levantar el servidor de desarrollo local.
4. Abre la URL proporcionada en tu navegador.
5. Selecciona una de las **13 categorías oficiales de la WCA** (`3x3x3`, `2x2x2`, `4x4x4`, `5x5x5`, `6x6x6`, `7x7x7`, `Blindfolded`, `One-Handed`, `Clock`, `Megaminx`, `Pyraminx`, `Skewb` o `Square-1`), la modalidad (**Single** o **Average**), el país en el menú desplegable y la cantidad máxima de registros que deseas visualizar (entre 1 y 1000, por defecto 50), y haz clic en **"Analizar Récords"** (pudiendo abortar cualquier consulta en curso mediante el botón **"Cancelar"** o al cambiar de filtro).
6. La aplicación consultará el ranking mundial de la categoría elegida, resolverá las identidades en lotes controlados de 50 peticiones con barra de progreso en tiempo real y renderizará tanto las tarjetas (con resaltado de podio para el Top 3) como un panel de análisis estadístico y un gráfico de barras de distribución por países (cuando se analiza el ranking global).

## Uso de IA
Usé Gemini en la web como pareja de programación.
Ejemplo de prompt real: "Crea una aplicación (con Vite) que consuma una API pública real usando fetch + async/await, módulos ES y métodos de array".
Gemini me ayudó en la fase de investigación para descartar APIs que no cumplían los requisitos (como una que requería backend propio u otra con autenticación OAuth) hasta dar con los datos públicos de la WCA.
Escribí a mano e iteré: La adaptación al límite de cuota del `localStorage` (`QuotaExceededError`) mediante limpieza selectiva por prefijo, la separación de responsabilidades en `types.ts`, `formatters.ts`, `paises.ts` y `cache.ts`, la cancelación de consultas en vuelo con `AbortController` compartido y la refactorización integral de la interfaz (incluyendo gráficos con `<progress>`) a nodos puros del DOM sin estilos en línea.

## Autopsia
1. **Arquitectura modular estricta y desacoplada:** Separé el código en siete módulos con responsabilidades únicas: `types.ts` (interfaces y constantes globales), `formatters.ts` (formateo puro de tiempos WCA y porcentajes), `paises.ts` (diccionario ISO y gestión de opciones de catálogos), `cache.ts` (almacenamiento local seguro con genéricos y TTL), `api.ts` (funciones de red puras desacopladas de sus envoltorios con caché y validación con *type guards*), `transformers.ts` (lógica pura de transformación de arrays y cálculo estadístico) y `ui.ts` (construcción del DOM), dejando `main.ts` como orquestador.

2. **Concurrencia por lotes (`for...of` + `Promise.all`) y cancelación con `AbortController` compartido:** Para cruzar los IDs del ranking con los perfiles individuales de hasta 1000 competidores, implementé `fetchDetallesEnLotes` iterando secuencialmente los lotes de 50 mediante `for...of` y `await Promise.all(...)` para máxima legibilidad. Además, `main.ts` gestiona un `AbortController` compartido que permite al usuario cancelar manualmente la petición en curso o abortar automáticamente consultas anteriores si cambia los selectores, evitando condiciones de carrera.

3. **Caché resiliente con caducidad (TTL), invalidación activa y borrado selectivo:** Antes de persistir cada perfil en `localStorage`, extraigo únicamente un objeto ligero (`{ name, country }`) envuelto con una marca temporal (`timestamp`). Todas las operaciones de lectura, escritura y limpieza por prefijo (`limpiarCachePropia`) están protegidas con bloques `try/catch`, y cualquier entrada corrupta que no supere los *type guards* (`esRankingValido` validando tiempos finitos y positivos, y `esPersonaValida`) se invalida al instante.

4. **Manipulación 100% segura del DOM, gráficos nativos y cero estilos en línea:** Construí toda la interfaz (incluyendo un gráfico de barras de distribución por nacionalidades mediante elementos nativos `<progress>` y las medallas de podio) exclusivamente con `document.createElement`, `textContent` y `replaceChildren`, sin ningún atributo `style` en línea ni `.innerHTML`.

5. **Pipeline funcional con `filter`, `map`, `sort` y `reduce`:** Centralicé en `transformers.ts` el encadenamiento de `filter` + `map` + `sort` + `slice`, y optimicé `reduce` mutando el acumulador para calcular en una sola pasada la suma, el mejor y el peor registro sin instanciar objetos intermedios, además de obtener la distribución porcentual de países y el país dominante.