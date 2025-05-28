// socketManager.js
import { renderMyHand, updateHP, updateArrow } from './ui.js';
import { updateGameState, getRole } from './state.js';

export const socket = io('http://localhost:8123', {
    transports: ['websocket'],
    auth: {
        token: `Bearer ${localStorage.getItem('token')}`
    }
});

socket.on('connect', () => {
    console.log('[WS] Connected');
});

socket.on('gameState', (session) => {
    updateGameState(session);         // сохраняем глобально
    const username = localStorage.getItem('username');
    const role = getRole(session, username);
    //const role = session.players.attack.username === username ? 'attack' : 'defense';
    //const myHand = session.players[role].hand;

    renderMyHand(session.players[role].hand);
    // renderMyHand(myHand);
    updateHP(session);
    updateArrow(session, username);
});

socket.on('cardPlayed', ({ side, card }) => {
    console.log(`[WS] ${side} played card:`, card);
    // Можешь добавить визуализацию или сообщение
});

socket.on('battleResult', ({ diff }) => {
    console.log(`[WS] Battle result: ${diff}`);
    // Покажи урон/анимацию на экране
});

socket.on('endGame', ({ by }) => {
    const username = localStorage.getItem('username');
    const message = by === username ? 'You lose!' : 'You win!';
    alert(message);
    socket.disconnect();
    window.location.href = '/';
});
