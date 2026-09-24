# Tres en Raya
Misión M1 · El Despertar del DOM — Web Development I.
## Cómo probarlo
Abre index.html en el navegador (o con Live Server). Pulsa cualquier 
casilla de la cuadricula para poner una X o una O depende de quien empiece.
Una vez termine la partida se puede reiniciar con el boton de reiniciar partida.
Además se puede activar el modo oscuro pulsando la tecla "<" del teclado.
Por otro lado si se desea jugar contra la maquina simplemente tienes que seleccionar
la casilla antes de comenzar a jugar, durante la partida estará bloqueada
## Uso de IA
Usé Gemini en la web como pareja de programación, fase a fase.
Ejemplo de prompt real: "Propón 4 o 5 fases pequeñas para construir un
tres en raya en JS puro; no escribas código todavía".
Verifiqué cada cambio jugando una partida completa antes de aceptar la
siguiente fase.
Escribí a mano: El toggle a Modo oscuro, el reinicio de la partida y el bloqueo
de la casilla jugar contra la maquina durante una partida.
## Autopsia
1. Guardo el estado de la partida en variables de JavaScript (el array 
del tablero) en lugar de leer el HTML. Descarté comprobar el texto de 
las casillas visuales en cada turno para saber si había una X o una O, 
porque el HTML solo debe ser un reflejo visual del juego, no el lugar 
donde se guarda la información.

2. El modo oscuro se activa añadiendo una sola clase general que modifica 
las variables de CSS. Descarté usar JavaScript para cambiar el color de 
la pantalla o de cada casilla una por una, porque es mucho más limpio y 
fácil de mantener si separamos totalmente el diseño (CSS) de la lógica (JS).

3. Bloqueo el selector de "Jugar contra la Máquina" en el instante en que 
se hace el primer movimiento de la partida. Descarté permitir que se cambie
el modo a la mitad o forzar un reinicio automático al tocarlo, porque bloquear
los ajustes durante el juego protege el progreso del usuario, evita estados 
inconsistentes y mejora la experiencia de usuario.

4. Genero las casillas del tablero dinámicamente con JavaScript (createElement)
al cargar la página. Descarté escribir los 9 div de forma fija y manual en el HTML,
porque inyectarlos por código demuestra una manipulación real del DOM y hace que 
la arquitectura sea mucho más escalable (por ejemplo, si en el futuro quisiera 
hacer un tablero de 4x4).