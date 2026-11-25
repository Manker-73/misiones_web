# Cubo Solver · Landing page (mision5)
Misión M5 · Pixel Perfect: landing page de **Cubo Solver**, mi generador de scrambles y solucionador visual de puzzles, maquetada con **Tailwind CSS v4** (configuración CSS-first con `@import` + `@theme`, sin `tailwind.config.js`), mobile-first, con modo oscuro y un sistema de diseño propio.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta `npm install` para instalar las dependencias (Vite, `tailwindcss` y `@tailwindcss/vite`).
3. Ejecuta `npm run dev` y abre la URL que aparece en el navegador.
4. Pulsa el botón **☀ / ☾** de la cabecera para cambiar entre tema oscuro (por defecto) y claro. La elección se guarda y se mantiene al recargar.
5. Abre las DevTools en modo dispositivo y prueba los anchos **360 px**, **768 px** y **1280 px** para ver cómo se reorganiza la página.
6. **Bonus:** recarga la página para ver las animaciones de entrada (`animate-fade-up` en el texto y `animate-sticker-pop` en las pegatinas del cubo), definidas con `@keyframes` dentro de `@theme`.

## Uso de IA
Usé Claude como pareja de programación: para montar el proyecto con Vite y Tailwind v4 a partir del enunciado, y para generar una primera versión del sistema de diseño y de cada sección, que después revisé en el navegador en los distintos anchos y temas.
Ejemplos de prompts reales:
- "Vamos a empezar con el código, ve diciéndome cómo empezar." (Decidimos hacer la landing por secciones y revisar cada una antes de pasar a la siguiente.)
- "Se ve fatal." (La página salía sin estilos: el servidor de Vite se había arrancado antes de crear `vite.config.js`, así que el plugin de Tailwind no estaba activo. Se arregló reiniciando `npm run dev`.)

Iteré y validé manualmente: elegí el producto y la dirección visual, comprobé la página en 360, 768 y 1280 px y revisé el contraste en ambos temas.

## Autopsia
1. **Configuración CSS-first de Tailwind v4:** No hay `tailwind.config.js` ni PostCSS. Tailwind entra como plugin de Vite (`@tailwindcss/vite` en `vite.config.js`) y toda la configuración vive en `src/style.css`: `@import "tailwindcss"` y un bloque `@theme` con los tokens.

2. **Sistema de diseño con tokens propios en `@theme`:** Cada token genera sus utilidades automáticamente.
   - **Neutros:** dos escalas con nombre propio, `ink-*` para el tema oscuro y `paper-*` para el claro, en lugar de los grises por defecto.
   - **Color de marca:** los seis colores de pegatina del cubo (`cube-white`, `cube-yellow`, `cube-red`, `cube-orange`, `cube-blue`, `cube-green`) definidos en `oklch`.
   - **Tipografía y formas:** `font-display` (Space Grotesk), `font-mono` (JetBrains Mono, para la notación de movimientos) y `rounded-sticker`.

3. **Mobile-first:** Las clases sin prefijo son las de móvil, y los breakpoints solo añaden cambios hacia arriba:
   - `sm:` agranda el titular y pone los botones del hero en fila.
   - `md:` muestra el menú de navegación.
   - `lg:` pasa el hero a dos columnas.

4. **Flexbox y Grid donde corresponde:** Flexbox para alinear en una dimensión (cabecera, grupo de botones). Grid para estructuras bidimensionales: el hero en dos columnas y la cara del cubo como un `grid-cols-3` de pegatinas cuadradas (`aspect-square`). No hay posicionamiento absoluto ni márgenes mágicos; la cabecera solo usa `sticky`.

5. **Modo oscuro por clase:** `@custom-variant dark (&:where(.dark, .dark *))` hace que `dark:` dependa de la clase `.dark` en `<html>`, no de la preferencia del sistema, para poder cambiarlo con un botón. El tema oscuro es el de por defecto. Un pequeño script en el `<head>` aplica el tema guardado en `localStorage` antes de pintar, para que no haya parpadeo. El botón expone su estado con `aria-pressed`. El acento cambia de tema a tema (`text-cube-blue` en claro, `dark:text-cube-yellow` en oscuro), porque el amarillo no tiene contraste suficiente sobre fondo claro.

6. **Bonus: animaciones registradas como utilidades:** `--animate-fade-up` y `--animate-sticker-pop` se declaran en `@theme` junto a sus `@keyframes`, así que se usan como cualquier clase (`animate-sticker-pop`). Las pegatinas del cubo aparecen escalonadas con retrasos arbitrarios (`[animation-delay:60ms]`, `120ms`…).
