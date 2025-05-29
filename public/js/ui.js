// ui.js
export function renderMyHand(cards) {
    const container = document.querySelector('.player_cards');
    container.innerHTML = '';

    cards.forEach((card) => {
        const div = document.createElement('div');
        div.classList.add('card_holder');

        div.innerHTML = `
            <div class="card_with_stats" data-id="${card.id}">
                <img src="/${card.icon}" class="player_card_img" draggable="true">
                <span class="hp">${card.defence}</span>
                <span class="cost">${card.cost}</span>
                <span class="dmg">${card.attack}</span>
                <span class="${card.attribute}"></span>
            </div>
        `;

        container.appendChild(div);
    });
}

export function renderEnemyPlayedCard(card) {
    const container = document.querySelector('.enemy_play_cards');
    container.innerHTML = ''; 

    const div = document.createElement('div');
    div.classList.add('card_with_stats');
    div.dataset.id = card.id;

    div.innerHTML = `
        <img src="/${card.icon}" draggable="false">
        <span class="hp">${card.defence}</span>
        <span class="cost">${card.cost}</span>
        <span class="dmg">${card.attack}</span>
    `;

    container.appendChild(div);
}

export function updateHP(session) {
    const username = localStorage.getItem('username');
    const role = session.players.attack.username === username ? 'attack' : 'defense';
    const enemy = role === 'attack' ? 'defense' : 'attack';

    document.getElementById('player_hp').textContent = session.players[role].health;
    document.getElementById('enemy_hp').textContent = session.players[enemy].health;
}

export function updateArrow(session, username) {
    const { stage, players } = session;
    const arrow = document.querySelector('.move_check');

    if (stage === 'attack') {
        arrow.style.transform = players.attack.username === username ? 'rotate(180deg)' : 'rotate(0deg)';
    } else if (stage === 'defense') {
        arrow.style.transform = players.defense.username === username ? 'rotate(180deg)' : 'rotate(0deg)';
    } else {
        arrow.style.transform = 'rotate(90deg)';
    }
}

export function updateElixir(session) {
    const username = localStorage.getItem('username');
    const role = session.players.attack.username === username ? 'attack' : 'defense';
    const elixir = session.players[role].elixir;

    document.getElementById('player_mana').textContent = elixir;
}
