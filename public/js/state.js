// // state.js
let gameState = null;

export function updateGameState(newState) {
    gameState = newState;
}

export function getGameState() {
    return gameState;
}

export function getRole(session, username) {
    return session.players.attack.username === username ? 'attack' : 'defense';
}
