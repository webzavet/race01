import {sessions} from "../../data/cache/sessions.js";
import {database} from "../../data/sql/Database.js";

export const attackStage  = 'attack';
export const defenseStage = 'defense';
export const fightingStage= 'fighting';
export const handingStage = 'handing';

export const DefenceSide = 'defense';
export const AttackSide = 'attack';

export const waitingCond = 'waiting';
export const playingCond = 'playing';

export const agility = 'agility';
export const strength = 'strength';
export const intellect = 'intellect';

export class Game {
    constructor() {
        this.sessions = sessions;
        this.database = database;
    }

    async startGame(roomID) {
        const players = await this.database.players().filterRoom(roomID).select();
        if (!players || players.length !== 2) {
            throw new Error('Not enough players to start the game');
        }
        let player1 = players[0].username;
        let player2 = players[1].username;

        let cards = await this.database.cards().select();
        if (!cards || cards.length < 8) {
            throw new Error('Not enough cards to start the game');
        }

        function HoIsTheFirst(player1, player2) {
            return Math.random() < 0.5
                ? [player1, player2]
                : [player2, player1];
        }

        cards = shuffleCards(cards);

        const player1Hand = cards.slice(0, 4);
        const player2Hand = cards.slice(4, 8);

        const deck = cards.slice(8, cards.length);

        [player1, player2] = HoIsTheFirst(player1, player2);

        const gameSession = {
            round: 1,
            stage: attackStage,
            condition: playingCond,

            players: {
                attack: {
                    username: player1,
                    health: 20,
                    elixir: 4,
                    hand: player1Hand,
                    table: {}
                },

                defense: {
                    username: player2,
                    health: 20,
                    elixir: 4,
                    hand: player2Hand,
                    table: {}
                }
            },

            deck: deck,

            discard: [],

            winner: [],
        }

        await this.sessions.set(roomID, gameSession);

        return gameSession;
    }

    async endGame(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) {
            throw new Error('Session not found');
        }

        await this.sessions.delete(roomID, session);
    }

    async getGame(roomID) {
        const session = await this.sessions.get(roomID);
        if (!session) {
            throw new Error('Session not found');
        }

        return session;
    }

    async getAttackSide(roomID) {
        const session = await this.sessions.get(roomID);
        if (!session) {
            throw new Error('Session not found');
        }
        return session.players.attack;
    }

    async getDefenseSide(roomID) {
        const session = await this.sessions.get(roomID);
        if (!session) {
            throw new Error('Session not found');
        }
        return session.players.defense;
    }

    async StartRound(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.condition !== 'playing') {
            throw new Error('Game is not in progress');
        }

        if (session.stage !== fightingStage) {
            throw new Error('Game is not in the handing stage');
        }

        if (session.winner) {
            return session.players[session.winner];
        }

        session.round++;
        await this.sessions.set(roomID, session);
    }

    async handingCards(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.condition !== 'playing') {
            throw new Error('Game is not in progress');
        }

        if (session.stage !== fightingStage) {
            throw new Error('Game is not in the fighting stage something went wrong');
        }

        session.stage = handingStage;

        if (session.deck.length === 0) {
            if (session.discard.length === 0) {
                throw new Error('Deck and discard are empty');
            }

            session.deck = shuffleCards(session.discard);
            session.discard = [];
        }

        const drawFor = (side) => {
            const hand = session.players[side].hand;
            while (hand.length < 4 && session.deck.length > 0) {
                hand.push(session.deck.pop());
            }
        };

        drawFor('attack');
        drawFor('defense');

        session.stage = attackStage

        await this.sessions.set(roomID, session);
    }

    async addCardToTable(roomID, side, cardId) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.condition !== 'playing') {
            throw new Error('Game is not in playing state');
        }
        if (session.stage !== side) {
            throw new Error(`Not ${side}’s turn`);
        }

        const player = session.players[side];
        if (player.table && Object.keys(player.table).length > 0) {
            throw new Error(`${side} table already has a card`);
        }

        const hand = player.hand;
        const idx  = hand.findIndex(c => c.id === cardId);
        if (idx < 0) {
            throw new Error('Card not in hand');
        }
        const card = hand[idx];

        if (player.elixir < card.cost) {
            throw new Error('Not enough elixir');
        }

        hand.splice(idx, 1);
        player.elixir -= card.cost;

        player.table = card;

        if (side === attackStage) {
            session.stage = defenseStage;
        } else if (side === defenseStage) {
            session.stage = fightingStage;
        }

        // 8) Сохраняем обновлённую сессию
        await this.sessions.set(roomID, session);

        return card;
    }

    async cardBattle(roomID) {
        let session = this.sessions.get(roomID);

        if (session.condition !== 'playing') {
            throw new Error('Game is not in progress');
        }

        session.stage = fightingStage;

        let attackCard = session.players.attack.table;
        let defenceCard = session.players.defense.table;

        if (!attackCard || !defenceCard) {
            throw new Error('Card not found');
        }

        const agilityIndex = calculateAttributes(attackCard.attribute, defenceCard.attribute);

        return defenceCard.defence * agilityIndex - attackCard.attack;
    }

    async removeHealthFromPlayer(roomID, side, health) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.condition !== 'playing') {
            throw new Error('Game is not in progress');
        }

        if (session.stage !== handingStage) {
            throw new Error('Game is not in the handing stage');
        }

        if (side !== 'attack' && side !== 'defense') {
            throw new Error('Invalid side');
        }

        const player = session.players[side];
        player.health -= health;

        if (player.health <= 0) {
            session.condition = 'finished';
            session.winner.add(side);
        }

        await this.sessions.set(roomID, session);
    }
}

//---- Supporting functions ----

function shuffleCards(cards) {
    const result = cards.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function calculateAttributes(attack, defence) {
    if (attack === intellect && defence === strength) {
        return 1.5;
    }

    if (attack === strength && defence === intellect) {
        return 0.5;
    }

    if (attack === strength && defence === agility) {
        return 1.5;
    }

    if (attack === agility && defence === strength) {
        return 0.5;
    }

    if (attack === agility && defence === intellect) {
        return 1.5;
    }

    if (attack === intellect && defence === agility) {
        return 0.5;
    }

    return 1;
}

