"use strict";

// 1. CONFIGURACIÓN Y ESTADO
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
let machineTimeout; // Variable para controlar la asincronía

// 2. REFERENCIAS AL DOM
const boardContainer = document.querySelector(".board");
const statusDisplay = document.querySelector("#statusDisplay");
const restartBtn = document.querySelector("#restartBtn");
const machineModeToggle = document.querySelector("#machineModeToggle");

// Optimización: Uso de DocumentFragment para minimizar reflows
function initializeBoard() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i; 
        cell.setAttribute("aria-label", "Celda vacía");
        fragment.appendChild(cell);
    }
    boardContainer.appendChild(fragment);
}

initializeBoard();

// Seleccionamos las celdas después de haberlas inyectado en el DOM
const cells = document.querySelectorAll(".cell");

// Función auxiliar para evitar código duplicado
const isMachineNext = () => isVsMachine && currentPlayer === "O";

// 3. LÓGICA DE CONTROL
function handleCellClick(event) {
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.dataset.index);

    if (board[cellIndex] !== "" || !isGameActive || isMachineTurn) {
        return;
    }

    executeMove(cellIndex, clickedCell);
}

function executeMove(index, cellElement) {
    board[index] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.setAttribute("aria-label", `Celda ocupada por ${currentPlayer}`);
    
    // Bloqueamos la posibilidad de cambiar de modo a mitad de partida
    machineModeToggle.disabled = true;
    
    checkResult();
}

function makeMachineMove() {
    const emptyIndices = board
        .map((cell, index) => cell === "" ? index : null)
        .filter(index => index !== null);

    if (emptyIndices.length === 0) return;

    let moveIndex = -1;

    // Función interna para simular y detectar movimientos ganadores
    const findWinningMove = (player) => {
        for (let i = 0; i < emptyIndices.length; i++) {
            const testIndex = emptyIndices[i];
            board[testIndex] = player; // Simulamos jugada
            
            const wins = winningConditions.some(condition => {
                const [a, b, c] = condition;
                return board[a] !== "" && board[a] === board[b] && board[a] === board[c];
            });
            
            board[testIndex] = "";
            if (wins) return testIndex;
        }
        return -1; // No hay jugada ganadora
    };

    // 1. Intentar ganar la partida en este turno
    moveIndex = findWinningMove("O");

    // 2. Si no podemos ganar, intentar bloquear la victoria de "X"
    if (moveIndex === -1) {
        moveIndex = findWinningMove("X");
    }

    // 3. Si no hay peligro ni victoria inminente, elegir una casilla libre al azar
    if (moveIndex === -1) {
        moveIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    }

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
        if (isMachineNext()) {
            statusDisplay.textContent = "¡La Máquina ha ganado!";
        } else {
            statusDisplay.textContent = `¡El jugador ${currentPlayer} ha ganado!`;
        }
        
        isGameActive = false;
        
        winningLine.forEach(index => {
            cells[index].classList.add("winning-cell");
        });
        return;
    }

    const roundDraw = board.every(cell => cell !== "");
    
    if (roundDraw) {
        statusDisplay.textContent = "¡Empate!";
        isGameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    
    if (isMachineNext()) {
        statusDisplay.textContent = "Turno de la Máquina";
    } else {
        statusDisplay.textContent = `Turno de ${currentPlayer}`;
    }

    if (isMachineNext() && isGameActive) {
        isMachineTurn = true; 
        machineTimeout = setTimeout(makeMachineMove, 500);
    }
}

// 4. REINICIO DE PARTIDA
function restartGame() {
    clearTimeout(machineTimeout); 
    
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;
    isMachineTurn = false;
    statusDisplay.textContent = `Turno de ${currentPlayer}`;
    
    // Desbloqueamos el selector para permitir cambiar el modo
    machineModeToggle.disabled = false;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.classList.remove("winning-cell");
        cell.setAttribute("aria-label", "Celda vacía");
    });
}

// 5. VINCULACIÓN DE EVENTOS
boardContainer.addEventListener("click", (event) => {
    if (!event.target.classList.contains("cell")) return;
    handleCellClick(event);
});

restartBtn.addEventListener("click", restartGame);

machineModeToggle.addEventListener("change", (event) => {
    isVsMachine = event.target.checked;
});

// 6. ATAJOS DE TECLADO (Modo Oscuro)
document.addEventListener("keydown", (event) => {
    if (event.key === "<") {
        document.body.classList.toggle("dark-mode");
    }
});