// 1. CONFIGURACIÓN Y ESTADO
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;

const boardContainer = document.querySelector(".board");

function initializeBoard() {
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("div");
        cell.classList.add("cell");
        cell.dataset.index = i; 
        boardContainer.appendChild(cell);
    }
}

initializeBoard();

// 2. REFERENCIAS AL DOM
const cells = document.querySelectorAll(".cell");
const statusDisplay = document.querySelector("#statusDisplay");
const restartBtn = document.querySelector("#restartBtn");

// 3. LÓGICA DE CONTROL
function handleCellClick(event) {
    const clickedCell = event.target;
    const cellIndex = parseInt(clickedCell.getAttribute("data-index"));

    if (board[cellIndex] !== "" || !isGameActive) {
        return;
    }

    board[cellIndex] = currentPlayer;
    clickedCell.textContent  = currentPlayer;

    checkResult();
}

function checkResult() {
    const roundWon = winningConditions.some(condition => {
        const [a, b, c] = condition;
        return board[a] !== "" && board[a] === board[b] && board[a] === board[c];
    });

    if (roundWon) {
        statusDisplay.textContent = `¡El jugador ${currentPlayer} ha ganado!`;
        isGameActive = false;
        // Aquí actualizaremos el marcador (ver paso 3)
        return;
    }

    const roundDraw = board.every(cell => cell !== "");
    
    if (roundDraw) {
        statusDisplay.textContent = "¡Empate!";
        isGameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent = `Turno de ${currentPlayer}`;
}

// 4. REINICIO DE PARTIDA
function restartGame() {
    board = ["", "", "", "", "", "", "", "", ""];
    currentPlayer = "X";
    isGameActive = true;
    statusDisplay.textContent  = `Turno de ${currentPlayer}`;
    
    cells.forEach(cell => {
        cell.textContent  = "";
    });
}

// 5. VINCULACIÓN DE EVENTOS

boardContainer.addEventListener("click", (event) => {
    if (!event.target.classList.contains("cell")) return;
    handleCellClick(event);
});
restartBtn.addEventListener("click", restartGame);

// 6. ATAJOS DE TECLADO (Modo Oscuro)
document.addEventListener("keydown", (event) => {
    if (event.key === "<") {
        document.body.classList.toggle("dark-mode");
    }
});