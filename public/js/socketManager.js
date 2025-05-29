// socketManager.js
import {
    renderMyHand,
    updateHP,
    updateArrow,
    updateElixir,
    renderEnemyPlayedCard,
} from './ui.js';
import { updateGameState, getRole, getGameState } from './state.js';
import { resetCardPlayFlag } from './dragHandler.js';

export const socket = io('http://localhost:8123', {
    transports: ['websocket'],
    auth: {
        token: `Bearer ${localStorage.getItem('token')}`,
    },
});

socket.on('connect', () => {
    console.log('[WS] Connected');
});

// receiving the full game state at the beginning or after updates
socket.on('gameState', (session) => {
    if (!session || !session.players) {
        console.warn('[WS] Invalid gameState payload:', session);
        return;
    }

    updateGameState(session);
    resetCardPlayFlag();

    const username = localStorage.getItem('username');
    const role = getRole(session, username);

    if (!role) {
        console.warn('[WS] Could not determine role for', username);
        return;
    }

    console.log('[WS] gameState received for role:', role, session);

    // Update interface: hand, HP, elixir, arrow
    renderMyHand(session.players[role].hand);
    updateHP(session);
    updateElixir(session);
    updateArrow(session, username);
});

socket.on('cardPlayed', ({ side, card }) => {
    console.log(`[WS] ${side} played card:`, card);

    const username = localStorage.getItem('username');
    const session = getGameState();
    const myRole = getRole(session, username);

    if (side !== myRole) {
        renderEnemyPlayedCard(card);
    }
});

// battle
socket.on('battleResult', ({ diff }) => {
    console.log(`[WS] Battle result: ${diff}`);

    document.querySelector('.player_battle').innerHTML = '';
    document.querySelector('.enemy_play_cards').innerHTML = '';
});

// update player and enemy HP after battle
socket.on('hpUpdate', ({ attackHP, defenseHP }) => {
    const session = getGameState();
    if (!session || !session.players) {
        console.warn('[WS] No valid session in hpUpdate');
        return;
    }

    const username = localStorage.getItem('username');
    const role = getRole(session, username);

    if (!role) {
        console.warn('[WS] Could not determine role in hpUpdate');
        return;
    }

    console.log('[WS] hpUpdate:', { attackHP, defenseHP, role });

    document.getElementById('player_hp').textContent =
        role === 'attack' ? attackHP : defenseHP;
    document.getElementById('enemy_hp').textContent =
        role === 'attack' ? defenseHP : attackHP;
});

// new round
socket.on('handingCards', ({ round, hands }) => {
    console.log(`[WS] Round ${round} begins`);
    const username = localStorage.getItem('username');

    const session = getGameState();
    if (!session || !session.players) {
        console.warn('[WS] handingCards: missing game state');
        return;
    }

    const role =
        session.players.attack.username === username ? 'attack' : 'defense';

    renderMyHand(hands[role]);
    window.hasPlayedCard = false;
});

//give up
// socket.on('endGame', ({ by }) => {
//     const username = localStorage.getItem('username');
//     const message = by === username ? 'You lose!' : 'You win!';

//     console.log('[WS] Game ended. Triggered by:', by, '| You are:', username);

//     alert(message);
//     socket.disconnect();
//     console.log('Socket connected after disconnect:', socket.connected);
//     window.location.href = '/';
// });
socket.on('endGame', ({ by, winner, reason }) => {
    const username = localStorage.getItem('username');

    let message = '';

    if (Array.isArray(winner)) {
        if (winner.length === 0) {
            message = 'Draw!';
        } else if (winner.includes(username)) {
            message = 'You win!';
        } else {
            message = 'You lose!';
        }

        if (reason) {
            message += `\nReason: ${reason}`;
        }
    } else {
        // Fallback — случай с give up
        message = by === username ? 'You lose!' : 'You win!';
    }

    console.log('[WS] Game ended. Triggered by:', by, '| You are:', username);

    alert(message);
    socket.disconnect();
    setTimeout(() => {
        console.log('[DEBUG] Socket connected after endGame:', socket.connected);
    }, 10000);
    window.location.href = '/';
});

document.getElementById('big_nt_btn').addEventListener('click', () => {
    if (confirm('Are you ready to accept your insignificance?')) {
        socket.emit('endGame');
    }
});
