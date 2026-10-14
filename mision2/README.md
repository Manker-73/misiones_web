# Analizador de Récords WCA
Misión M2 · Consumo de APIs y Asincronía.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta el comando `npm install` para instalar las dependencias de Vite y TypeScript.
3. Ejecuta `npm run dev` para levantar el servidor de desarrollo local.
4. Abre la URL proporcionada (normalmente `http://localhost:5173/`) en tu navegador.
5. Selecciona un país en el menú desplegable (generado dinámicamente con todos los países ISO 3166-1), define la cantidad máxima de registros que deseas visualizar (entre 1 y 1000, por defecto 50) y haz clic en **"Analizar Récords"**.
6. La aplicación consultará el ranking mundial de Cubo de Rubik (3x3) (optimizando la descarga a la cantidad solicitada si el filtro es global, o inspeccionando hasta los 1000 registros mundiales si se filtra por un país específico), resolverá las identidades en lotes controlados de 50 peticiones mostrando el progreso en tiempo real, y renderizará tanto las tarjetas como un panel de análisis estadístico (tiempo medio, mejor marca, peor marca y país dominante).

## Uso de IA
Usé Gemini en la web como pareja de programación.
Ejemplo de prompt real: "Crea una aplicación (con Vite) que consuma una API pública real usando fetch + async/await, módulos ES y métodos de array".
Gemini me ayudó en la fase de investigación para descartar APIs que no cumplían los requisitos (como una que requería backend propio u otra con autenticación OAuth) hasta dar con los datos públicos de la WCA.
Escribí a mano e iteré: La adaptación al límite de cuota del `localStorage` (`QuotaExceededError`) mediante limpieza selectiva por prefijo, la extracción del diccionario de países ISO 3166-1 y del sistema de caché a módulos independientes (`paises.ts` y `cache.ts`), el control de concurrencia por lotes y la refactorización integral de la interfaz a nodos puros del DOM sin estilos en línea.

## Autopsia
1. **Arquitectura modular estricta y desacoplada:** Separé el código en cinco módulos con responsabilidades únicas: `cache.ts` (almacenamiento local seguro con genéricos y caducidad TTL), `api.ts` (red, validación estructural con *type guards* y control de *timeout*), `transformers.ts` (funciones puras de negocio, filtrado, ordenación y agrupación estadística), `paises.ts` (diccionario estático ISO) y `ui.ts` (construcción del DOM), dejando `main.ts` únicamente como orquestador mediante una función reutilizable (`ejecutarAnalisisRanking`). Descarté mantener la caché dentro de `api.ts` o permitir que `ui.ts` importase directamente el diccionario de países para evitar el acoplamiento entre la capa de vista y los datos estáticos.

2. **Concurrencia controlada por lotes (`Promise.all` + `reduce`) y `AbortController`:** Para cruzar los IDs del ranking con los perfiles individuales de hasta 1000 competidores, implementé una cola asíncrona funcional (`fetchDetallesEnLotes`) que ejecuta las peticiones en lotes de 50 en lugar de disparar mil conexiones simultáneas, optimizando además la muestra cuando el usuario consulta el ranking global. Cada petición incorpora un `AbortController` con un límite de 8 segundos y notifica el progreso a la interfaz. Descarté tanto un bucle secuencial `for...await` (demasiado lento) como un único `Promise.all` masivo de 1000 elementos (que satura la red y carece de indicador de progreso).

3. **Caché resiliente con caducidad (TTL) y borrado selectivo:** Antes de persistir cada perfil en `localStorage`, extraigo únicamente un objeto ligero (`{ name, country }`) y lo envuelvo junto a una marca temporal (`timestamp`) para invalidar datos obsoletos (24 horas para el ranking y 30 días para perfiles). Protegí todas las lecturas (`JSON.parse`) y escrituras (`setItem`) con bloques `try/catch`. Descarté guardar el JSON completo de la WCA porque el historial de competiciones saturaba los 5 MB del navegador, y descarté usar `localStorage.clear()` ante un `QuotaExceededError` para no destruir datos ajenos en el mismo origen, borrando exclusivamente las claves con prefijo `wca_`.

4. **Manipulación 100% segura del DOM y tipado sin `any`:** Construí toda la interfaz (incluyendo el panel de análisis y las tarjetas de competidores) exclusivamente con `document.createElement`, `textContent` y `replaceChildren`, delegando todos los estilos a clases en `style.css`. Descarté por completo el uso de `.innerHTML` al pintar datos procedentes de la API para eliminar cualquier vector de inyección XSS, y reemplacé los tipos `any` por interfaces estrictas y validadores en tiempo de ejecución (`unknown` + *type guards*) que distinguen entre fallos de red, errores HTTP y respuestas con estructura inválida.

5. **Pipeline funcional de transformación y análisis con `reduce`:** Centralicé en `transformers.ts` el encadenamiento de métodos de array (`filter`, `map`, `sort` y `slice`) junto con el acotamiento matemático del límite de usuario (`Math.min` / `Math.max`). En lugar de limitar el uso de `reduce` a un cálculo aislado en consola, implementé un motor estadístico puro que devuelve a la interfaz la media, el mejor y peor registro, y agrupa los competidores por país para identificar la nacionalidad dominante del conjunto analizado.