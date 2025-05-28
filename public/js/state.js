// state.js
let gameState = null;

export function updateGameState(newState) {
    gameState = newState;
}

export function getGameState() {
    return gameState;
}
