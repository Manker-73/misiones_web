# Analizador de Récords WCA
Misión M2 · Consumo de APIs y Asincronía.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta el comando `npm install` para instalar las dependencias de Vite y TypeScript.
3. Ejecuta `npm run dev` para levantar el servidor de desarrollo local.
4. Abre la URL proporcionada en tu navegador.
5. Selecciona una de las **13 categorías oficiales de la WCA** (`3x3x3`, `2x2x2`, `4x4x4`, `5x5x5`, `6x6x6`, `7x7x7`, `Blindfolded`, `One-Handed`, `Clock`, `Megaminx`, `Pyraminx`, `Skewb` o `Square-1`), la modalidad (**Single** o **Average**), el país en el menú desplegable y la cantidad máxima de registros que deseas visualizar (entre 1 y 1000, por defecto 50), y haz clic en **"Analizar Récords"**.
6. La aplicación consultará el ranking mundial de la categoría elegida (optimizando la descarga a la cantidad solicitada si el filtro es global, o inspeccionando hasta los 1000 registros mundiales si se filtra por un país específico), resolverá las identidades en lotes controlados de 50 peticiones mostrando el progreso en tiempo real, formateará los tiempos según el estándar oficial WCA (`ss.cc` o `m:ss.cc`) y renderizará tanto las tarjetas (con banderas ISO y podio para el Top 3) como un panel de análisis estadístico completo.
## Uso de IA
Usé Gemini en la web como pareja de programación.
Ejemplo de prompt real: "Crea una aplicación (con Vite) que consuma una API pública real usando fetch + async/await, módulos ES y métodos de array".
Gemini me ayudó en la fase de investigación para descartar APIs que no cumplían los requisitos (como una que requería backend propio u otra con autenticación OAuth) hasta dar con los datos públicos de la WCA.
Escribí a mano e iteré: La adaptación al límite de cuota del `localStorage` (`QuotaExceededError`) mediante limpieza selectiva por prefijo, la extracción de constantes e interfaces compartidas a `types.ts`, el diccionario ISO en `paises.ts`, la caché en `cache.ts`, el control de concurrencia por lotes distinguiendo fallos de red frente a perfiles inexistentes y la refactorización integral de la interfaz a nodos puros del DOM sin estilos en línea.

## Autopsia
1. **Arquitectura modular estricta y desacoplada:** Separé el código en seis módulos con responsabilidades únicas: `types.ts` (interfaces compartidas y constantes globales como `LIMITE_MAXIMO_RANKING = 1000`), `cache.ts` (almacenamiento local seguro con genéricos y caducidad TTL), `api.ts` (red, validación estructural con *type guards* y control de *timeout*), `transformers.ts` (funciones puras de negocio, filtrado, ordenación y agrupación estadística sin depender de `api.ts`), `paises.ts` (diccionario estático ISO) y `ui.ts` (construcción del DOM), dejando `main.ts` únicamente como orquestador mediante una función reutilizable (`ejecutarAnalisisRanking`).

2. **Concurrencia controlada por lotes (`Promise.all` + `reduce`), `AbortController` y distinción de fallos:** Para cruzar los IDs del ranking con los perfiles individuales de hasta 1000 competidores, implementé una cola asíncrona funcional (`fetchDetallesEnLotes`) que ejecuta las peticiones en lotes de 50 e informa del progreso en tiempo real. Cada petición incorpora un `AbortController` con un límite de 8 segundos y distingue explícitamente entre un fallo de red (`'red'`) y un perfil inexistente o corrupto (`'no_encontrado'`), lanzando un error de desconexión si cae la red durante la descarga.

3. **Caché resiliente con caducidad (TTL), invalidación activa y borrado selectivo:** Antes de persistir cada perfil en `localStorage`, extraigo únicamente un objeto ligero (`{ name, country }`) envuelto con una marca temporal (`timestamp`) para invalidar datos obsoletos (24 horas para el ranking y 30 días para perfiles). Además, si un registro en caché no supera los *type guards* (`esRankingValido` / `esPersonaValida`), la clave corrupta se purga inmediatamente con `eliminarDeCache`. Ante un `QuotaExceededError`, se borran exclusivamente las claves con prefijo `wca_`.

4. **Manipulación 100% segura del DOM y cero estilos en línea:** Construí toda la interfaz (incluyendo el panel de estadísticas, banderas dinámicas y medallas de podio) exclusivamente con `document.createElement`, `textContent` y `replaceChildren`, delegando todos los estilos a clases en `style.css` (sin ningún atributo `style` en `index.html` ni en TypeScript) y evitando por completo `.innerHTML` para erradicar vectores XSS.

5. **Pipeline funcional con `flatMap` y `reduce`:** Centralicé en `transformers.ts` el encadenamiento de métodos de array usando `flatMap` para filtrar y construir los perfiles válidos en una sola pasada, `sort` y `slice` acotado con `Math.min` / `Math.max`, y `reduce` tanto para calcular las métricas de tiempo como para encontrar el país dominante sin necesidad de ordenar todo el mapa de frecuencias.