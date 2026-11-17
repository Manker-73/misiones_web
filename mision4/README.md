# Open de Speedcubing · Inscripciones (mision4)
Misión M4 · Formularios y peticiones HTTP en React: React Hook Form + Zod para la inscripción y TanStack Query v5 para el listado de participantes.

## Cómo probarlo
1. Abre una terminal en la carpeta raíz del proyecto.
2. Ejecuta `npm install` para instalar las dependencias (React 19, Vite, React Hook Form, Zod 4, TanStack Query v5 y json-server).
3. Copia `.env.example` a `.env`. Contiene `VITE_API_URL=http://localhost:3001`, la URL base del API (no se escribe a mano en el código).
4. Ejecuta `npm run api` para levantar la API falsa con **json-server** en `http://localhost:3001`. Los datos se guardan en `db.json`.
5. En otra terminal, ejecuta `npm run dev` y abre la URL que aparece en el navegador.
6. Rellena el formulario de inscripción: nombre, email, **fecha de nacimiento en tres campos** (día, mes y año), si es tu primera competición WCA, tu **WCA ID** (formato `2019GARC01`), entre 1 y 5 **modalidades oficiales** (`2x2x2`, `3x3x3`, `4x4x4`, `5x5x5`, `3x3x3 a una mano`, `3x3x3 a ciegas`, `Pyraminx`, `Skewb`, `Square-1` o `Megaminx`), tu media de 3x3x3 (opcional, solo si compites en 3x3x3) y la aceptación del reglamento. Pulsa **"Inscribirme"**.
7. Debajo del formulario verás la **lista de participantes**, cargada desde el API con TanStack Query. Si apagas `npm run api` y recargas, aparece un aviso de error con un botón **"Reintentar"**.
8. Prueba a enviarlo vacío o con datos incorrectos (por ejemplo, el **29 de febrero de 1900**, o marcar "primera competición" junto con "3x3x3 a ciegas") para ver los mensajes de validación. También puedes recorrer el formulario entero **solo con el teclado**.

## Uso de IA
Usé Claude como pareja de programación: para planificar el proyecto a partir del enunciado y del temario de la Unidad 4, y para generar una primera versión del esquema Zod y del formulario, que después probé y fui corrigiendo.
Ejemplos de prompts reales:
- "Hay un pequeño fallo en el formulario: puedes poner que naciste en el año 0001. Pondría un rango de edad entre 6 y 100 años, por ejemplo."
- "En el calendario, cuando vas moviéndote con la rueda del ratón avanzas o retrocedes meses, pero siempre pone el mes y el año en el que estabas cuando entraste." (Tras ver las alternativas, elegí sustituir el `<input type="date">` nativo por tres campos: día, mes y año.)
- "Al poner la fecha 29-02-1900 el error que sale es que esa fecha no existe, pero quiero que aparezca además el error de los 100 años."

Iteré y validé manualmente: elegí el dominio del torneo y las reglas de negocio, probé los casos límite de la fecha (años fuera de rango, días inexistentes, años bisiestos) y revisé que cada error apareciese en su campo y que el formulario se pudiera completar solo con el teclado.

## Autopsia
1. **El esquema Zod como única fuente de verdad:** Toda la validación vive en `src/schemas/inscripcion.js`, conectado al formulario con `zodResolver`. Ningún componente tiene reglas sueltas. Todos los mensajes van en español con la sintaxis de Zod 4 (`{ error: "..." }`, `z.email()`), y el mismo archivo exporta las modalidades (`EVENTOS`), los meses, los límites de edad y los `defaultValues`, así la interfaz tampoco duplica datos.

2. **Refinamientos cruzados con reglas de negocio reales:** Si ya has competido, el WCA ID es obligatorio. Si es tu primera competición, no puedes tener WCA ID ni inscribirte en modalidades a ciegas. La media de 3x3x3 solo se acepta si te inscribes en 3x3x3. Para el reglamento se usa `z.boolean().refine(...)` en lugar de `z.literal(true)`: un literal que falla corta la validación y se saltaría los `.refine` del objeto, de modo que el usuario no vería todos los errores a la vez.

3. **Fecha de nacimiento en tres campos validada con `superRefine` y `transform`:** El selector de fecha nativo es incómodo para fechas lejanas, así que la fecha se pide como día, mes (`<select>`) y año. El `superRefine` asigna cada error al subcampo responsable, para que RHF lleve el foco justo ahí. Detecta fechas inexistentes (31 de febrero, 29 de febrero en años no bisiestos), fechas futuras y edades fuera del rango de 6 a 100 años, y puede mostrar dos errores a la vez (día inexistente + año fuera de rango). Usa `setFullYear` porque `new Date(50, …)` interpretaría el año 50 como 1950. Si todo es correcto, `transform` convierte los tres campos en una fecha ISO (`2007-03-27`) lista para el API.

4. **React Hook Form con UX cuidada:** Campos no controlados con `register` y `handleSubmit`, y `noValidate` para que mande Zod y no el navegador. El botón solo se deshabilita durante el envío (`isSubmitting`), nunca "hasta que sea válido". Los campos condicionales (WCA ID y media de 3x3x3) aparecen o se vacían según otros campos. Además, `deps` revalida las reglas cruzadas al momento: al cambiar el mes desaparece el error "febrero no tiene 31 días" sin tener que reenviar.

5. **Accesibilidad:** Cada campo tiene su `<label htmlFor>` (el placeholder es solo una pista), y los grupos (fecha y modalidades) van en `<fieldset>` con `<legend>`. Cada campo lleva `aria-invalid` y `aria-describedby` alimentados desde `formState.errors`, que lo enlazan con su pista y su error. Los errores tienen `role="alert"` (componente `MensajeError`) y el éxito se anuncia en una región `role="status"` que siempre está en el DOM. Al enviar con errores, el foco va al primer campo inválido (`shouldFocusError`). También hay `autoComplete` donde aplica y un `:focus-visible` bien marcado, y los errores no se indican solo con color.

6. **Capa de servicios separada y claves de query centralizadas:** Ningún componente llama a `fetch`. Todo lo que sabe de HTTP vive en `src/services/inscripciones.js`, con la URL base leída de `VITE_API_URL`. Su función `peticion` comprueba `response.ok` (porque `fetch` no rechaza con 4xx/5xx) y convierte tanto los fallos de red como los códigos de error en mensajes útiles para el usuario. Los componentes solo usan el hook `useInscripciones` (`src/hooks/useInscripciones.js`), que define las claves en un único objeto (`clavesInscripciones.todas` / `.lista()`) para que la lista y la futura invalidación compartan exactamente la misma clave.

7. **Listado con `useQuery` y todos sus estados comunicados:** `isPending` muestra "Cargando participantes…" con `role="status"`. `isError` muestra el mensaje del servicio con `role="alert"` y un botón **"Reintentar"** (`refetch`). Hay un estado vacío propio, y `isFetching` avisa de "Actualizando…" cuando hay datos en pantalla pero se están refrescando por detrás. La ordenación (más recientes primero) se hace con la opción `select`, sin modificar la caché. En el `QueryClient` bajé `retry` a 1: con la API apagada, los 3 reintentos por defecto dejaban unos 7 segundos en "Cargando…" sin aportar nada. Las `ReactQueryDevtools` permiten ver la caché en vivo durante el desarrollo.
