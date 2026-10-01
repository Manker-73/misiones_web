"use strict";

// 1. ESTADO Y CONFIGURACIÓN GLOBALES
const CONFIG = {
    secretKey: "<",
    texts: {
        modeIdle1P: "Modo: 1 Jugador",
        modeIdle2P: "Modo: 2 Jugadores",
        modePlaying1P: "Jugando: 1 Jugador",
        modePlaying2P: "Jugando: 2 Jugadores",
        winMachine: "¡La Máquina ha ganado!",
        winPlayer: (player) => `¡El jugador ${player} ha ganado!`,
        draw: "¡Empate!",
        turnMachine: "Turno de la Máquina",
        turnPlayer: (player) => `Turno de ${player}`,
        ariaEmpty: "Celda vacía",
        ariaOccupied: (player) => `Celda ocupada por ${player}`
    }
};

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
const modeToggleBtn = document.querySelector("#modeToggleBtn");

// 3. INICIALIZACIÓN Y UTILIDADES
function initializeBoard() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i; 
        cell.setAttribute("aria-label", CONFIG.texts.ariaEmpty);
        cell.setAttribute("tabindex", "0");
        fragment.appendChild(cell);
    }
    boardContainer.appendChild(fragment);
}

initializeBoard();

const cells = document.querySelectorAll(".cell");
const isMachineNext = () => isVsMachine && currentPlayer === "O";

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

// 4. LÓGICA CENTRAL DEL JUEGO
function processCell(cellElement) {

    if (!cellElement || !cellElement.classList.contains("cell") || cellElement.dataset.index === undefined) {
        return;
    }
    
    const cellIndex = parseInt(cellElement.dataset.index, 10);

    if (board[cellIndex] !== "" || !isGameActive || isMachineTurn) return;

    executeMove(cellIndex, cellElement);
}

function executeMove(index, cellElement) {
    board[index] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.setAttribute("aria-label", CONFIG.texts.ariaOccupied(currentPlayer));
    
    modeToggleBtn.disabled = true;
    modeToggleBtn.textContent = isVsMachine ? CONFIG.texts.modePlaying1P : CONFIG.texts.modePlaying2P;
    
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
    const winningLine = winningConditions.find(condition => {
        const [a, b, c] = condition;
        return board[a] !== "" && board[a] === board[b] && board[a] === board[c];
    });

    if (winningLine) {
        statusDisplay.textContent = isMachineNext() ? CONFIG.texts.winMachine : CONFIG.texts.winPlayer(currentPlayer);
        isGameActive = false;
        winningLine.forEach(index => cells[index].classList.add("winning-cell"));
        return;
    }

    if (board.every(cell => cell !== "")) {
        statusDisplay.textContent = CONFIG.texts.draw;
        isGameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = isMachineNext() ? CONFIG.texts.turnMachine : CONFIG.texts.turnPlayer(currentPlayer);

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
    statusDisplay.textContent = CONFIG.texts.turnPlayer(currentPlayer);
    
    modeToggleBtn.disabled = false;
    modeToggleBtn.textContent = isVsMachine ? CONFIG.texts.modeIdle1P : CONFIG.texts.modeIdle2P;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("winning-cell");
        cell.setAttribute("aria-label", CONFIG.texts.ariaEmpty);
    });
}

// 6. VINCULACIÓN DE EVENTOS CENTRALIZADA
boardContainer.addEventListener("click", (event) => {
    if (event.target.classList.contains("cell")) {
        processCell(event.target);
    }
});

restartBtn.addEventListener("click", restartGame);

modeToggleBtn.addEventListener("click", () => {
    isVsMachine = !isVsMachine;
    modeToggleBtn.textContent = isVsMachine ? CONFIG.texts.modeIdle1P : CONFIG.texts.modeIdle2P;
});

document.addEventListener("keydown", (event) => {
    if (event.key === CONFIG.secretKey) {
        document.body.classList.toggle("dark-mode");
        return; 
    }

    const focusedElement = document.activeElement;
    const isCellFocused = focusedElement.classList.contains("cell");
    const isBodyFocused = focusedElement === document.body;

    if (moveRules[event.key] && isBodyFocused) {
        event.preventDefault();
        cells[0].focus();
        return;
    }

    if (!isCellFocused) return;

    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        processCell(focusedElement);
        return;
    }

    if (moveRules[event.key]) {
        event.preventDefault();
        const currentIndex = parseInt(focusedElement.dataset.index, 10);
        const nextIndex = moveRules[event.key](currentIndex); 
        
        if (nextIndex !== currentIndex) cells[nextIndex].focus();
    }
});