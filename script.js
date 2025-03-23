// Game Variables
let gameMode = '';  // 'computer' or 'friend'
let gameLevel = ''; // 'easy', 'medium', or 'hard'
let playerCoin = ''; // 'blue' or 'red'
let opponentCoin = '';
let currentPlayer = 'player'; // 'player' or 'opponent'
let placementPhase = true;
let placedCoins = {
    player: [],
    opponent: []
};
let selectedCoinIndex = -1;

// Board setup
const boardSize = 3;
const board = [];

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    level: document.getElementById('level-screen'),
    coin: document.getElementById('coin-screen'),
    game: document.getElementById('game-screen'),
    result: document.getElementById('result-screen')
};

// Initialize the board
function initializeBoard() {
    const boardElement = document.getElementById('board');
    boardElement.innerHTML = '';
    
    // Create a 3x3 grid
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = null;
            
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = i;
            cell.dataset.col = j;
            
            cell.addEventListener('click', () => handleCellClick(i, j));
            
            boardElement.appendChild(cell);
        }
    }
}

// Show a specific screen and hide others
function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active-screen');
    });
    screens[screenId].classList.add('active-screen');
}

// Event Listeners
document.getElementById('vs-computer').addEventListener('click', () => {
    gameMode = 'computer';
    showScreen('level');
});

document.getElementById('vs-friend').addEventListener('click', () => {
    gameMode = 'friend';
    showScreen('coin');
});

document.querySelectorAll('.level-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        gameLevel = e.target.dataset.level;
        showScreen('coin');
    });
});

document.querySelectorAll('.coin-option').forEach(coin => {
    coin.addEventListener('click', (e) => {
        playerCoin = e.currentTarget.dataset.coin;
        opponentCoin = playerCoin === 'blue' ? 'red' : 'blue';
        initializeBoard();
        showScreen('game');
        updateGameStatus();
    });
});

document.getElementById('try-again').addEventListener('click', () => {
    resetGame();
    showScreen('start');
});

// Control buttons for moving coins
document.getElementById('up').addEventListener('click', () => moveCoin('up'));
document.getElementById('down').addEventListener('click', () => moveCoin('down'));
document.getElementById('left').addEventListener('click', () => moveCoin('left'));
document.getElementById('right').addEventListener('click', () => moveCoin('right'));

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (screens.game.classList.contains('active-screen')) {
        if (e.key === 'ArrowUp') moveCoin('up');
        if (e.key === 'ArrowDown') moveCoin('down');
        if (e.key === 'ArrowLeft') moveCoin('left');
        if (e.key === 'ArrowRight') moveCoin('right');
    }
});

// Handle cell click
function handleCellClick(row, col) {
    if (!placementPhase) {
        // In movement phase, clicking a cell with player's coin selects it
        if (board[row][col] === currentPlayer) {
            const coinIndex = placedCoins[currentPlayer].findIndex(
                coin => coin.row === row && coin.col === col
            );
            if (coinIndex !== -1) {
                selectCoin(coinIndex);
            }
        }
        return;
    }
    
    // Check if the cell is already occupied
    if (board[row][col] !== null) return;
    
    if (currentPlayer === 'player') {
        // Place player's coin
        placeCoin(row, col, 'player');
        
        // Check if player has placed all 3 coins
        if (placedCoins.player.length === 3) {
            if (placedCoins.opponent.length === 3) {
                // Both players have placed all coins, move to movement phase
                placementPhase = false;
                updateGameStatus();
            } else {
                // Switch to opponent's turn
                currentPlayer = 'opponent';
                updateGameStatus();
                
                if (gameMode === 'computer') {
                    // Computer's turn
                    setTimeout(computerPlaceCoin, 800);
                }
            }
        } else {
            // Switch to opponent's turn
            currentPlayer = 'opponent';
            updateGameStatus();
            
            if (gameMode === 'computer') {
                // Computer's turn
                setTimeout(computerPlaceCoin, 800);
            }
        }
    } else {
        // It's opponent's turn in 2-player mode
        if (gameMode === 'friend') {
            // Place opponent's coin
            placeCoin(row, col, 'opponent');
            
            // Check if opponent has placed all 3 coins
            if (placedCoins.opponent.length === 3) {
                if (placedCoins.player.length === 3) {
                    // Both players have placed all coins, move to movement phase
                    placementPhase = false;
                    currentPlayer = 'player'; // Player goes first in movement phase
                    updateGameStatus();
                } else {
                    // Switch to player's turn
                    currentPlayer = 'player';
                    updateGameStatus();
                }
            } else {
                // Switch to player's turn
                currentPlayer = 'player';
                updateGameStatus();
            }
        }
    }
}

// Place a coin on the board
function placeCoin(row, col, player) {
    board[row][col] = player;
    placedCoins[player].push({row, col});
    renderBoard();
}

// Computer places a coin
function computerPlaceCoin() {
    if (currentPlayer !== 'opponent' || gameMode !== 'computer') return;
    
    let row, col;
    
    if (gameLevel === 'easy') {
        // Easy level - more strategic than before
        // 50% chance to make a strategic move, 50% random
        if (Math.random() < 0.5) {
            // Try to place in a position that could lead to a win
            const emptyCells = [];
            let blockingMove = null;
            
            // First, check if player is about to win (has 2 in a row with an empty cell)
            for (let i = 0; i < boardSize; i++) {
                for (let j = 0; j < boardSize; j++) {
                    if (board[i][j] === null) {
                        // Check if player would win by placing here
                        if (wouldBlockWin(i, j)) {
                            blockingMove = {row: i, col: j};
                            break;
                        }
                        emptyCells.push({row: i, col: j});
                    }
                }
                if (blockingMove) break;
            }
            
            // If player is about to win, block them
            if (blockingMove) {
                row = blockingMove.row;
                col = blockingMove.col;
            } else {
                // Otherwise use the original strategic preference for center/corners
                const strategicCells = emptyCells.filter(cell => 
                    (cell.row === 1 && cell.col === 1) || // center
                    (cell.row === 0 && cell.col === 0) || // corners
                    (cell.row === 0 && cell.col === 2) || 
                    (cell.row === 2 && cell.col === 0) || 
                    (cell.row === 2 && cell.col === 2)
                );
                
                if (strategicCells.length > 0) {
                    const cell = strategicCells[Math.floor(Math.random() * strategicCells.length)];
                    row = cell.row;
                    col = cell.col;
                } else {
                    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                    row = cell.row;
                    col = cell.col;
                }
            }
        } else {
            // Random placement
            do {
                row = Math.floor(Math.random() * boardSize);
                col = Math.floor(Math.random() * boardSize);
            } while (board[row][col] !== null);
        }
    }else if (gameLevel === 'medium') {
        // Medium level - improved strategy
        // 70% strategic, 30% random
        if (Math.random() < 0.7) {
            // Try to place strategically
            let bestMove = null;
            let bestScore = -Infinity;
            
            for (let i = 0; i < boardSize; i++) {
                for (let j = 0; j < boardSize; j++) {
                    if (board[i][j] === null) {
                        // Score this position
                        let score = 0;
                        
                        // Check if this would form a winning line
                        if (wouldFormLine(i, j, 'opponent')) {
                            score += 50; // Prioritize winning
                        }
                        
                        // Check if placing here blocks player from winning
                        if (wouldBlockWin(i, j)) {
                            score += 30; // Block player wins
                        }
                        
                        // Prefer center
                        if (i === 1 && j === 1) {
                            score += 15;
                        }
                        // Then corners
                        else if ((i === 0 && j === 0) || (i === 0 && j === 2) || 
                                (i === 2 && j === 0) || (i === 2 && j === 2)) {
                            score += 10;
                        }
                        
                        // Avoid creating lines with existing opponent coins
                        if (checkSameLineOrColumn(i, j, 'opponent')) {
                            score -= 20; // Discourage forming lines too early
                        }
                        
                        // Update best move
                        if (score > bestScore) {
                            bestScore = score;
                            bestMove = {row: i, col: j};
                        }
                    }
                }
            }
            
            if (bestMove) {
                row = bestMove.row;
                col = bestMove.col;
            } else {
                // Random fallback
                do {
                    row = Math.floor(Math.random() * boardSize);
                    col = Math.floor(Math.random() * boardSize);
                } while (board[row][col] !== null);
            }
        } else {
            // Random placement
            do {
                row = Math.floor(Math.random() * boardSize);
                col = Math.floor(Math.random() * boardSize);
            } while (board[row][col] !== null);
        }
    } else if (gameLevel === 'hard') {
        // Hard level - smarter strategy
        // If computer can win by placing a coin, do that
        // Otherwise, block player if they're about to win
        // Otherwise, place strategically
        
        // Check all empty cells
        let bestMove = null;
        let bestScore = -Infinity;
        
        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                if (board[i][j] === null) {
                    // Score this move
                    let score = 0;
                    
                    // Check if this would form a winning line for computer
                    if (wouldFormLine(i, j, 'opponent')) {
                        score += 100;
                    }
                    
                    // Check if this would block player from winning
                    if (wouldBlockWin(i, j)) {
                        score += 50;
                    }
                    
                    // Prefer center and corners
                    if ((i === 1 && j === 1) || 
                        (i === 0 && j === 0) || 
                        (i === 0 && j === 2) || 
                        (i === 2 && j === 0) || 
                        (i === 2 && j === 2)) {
                        score += 10;
                    }
                    
                    // Update best move if this is better
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = {row: i, col: j};
                    }
                }
            }
        }
        
        // If we found a move, use it; otherwise choose randomly
        if (bestMove) {
            row = bestMove.row;
            col = bestMove.col;
        } else {
            // Random placement as fallback
            do {
                row = Math.floor(Math.random() * boardSize);
                col = Math.floor(Math.random() * boardSize);
            } while (board[row][col] !== null);
        }
    } else {
        // Fallback to random placement
        do {
            row = Math.floor(Math.random() * boardSize);
            col = Math.floor(Math.random() * boardSize);
        } while (board[row][col] !== null);
    }
    
    // Place computer's coin
    placeCoin(row, col, 'opponent');
    
    // Check if computer has placed all 3 coins
    if (placedCoins.opponent.length === 3) {
        if (placedCoins.player.length === 3) {
            // Both players have placed all coins, move to movement phase
            placementPhase = false;
            currentPlayer = 'player'; // Player goes first in movement phase
            updateGameStatus();
        } else {
            // Switch to player's turn
            currentPlayer = 'player';
            updateGameStatus();
        }
    } else {
        // Switch to player's turn
        currentPlayer = 'player';
        updateGameStatus();
    }
}

// Check if placing at (row, col) would form a line for the given player
function wouldFormLine(row, col, player) {
    // Create a temporary copy of placedCoins
    const tempCoins = [...placedCoins[player], {row, col}];
    
    // Check if any 3 coins form a line
    return checkForWinWithCoins(tempCoins);
}

// Check if placing at (row, col) would block the opponent from winning
function wouldBlockWin(row, col) {
    const opponent = currentPlayer === 'player' ? 'opponent' : 'player';
    return wouldFormLine(row, col, opponent);
}

// Check if coins are in the same line (row or column)
function checkSameLineOrColumn(row, col, player) {
    const coins = [...placedCoins[player], {row, col}];
    
    // Check rows
    for (let r = 0; r < boardSize; r++) {
        const inRow = coins.filter(coin => coin.row === r);
        if (inRow.length === 3) return true;
    }
    
    // Check columns
    for (let c = 0; c < boardSize; c++) {
        const inCol = coins.filter(coin => coin.col === c);
        if (inCol.length === 3) return true;
    }
    
    return false;
}

// Select a coin to move
function selectCoin(index) {
    selectedCoinIndex = index;
    renderBoard();
    updateGameStatus();
}

// Move the selected coin
function moveCoin(direction) {
    if (placementPhase) return; // Only allow movement after placement phase
    
    const coins = placedCoins[currentPlayer];
    if (selectedCoinIndex === -1) {
        // No coin selected, select the first one
        selectCoin(0);
        return;
    }
    
    const coin = coins[selectedCoinIndex];
    let newRow = coin.row;
    let newCol = coin.col;
    
    switch (direction) {
        case 'up':
            newRow = Math.max(0, coin.row - 1);
            break;
        case 'down':
            newRow = Math.min(boardSize - 1, coin.row + 1);
            break;
        case 'left':
            newCol = Math.max(0, coin.col - 1);
            break;
        case 'right':
            newCol = Math.min(boardSize - 1, coin.col + 1);
            break;
    }
    
    // Check if the new position is valid
    if (board[newRow][newCol] !== null) {
        // Cell is occupied
        return;
    }
    
    // Move the coin
    board[coin.row][coin.col] = null;
    board[newRow][newCol] = currentPlayer;
    coins[selectedCoinIndex] = {row: newRow, col: newCol};
    
    // Check for win
    if (checkForWin(currentPlayer)) {
        endGame(currentPlayer);
        return;
    }
    
    // Switch turn
    currentPlayer = currentPlayer === 'player' ? 'opponent' : 'player';
    selectedCoinIndex = -1;
    renderBoard();
    updateGameStatus();
    
    // If it's computer's turn, make a move
    if (currentPlayer === 'opponent' && gameMode === 'computer') {
        setTimeout(computerMove, 1000);
    }
}

// Computer makes a move
function computerMove() {
    if (currentPlayer !== 'opponent' || gameMode !== 'computer') return;
    
    const coins = placedCoins.opponent;
    let moveFound = false;
    
    // Strategy based on difficulty
    if (gameLevel === 'hard') {
        // Check if any move would result in a win
        for (let i = 0; i < coins.length; i++) {
            const coin = coins[i];
            
            // Try all four directions
            const directions = ['up', 'down', 'left', 'right'];
            for (const direction of directions) {
                let newRow = coin.row;
                let newCol = coin.col;
                
                switch (direction) {
                    case 'up': newRow = Math.max(0, coin.row - 1); break;
                    case 'down': newRow = Math.min(boardSize - 1, coin.row + 1); break;
                    case 'left': newCol = Math.max(0, coin.col - 1); break;
                    case 'right': newCol = Math.min(boardSize - 1, coin.col + 1); break;
                }
                
                // Check if the move is valid and would result in a win
                if (board[newRow][newCol] === null) {
                    // Temporarily make the move
                    const originalRow = coin.row;
                    const originalCol = coin.col;
                    board[originalRow][originalCol] = null;
                    board[newRow][newCol] = 'opponent';
                    coins[i] = {row: newRow, col: newCol};
                    
                    // Check for win
                    const isWin = checkForWin('opponent');
                    
                    // Undo the move
                    board[newRow][newCol] = null;
                    board[originalRow][originalCol] = 'opponent';
                    coins[i] = {row: originalRow, col: originalCol};
                    
                    if (isWin) {
                        // Make the winning move
                        selectCoin(i);
                        setTimeout(() => {
                            moveCoin(direction);
                        }, 500);
                        moveFound = true;
                        break;
                    }
                }
            }
            
            if (moveFound) break;
        }
    }
    
    // If no winning move was found, make a random or strategic move
    if (!moveFound) {
        // Select a random coin to move
        const coinIndex = Math.floor(Math.random() * coins.length);
        selectCoin(coinIndex);
        
        setTimeout(() => {
            // Choose a random valid direction
            const coin = coins[coinIndex];
            const validDirections = [];
            
            if (coin.row > 0 && board[coin.row - 1][coin.col] === null) validDirections.push('up');
            if (coin.row < boardSize - 1 && board[coin.row + 1][coin.col] === null) validDirections.push('down');
            if (coin.col > 0 && board[coin.row][coin.col - 1] === null) validDirections.push('left');
            if (coin.col < boardSize - 1 && board[coin.row][coin.col + 1] === null) validDirections.push('right');
            
            if (validDirections.length > 0) {
                const direction = validDirections[Math.floor(Math.random() * validDirections.length)];
                moveCoin(direction);
            } else {
                // No valid move, try another coin
                computerMove();
            }
        }, 500);
    }
}

// Check if a player has won
function checkForWin(player) {
    return checkForWinWithCoins(placedCoins[player]);
}

// Check if a set of coins forms a winning line
function checkForWinWithCoins(coins) {
    if (coins.length < 3) return false;
    
    // Check rows
    for (let r = 0; r < boardSize; r++) {
        const inRow = coins.filter(coin => coin.row === r);
        if (inRow.length === 3) return true;
    }
    
    // Check columns
    for (let c = 0; c < boardSize; c++) {
        const inCol = coins.filter(coin => coin.col === c);
        if (inCol.length === 3) return true;
    }
    
    return false;
}

// End the game with a winner
function endGame(winner) {
    const resultMessage = document.getElementById('result-message');
    const resultCoin = document.getElementById('result-coin');
    
    if (winner === 'player') {
        resultMessage.textContent = "You Won!";
        resultCoin.className = 'result-coin coin-' + playerCoin;
    } else {
        resultMessage.textContent = gameMode === 'computer' ? "Computer Won!" : "Player 2 Won!";
        resultCoin.className = 'result-coin coin-' + opponentCoin;
    }
    
    showScreen('result');
}

// Update the game status text
// This completes the updateGameStatus function that was cut off
function updateGameStatus() {
const statusElement = document.getElementById('game-status');

if (placementPhase) {
if (currentPlayer === 'player') {
    statusElement.textContent = `Your turn: Place your coin (${placedCoins.player.length + 1}/3)`;
} else {
    statusElement.textContent = gameMode === 'computer' ? 
        `Computer's turn: Placing coin (${placedCoins.opponent.length + 1}/3)` : 
        `Player 2's turn: Place your coin (${placedCoins.opponent.length + 1}/3)`;
}
} else {
// Movement phase
if (currentPlayer === 'player') {
    if (selectedCoinIndex === -1) {
        statusElement.textContent = "Your turn: Select a coin to move";
    } else {
        statusElement.textContent = "Your turn: Move your selected coin";
    }
} else {
    statusElement.textContent = gameMode === 'computer' ? 
        "Computer's turn: Moving coin" : 
        selectedCoinIndex === -1 ? 
            "Player 2's turn: Select a coin to move" : 
            "Player 2's turn: Move your selected coin";
}
}
}

// Render the board based on current state
function renderBoard() {
const cells = document.querySelectorAll('.cell');

// Clear all cells
cells.forEach(cell => {
cell.innerHTML = '';
});

// Render coins
for (let i = 0; i < boardSize; i++) {
for (let j = 0; j < boardSize; j++) {
    if (board[i][j] !== null) {
        const cellIndex = i * boardSize + j;
        const cell = cells[cellIndex];
        
        const coin = document.createElement('div');
        coin.className = 'coin coin-' + (board[i][j] === 'player' ? playerCoin : opponentCoin);
        
        // Add star to the coin
        const star = document.createElement('div');
        star.className = 'star';
        star.textContent = '★';
        coin.appendChild(star);
        
        // Highlight selected coin
        if (!placementPhase && 
            board[i][j] === currentPlayer && 
            placedCoins[currentPlayer][selectedCoinIndex] && 
            placedCoins[currentPlayer][selectedCoinIndex].row === i && 
            placedCoins[currentPlayer][selectedCoinIndex].col === j) {
            coin.classList.add('selected');
        }
        
        cell.appendChild(coin);
    }
}
}
}

// Reset the game to initial state
function resetGame() {
gameMode = '';
gameLevel = '';
playerCoin = '';
opponentCoin = '';
currentPlayer = 'player';
placementPhase = true;
placedCoins = {
player: [],
opponent: []
};
selectedCoinIndex = -1;

// Clear the board
for (let i = 0; i < boardSize; i++) {
board[i] = [];
for (let j = 0; j < boardSize; j++) {
    board[i][j] = null;
}
}
}

// Initialize the game
window.addEventListener('DOMContentLoaded', () => {
// Start at the first screen
showScreen('start');
});