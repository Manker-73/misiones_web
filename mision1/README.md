# Tres en Raya
Misión M1 · El Despertar del DOM — Web Development I.
## Cómo probarlo
Abre index.html en el navegador (o con Live Server). Pulsa cualquier 
casilla de la cuadricula para poner una X o una O depende de quien empiece.
Una vez termine la partida se puede reiniciar con el boton de reiniciar partida.
Además se puede activar el modo oscuro pulsando la tecla "<" del teclado.
## Uso de IA
Usé Gemini en la web como pareja de programación, fase a fase.
Ejemplo de prompt real: "Propón 4 o 5 fases pequeñas para construir un
tres en raya en JS puro; no escribas código todavía".
Verifiqué cada cambio jugando una partida completa antes de aceptar la
siguiente fase.
Escribí a mano: El toggle a Modo oscuro y el reinicio de la partida.
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