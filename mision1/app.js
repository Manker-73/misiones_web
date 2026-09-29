"use strict";

// 1. ESTADO Y CONFIGURACIÓN GLOBALES
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;
let isVsMachine = false;
let isMachineTurn = false;
let machineTimeout; 

// 2. REFERENCIAS PRINCIPALES AL DOM
const boardContainer = document.querySelector(".board");
const statusDisplay = document.querySelector("#statusDisplay");
const restartBtn = document.querySelector("#restartBtn");
const machineModeToggle = document.querySelector("#machineModeToggle");

// 3. INICIALIZACIÓN Y UTILIDADES
function initializeBoard() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i; 
        cell.setAttribute("aria-label", "Celda vacía");
        cell.setAttribute("tabindex", "0");
        fragment.appendChild(cell);
    }
    boardContainer.appendChild(fragment);
}

const moveMath = {
    right: (i) => i % 3 !== 2 ? i + 1 : i,
    left:  (i) => i % 3 !== 0 ? i - 1 : i,
    down:  (i) => i < 6 ? i + 3 : i,
    up:    (i) => i > 2 ? i - 3 : i
};

const moveRules = {
    "ArrowRight": moveMath.right, "d": moveMath.right, "D": moveMath.right,
    "ArrowLeft":  moveMath.left,  "a": moveMath.left,  "A": moveMath.left,
    "ArrowDown":  moveMath.down,  "s": moveMath.down,  "S": moveMath.down,
    "ArrowUp":    moveMath.up,    "w": moveMath.up,    "W": moveMath.up
};

initializeBoard();

// Seleccionamos las celdas una vez inyectadas en el DOM
const cells = document.querySelectorAll(".cell");
const isMachineNext = () => isVsMachine && currentPlayer === "O";

// 4. LÓGICA CENTRAL DEL JUEGO
function handleCellClick(event) {
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.dataset.index, 10);

    if (board[cellIndex] !== "" || !isGameActive || isMachineTurn) return;

    executeMove(cellIndex, clickedCell);
}

function executeMove(index, cellElement) {
    board[index] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.setAttribute("aria-label", `Celda ocupada por ${currentPlayer}`);
    machineModeToggle.disabled = true;
    modeLabel.textContent = isVsMachine ? "Jugando contra Máquina" : "Jugando contra Humano";

    checkResult();
}

function makeMachineMove() {
    const emptyIndices = board
        .map((cell, index) => cell === "" ? index : null)
        .filter(index => index !== null);

    if (emptyIndices.length === 0) return;

    let moveIndex = -1;

    const findWinningMove = (player) => {
        for (let i = 0; i < emptyIndices.length; i++) {
            const testIndex = emptyIndices[i];
            board[testIndex] = player; 
            
            const wins = winningConditions.some(condition => {
                const [a, b, c] = condition;
                return board[a] !== "" && board[a] === board[b] && board[a] === board[c];
            });
            
            board[testIndex] = "";
            if (wins) return testIndex;
        }
        return -1; 
    };

    moveIndex = findWinningMove("O");
    if (moveIndex === -1) moveIndex = findWinningMove("X");
    if (moveIndex === -1) moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];

    const cellElement = cells[moveIndex];
    executeMove(moveIndex, cellElement);
    
    isMachineTurn = false;
}

function checkResult() {
    let winningLine = null;

    for (const condition of winningConditions) {
        const [a, b, c] = condition;
        if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
            winningLine = condition;
            break;
        }
    }

    if (winningLine) {
        statusDisplay.textContent = isMachineNext() ? "¡La Máquina ha ganado!" : `¡El jugador ${currentPlayer} ha ganado!`;
        isGameActive = false;
        winningLine.forEach(index => cells[index].classList.add("winning-cell"));
        return;
    }

    if (board.every(cell => cell !== "")) {
        statusDisplay.textContent = "¡Empate!";
        isGameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = isMachineNext() ? "Turno de la Máquina" : `Turno de ${currentPlayer}`;

    if (isMachineNext() && isGameActive) {
        isMachineTurn = true; 
        machineTimeout = setTimeout(makeMachineMove, 500);
    }
}

// 5. REINICIO DE PARTIDA
function restartGame() {
    clearTimeout(machineTimeout); 
    
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;
    isMachineTurn = false;
    statusDisplay.textContent = `Turno de ${currentPlayer}`;
    machineModeToggle.disabled = false;
    modeLabel.textContent = isVsMachine ? "Jugar contra Máquina 🤖" : "Jugar contra Humano 👤";
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("winning-cell");
        cell.setAttribute("aria-label", "Celda vacía");
    });
}

// 6. VINCULACIÓN DE EVENTOS CENTRALIZADA
boardContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("cell")) handleCellClick(event);
});

restartBtn.addEventListener("click", restartGame);

const modeLabel = document.querySelector("#modeLabel"); 

machineModeToggle.addEventListener("change", (event) => {
    isVsMachine = event.target.checked;
    modeLabel.textContent = isVsMachine ? "Jugar contra Máquina 🤖" : "Jugar contra Humano 👤";
});

// Unificación de navegación por teclado y atajo de modo oscuro
document.addEventListener("keydown", (event) => {
    // 6.1. Atajo global para Modo Oscuro
    if (event.key === "<") {
        document.body.classList.toggle("dark-mode");
        return; // Evita evaluar el resto de reglas si se activa el modo oscuro
    }

    // 6.2. Navegación del Tablero
    const focusedElement = document.activeElement;
    const isCellFocused = focusedElement.classList.contains("cell");
    const isBodyFocused = focusedElement === document.body;

    // Solo robamos el foco si el usuario está en el fondo de la página
    if (moveRules[event.key] && isBodyFocused) {
        event.preventDefault();
        cells[0].focus();
        return;
    }

    // Si está en un botón o checkbox, ignoramos el atajo para no interferir
    if (!isCellFocused) return;

    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        handleCellClick({ target: focusedElement });
        return;
    }

    if (moveRules[event.key]) {
        event.preventDefault();
        const currentIndex = parseInt(focusedElement.dataset.index, 10);
        const nextIndex = moveRules[event.key](currentIndex); 
        
        if (nextIndex !== currentIndex) cells[nextIndex].focus();
    }
});