// 1. CONFIGURACIÓN Y ESTADO
const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let isGameActive = true;

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
    let roundWon = false;

    for (let i = 0; i < winningConditions.length; i++) {
        const winCondition = winningConditions[i];
        const a = board[winCondition[0]];
        const b = board[winCondition[1]];
        const c = board[winCondition[2]];

        if (a === "" || b === "" || c === "") {
            continue;
        }

        if (a === b && b === c) {
            roundWon = true;
            break;
        }
    }

    if (roundWon) {
        statusDisplay.textContent  = `¡El jugador ${currentPlayer} ha ganado!`;
        isGameActive = false;
        return;
    }

    if (!board.includes("")) {
        statusDisplay.textContent  = "¡Empate!";
        isGameActive = false;
        return;
    }

    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusDisplay.textContent  = `Turno de ${currentPlayer}`;
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
const boardContainer = document.querySelector(".board");

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