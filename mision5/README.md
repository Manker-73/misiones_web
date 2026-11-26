# Cubo Solver · Landing page (mision5)
Misión M5 · Pixel Perfect: landing page de **Cubo Solver**, mi generador de scrambles y solucionador visual de puzzles, maquetada con **Tailwind CSS v4** (configuración CSS-first con `@import` + `@theme`, sin `tailwind.config.js`), mobile-first, con modo oscuro y un sistema de diseño propio.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta `npm install` para instalar las dependencias (Vite, `tailwindcss` y `@tailwindcss/vite`).
3. Ejecuta `npm run dev` y abre la URL que aparece en el navegador.
4. La página arranca con el tema de tu sistema. Pulsa el botón **☀ / ☾** de la cabecera para cambiarlo: la elección se guarda y se mantiene al recargar.
5. Abre las DevTools en modo dispositivo y prueba los anchos **360 px**, **768 px** y **1280 px** para ver cómo se reorganiza la página.
6. **Bonus:** recarga la página para ver las animaciones de entrada (`animate-fade-up` en el texto y `animate-sticker-pop` en las pegatinas del cubo), definidas con `@keyframes` dentro de `@theme`. Si tu sistema tiene activado "reducir movimiento", la página aparece sin animaciones.

## Uso de IA
Usé Claude como pareja de programación durante todo el proyecto. Me ayudó a montar el entorno con Vite y Tailwind v4 a partir del enunciado, a plantear un sistema de diseño coherente y a generar una primera versión de cada sección. Trabajamos por iteraciones cortas: Claude proponía el código de una sección, yo la revisaba en el navegador y, antes de pasar a la siguiente, la ajustaba o pedía cambios.

Las decisiones de fondo fueron mías:
- **El producto**, mi propio proyecto Cubo Solver, en lugar de uno inventado.
- **La dirección visual**: los colores de pegatina del cubo como paleta y oscuro por defecto.
- **El alcance**: una landing estática sin frameworks, para que todo el peso recaiga en Tailwind.

Ejemplos de prompts (reformulados, con la misma idea que los originales):
- *"Quiero empezar a programar la landing. Guíame paso a paso: ¿por dónde empiezo y en qué orden construimos las secciones?"* Acordamos dividir la landing en secciones (hero, puzzles, funciones, cómo funciona, CTA) y validar cada una antes de seguir.
- *"He abierto la página y se ve completamente rota, como si no tuviera ningún estilo. ¿Qué está fallando?"* Revisando el CSS que servía Vite vimos que Tailwind no se estaba compilando: el servidor se había arrancado antes de crear `vite.config.js`, así que el plugin no estaba cargado. Bastó con reiniciar `npm run dev`. Me sirvió para entender que Vite no detecta un archivo de configuración nuevo en caliente.

Para validar el resultado, revisé cada sección en 360, 768 y 1280 px con el modo dispositivo de las DevTools. También comprobé el contraste del texto y de los acentos en los dos temas y que la elección de tema se mantuviera al recargar.

## Autopsia
1. **Configuración CSS-first de Tailwind v4:** No hay `tailwind.config.js` ni PostCSS. Tailwind entra como plugin de Vite (`@tailwindcss/vite` en `vite.config.js`) y toda la configuración vive en `src/style.css`: `@import "tailwindcss"`, un bloque `@theme` con los tokens, `@custom-variant` para el modo oscuro y una `@utility` propia.

2. **Sistema de diseño con tokens propios en `@theme`:** Cada token genera sus utilidades automáticamente, y en el HTML no quedan valores arbitrarios de diseño.
   - **Neutros:** dos escalas con nombre propio, `ink-*` (950 a 300) para el tema oscuro y `paper-*` (50 a 300) para el claro, en lugar de los grises por defecto.
   - **Color de marca:** los seis colores de pegatina del cubo (`cube-white`, `cube-yellow`, `cube-red`, `cube-orange`, `cube-blue`, `cube-green`) definidos en `oklch`.
   - **Tipografía:** `font-display` (Space Grotesk) y `font-mono` (JetBrains Mono, para la notación de movimientos).
   - **Formas:** `rounded-pip` (pegatinas del logo), `rounded-sticker` (pegatinas del cubo) y `aspect-bar` (pieza vendada de dos pegatinas, 2:1).
   - **Ritmo vertical:** `--spacing-section` y `--spacing-section-lg`, de modo que todas las secciones usan `py-section md:py-section-lg` en lugar de repetir números sueltos.
   - **Sombra:** `shadow-cube`, con un tinte del azul de marca.
   - **Escalonado de animaciones:** `--stagger-step` junto con una utilidad funcional propia, `@utility stagger-*`. Así `stagger-3` equivale a 3 × 60 ms, sin `[animation-delay:…]` en el HTML.

3. **Mobile-first:** Las clases sin prefijo son las de móvil, y los breakpoints solo añaden cambios hacia arriba:
   - `sm:` agranda el titular, pone los botones del hero en fila y pasa los pasos de "Cómo funciona" a dos columnas.
   - `md:` pasa el hero y la cuadrícula de puzzles a dos columnas, alterna los bloques de "Funciones" en fila y cambia la navegación compacta por el menú completo.
   - `lg:` agranda el titular, pasa la cuadrícula de puzzles a tres columnas y los pasos a cuatro.

   En móvil la navegación no desaparece: bajo la cabecera hay una barra compacta con los tres enlaces (`md:hidden`), y las secciones usan `scroll-mt-28 md:scroll-mt-20` para compensar la cabecera, que en móvil es más alta.

4. **Flexbox y Grid donde corresponde:** Flexbox para alinear en una dimensión: la cabecera, los grupos de botones, las etiquetas de puzzles con `flex-wrap` y el interior de cada tarjeta, donde `mt-auto` empuja el enlace al fondo. Grid para estructuras bidimensionales:
   - El hero en dos columnas, y la cara del cubo como un `grid-cols-3` de pegatinas cuadradas (`aspect-square`).
   - La sección de puzzles, con 1, 2 o 3 columnas según el ancho. La tarjeta grande de WCA Puzzles ocupa dos columnas con `md:col-span-2`.
   - La mini cara del cubo vendado, que usa `col-span-2` y `row-span-2` para representar piezas unidas.
   - El desarrollo plano del cubo en "Funciones": una rejilla de `grid-cols-4 grid-rows-3` donde cada cara se coloca en su celda con `col-start-*` y `row-start-*`, sin posicionamiento absoluto.

   En "Funciones", cada bloque es un `flex-col` en móvil que pasa a `md:flex-row` en escritorio, y el bloque central usa `md:flex-row-reverse` para alternar texto e imagen sin duplicar HTML. En la lista del modo aprender, `ml-auto` empuja el algoritmo al extremo derecho de su fila.

   En "Cómo funciona", los cuatro pasos son una lista ordenada (`<ol>`) con Grid de 1, 2 o 4 columnas (`sm:grid-cols-2 lg:grid-cols-4`). Cada paso lleva un borde superior con un color de pegatina distinto (`border-t-8 border-cube-*`). La cabecera de la sección usa Flexbox para separar el título del enlace a la guía completa en escritorio (`md:justify-between`).

   El CTA final y el footer son Flexbox: en móvil van en columna (`flex-col`) y pasan a fila en `lg:` (CTA) y en `md:` (footer), con `justify-between` para repartir el espacio. Los enlaces del footer usan `flex-wrap` para no desbordar en pantallas estrechas.

   No hay posicionamiento absoluto ni márgenes mágicos; la cabecera solo usa `sticky`.

5. **Modo oscuro por clase:** `@custom-variant dark (&:where(.dark, .dark *))` hace que `dark:` dependa de la clase `.dark` en `<html>`, para poder cambiarlo con un botón. En la primera visita se respeta `prefers-color-scheme` del sistema, con oscuro si no hay preferencia. Si el usuario pulsa el botón, su elección se guarda en `localStorage` y tiene prioridad. Un pequeño script en el `<head>` decide el tema antes de pintar, para que no haya parpadeo. El botón expone su estado con `aria-pressed`.

   Medí el contraste de los textos atenuados (WCAG AA, 4,5:1):
   - `ink-400` sobre los fondos oscuros da 6,4–6,9:1.
   - El blanco al 85 % sobre `cube-blue` (4,0:1) y `ink-900` al 80 % sobre `cube-orange` (3,2:1) no llegaban. Ahora son opacos: 4,6:1 y 7,6:1.

   El bloque amarillo del CTA es igual en los dos temas porque lleva su propio texto oscuro, así que su contraste no depende del fondo de la página. El acento cambia de tema a tema (`text-cube-blue` en claro, `dark:text-cube-yellow` en oscuro), porque el amarillo no tiene contraste suficiente sobre fondo claro. Por el mismo motivo, los números de "Cómo funciona" van en oscuro en el tema claro, y el color lo aporta el borde.

6. **Bonus: animaciones registradas como utilidades:** `--animate-fade-up` y `--animate-sticker-pop` se declaran en `@theme` junto a sus `@keyframes`, así que se usan como cualquier clase. Las pegatinas del cubo aparecen escalonadas con `stagger-1` … `stagger-8`. Todas las animaciones van con `motion-safe:`, y el scroll suave dentro de `@media (prefers-reduced-motion: no-preference)`: si el sistema pide reducir el movimiento, la página aparece estática.
