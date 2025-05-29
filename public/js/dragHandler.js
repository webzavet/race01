// dragHandler.js
import { socket } from './socketManager.js';
import { getGameState } from './state.js';

let dragged = null;
let origin = null;
let ghostImg = null;
let dropOK = false;
let hasPlayedCard = false;

const hand = document.querySelector('.player_cards');
const battle = document.getElementById('player_battle');
const username = localStorage.getItem('username');

hand.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.card_with_stats');
    if (!card) return;

    dragged = card;
    origin = card.parentElement;
    dropOK = false;

    const rect = card.getBoundingClientRect();
    ghostImg = card.cloneNode(true);
    Object.assign(ghostImg.style, {
        width: rect.width + 'px',
        height: rect.height + 'px',
        opacity: '0.85',
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
    });
    document.body.appendChild(ghostImg);
    e.dataTransfer.setDragImage(ghostImg, e.offsetX, e.offsetY);
});

hand.addEventListener('dragend', () => {
    ghostImg?.remove();
    ghostImg = null;
    dragged?.style.removeProperty('opacity');
    if (!dropOK && dragged && origin) origin.appendChild(dragged);
    dragged = origin = null;
});

battle.addEventListener('dragover', (e) => {
    if (dragged) e.preventDefault();
});

battle.addEventListener('drop', () => {
    const session = getGameState();
    if (!dragged || !session) return;

    const role = session.players.attack.username === username ? 'attack' : 'defense';
    if (session.stage !== role) {
        alert('Not your turn!');
        return;
    }

    if (hasPlayedCard) {
        alert('You can only play one card per turn!');
        return;
    }

    const cardId = dragged.dataset.id;
    const card = session.players[role].hand.find((c) => c.id == cardId);
    if (!card) {
        alert('Card not in hand!');
        return;
    }

    if (session.players[role].elixir < card.cost) {
        alert('Not enough elixir!');
        return;
    }

    battle.appendChild(dragged);
    dropOK = true;
    hasPlayedCard = true;

    dragged.draggable = false;

    socket.emit(role === 'attack' ? 'playCardAttack' : 'playCardDefense', { cardId });
});

export function resetCardPlayFlag() {
    hasPlayedCard = false;
}
