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

const boardContainer = document.querySelector(".board");

function initializeBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i; 
        cell.setAttribute("aria-label", "Celda vacía");
        boardContainer.appendChild(cell);
    }
}

initializeBoard();

// 2. REFERENCIAS AL DOM
const cells = document.querySelectorAll(".cell");
const statusDisplay = document.querySelector("#statusDisplay");
const restartBtn = document.querySelector("#restartBtn");
const machineModeToggle = document.querySelector("#machineModeToggle");

// 3. LÓGICA DE CONTROL
function handleCellClick(event) {
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.dataset.index);

    // Bloqueamos clics si la celda está llena, el juego terminó, o la Maquina está procesando
    if (board[cellIndex] !== "" || !isGameActive || isMachineTurn) {
        return;
    }

    executeMove(cellIndex, clickedCell);
}

// Extraemos la mutación del estado para que humano y máquina usen el mismo canal
function executeMove(index, cellElement) {
    board[index] = currentPlayer;
    cellElement.textContent = currentPlayer;
    cellElement.setAttribute("aria-label", `Celda ocupada por ${currentPlayer}`);
    //Bloqueamos la mutacion durante la partida
    machineModeToggle.disabled = true;
    
    checkResult();
}

function makeMachineMove() {
    // Escaneamos celdas disponibles
    const emptyIndices = board
        .map((cell, index) => cell === "" ? index : null)
        .filter(index => index !== null);

    if (emptyIndices.length === 0) return;

    // Elección aleatoria de la Maquina
    const randomIndex = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
    const cellElement = cells[randomIndex];

    executeMove(randomIndex, cellElement);
    
    // Liberamos el bloqueo de la interfaz
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
        if (isVsMachine && currentPlayer === "O") {
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
    
    if (isVsMachine && currentPlayer === "O") {
        statusDisplay.textContent = "Turno de la Máquina";
    } else {
        statusDisplay.textContent = `Turno de ${currentPlayer}`;
    }
    if (isVsMachine && currentPlayer === "O" && isGameActive) {
        isMachineTurn = true; 
        setTimeout(makeMachineMove, 500);
    }
}

// 4. REINICIO DE PARTIDA
function restartGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;
    isMachineThinking = false;
    statusDisplay.textContent = `Turno de ${currentPlayer}`;
    
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