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
Usé Claude como pareja de programación durante todo el proyecto. Me ayudó a montar el entorno con Vite y Tailwind v4 a partir del enunciado, a plantear un sistema de diseño coherente y a generar una primera versión de cada sección. Trabajamos por iteraciones cortas: Claude proponía el código de una sección, yo la revisaba en el navegador y, antes de pasar a la siguiente, la ajustaba o pedía cambios.

Las decisiones de fondo fueron mías:
- **El producto**, mi propio proyecto Cubo Solver, en lugar de uno inventado.
- **La dirección visual**: los colores de pegatina del cubo como paleta y oscuro por defecto.
- **El alcance**: una landing estática sin frameworks, para que todo el peso recaiga en Tailwind.

Ejemplos de prompts:
- *"Quiero empezar a programar la landing. Guíame paso a paso: ¿por dónde empiezo y en qué orden construimos las secciones?"* Acordamos dividir la landing en secciones (hero, puzzles, funciones, cómo funciona, CTA) y validar cada una antes de seguir.
- *"He abierto la página y se ve completamente rota, como si no tuviera ningún estilo. ¿Qué está fallando?"* Revisando el CSS que servía Vite vimos que Tailwind no se estaba compilando: el servidor se había arrancado antes de crear `vite.config.js`, así que el plugin no estaba cargado. Bastó con reiniciar `npm run dev`. Me sirvió para entender que Vite no detecta un archivo de configuración nuevo en caliente.

Para validar el resultado, revisé cada sección en 360, 768 y 1280 px con el modo dispositivo de las DevTools. También comprobé el contraste del texto y de los acentos en los dos temas y que la elección de tema se mantuviera al recargar.

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

4. **Flexbox y Grid donde corresponde:** Flexbox para alinear en una dimensión: la cabecera, los grupos de botones, las etiquetas de puzzles con `flex-wrap` y el interior de cada tarjeta, donde `mt-auto` empuja el enlace al fondo. Grid para estructuras bidimensionales:
   - El hero en dos columnas, y la cara del cubo como un `grid-cols-3` de pegatinas cuadradas (`aspect-square`).
   - La sección de puzzles, con 1, 2 o 3 columnas según el ancho. La tarjeta grande de WCA Puzzles ocupa dos columnas con `md:col-span-2`.
   - La mini cara del cubo vendado, que usa `col-span-2` y `row-span-2` para representar piezas unidas.
   - El desarrollo plano del cubo en "Funciones": una rejilla de `grid-cols-4 grid-rows-3` donde cada cara se coloca en su celda con `col-start-*` y `row-start-*`, sin posicionamiento absoluto.

   En "Funciones", cada bloque es un `flex-col` en móvil que pasa a `md:flex-row` en escritorio, y el bloque central usa `md:flex-row-reverse` para alternar texto e imagen sin duplicar HTML. En la lista del modo aprender, `ml-auto` empuja el algoritmo al extremo derecho de su fila.

   No hay posicionamiento absoluto ni márgenes mágicos; la cabecera solo usa `sticky`, y las secciones usan `scroll-mt-20` para que la cabecera fija no tape los títulos al navegar desde el menú.

5. **Modo oscuro por clase:** `@custom-variant dark (&:where(.dark, .dark *))` hace que `dark:` dependa de la clase `.dark` en `<html>`, no de la preferencia del sistema, para poder cambiarlo con un botón. El tema oscuro es el de por defecto. Un pequeño script en el `<head>` aplica el tema guardado en `localStorage` antes de pintar, para que no haya parpadeo. El botón expone su estado con `aria-pressed`. El acento cambia de tema a tema (`text-cube-blue` en claro, `dark:text-cube-yellow` en oscuro), porque el amarillo no tiene contraste suficiente sobre fondo claro.

6. **Bonus: animaciones registradas como utilidades:** `--animate-fade-up` y `--animate-sticker-pop` se declaran en `@theme` junto a sus `@keyframes`, así que se usan como cualquier clase (`animate-sticker-pop`). Las pegatinas del cubo aparecen escalonadas con retrasos arbitrarios (`[animation-delay:60ms]`, `120ms`…).
