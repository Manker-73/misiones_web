# Analizador de Récords WCA
Misión M2 · Consumo de APIs y Asincronía — Web Development I.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta el comando `npm install` para instalar las dependencias de Vite.
3. Ejecuta `npm run dev` para levantar el servidor local.
4. Abre la URL proporcionada (normalmente `http://localhost:5173/`) en tu navegador.
5. Selecciona un país en el menú desplegable y haz clic en "Analizar Récords". La aplicación consultará el Top 10 mundial de Cubo de Rubik (3x3), cruzará los datos para resolver las identidades y calculará el tiempo medio.

## Uso de IA
Usé Gemini en la web como arquitecto de software y pareja de programación.
Ejemplo de prompt real: "Crea una aplicación (con Vite) que consuma una API pública real usando fetch + async/await, módulos ES y métodos de array".
Gemini me ayudó en la fase de investigación para descartar APIs que no cumplían los requisitos (como una que requería backend propio u otra con autenticación OAuth) hasta dar con la WCA API pública.
Escribí a mano e iteré: La adaptación al límite de cuota del `LocalStorage` (QuotaExceededError), la extracción del diccionario de países ISO 3166-1 a un módulo independiente y la refactorización final de la interfaz a nodos puros del DOM.

## Autopsia
1. **Arquitectura basada en Módulos ES:** Separé estrictamente el código en `api.ts` (red y caché), `transformers.ts` (métodos puros de array), `ui.ts` (manipulación visual) y `main.ts` (orquestador). Descarté programar todo en un único archivo JavaScript porque mezclar peticiones HTTP con manipulación del DOM viola el principio de responsabilidad única y dificulta el mantenimiento.

2. **Cruce de datos con Promise.all:** Implementé un flujo asíncrono que primero descarga el ranking (que solo contiene IDs) y luego dispara 10 peticiones simultáneas para descubrir el nombre real de cada competidor. Descarté mostrar simplemente los IDs numéricos o usar un bucle `for` tradicional con `await`, porque las peticiones en serie harían la aplicación excesivamente lenta en comparación con la ejecución en paralelo.

3. **Optimización agresiva de la Caché (LocalStorage):** Antes de guardar a un competidor en el `localStorage`, extraigo un objeto diminuto que contiene únicamente su nombre y su país. Descarté guardar la respuesta completa de la API porque esta incluía historiales masivos de cada jugador que reventaban el límite de 5MB del navegador (QuotaExceededError) con apenas 50 peticiones.

4. **Manipulación Segura del DOM:** Refactoricé la interfaz visual para usar `document.createElement` y `textContent` mediante funciones *helper*. Descarté inyectar strings gigantes de código usando `.innerHTML`, porque además de ensuciar el código TypeScript, abría la puerta a vulnerabilidades de inyección (XSS) si algún dato de la API contuviese caracteres maliciosos.