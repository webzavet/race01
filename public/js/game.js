const token = localStorage.getItem('token');
const username = localStorage.getItem('username');
const socket = io('http://localhost:8123', {
    transports: ['websocket'],
    auth: { token: `Bearer ${token}` },
});

socket.on('connect', () => {
    console.log('[WS] Connected to game room');
});

socket.on('gameState', (session) => {
    const { players } = session;
    const role = players.attack.username === username ? 'attack' : 'defense';
    const myHand = players[role].hand;

    // Обновление HP
    const myHP = players[role].health;
    const enemyRole = role === 'attack' ? 'defense' : 'attack';
    const enemyHP = players[enemyRole].health;

    document.getElementById('player_hp').textContent = myHP;
    document.getElementById('enemy_hp').textContent = enemyHP;

    // Отрисовка карт
    renderMyHand(myHand);
});


function renderMyHand(cards) {
    const container = document.querySelector('.player_cards');
    container.innerHTML = '';

    cards.forEach((card) => {
        const div = document.createElement('div');
        div.classList.add('card_holder');

        div.innerHTML = `
            <div class="card_with_stats">
                <img src="/${card.icon}" class="player_card_img" draggable="true">
                <span class="hp">${card.defence}</span>
                <span class="cost">${card.cost}</span>
                <span class="dmg">${card.attack}</span>
            </div>
        `;

        container.appendChild(div);
    });

    console.log('[DEBUG] Final HTML of .player_cards:', container.innerHTML);
}

window.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
    }
});
