import {sessions} from "../../data/cache/sessions.js";
import {database} from "../../data/sql/Database.js";
import log from "../../tools/logger/Logger.js";

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

        await this.database.players().filterRoom(roomID).delete();
        await this.database.rooms().filterID(roomID).delete();
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

    async startRound(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.stage !== fightingStage) {
            throw new Error('Game is not in the fighting stage');
        }

        if (session.deck.length === 0) {
            if (session.discard.length === 0) {
                throw new Error('Deck and discard are empty');
            }

            session.deck = shuffleCards(session.discard);
            session.discard = [];

            log.info('Deck was shuffled from discard pile');
        }

        log.info(`Deck length: ${session.deck.length}`);

        if (session.winner && session.winner.length > 0) {
            return;
        }

        if (session.players.attack.elixir + 4 > 10) {
            session.players.attack.elixir = 10;
        }
        else {
            session.players.attack.elixir = session.players.attack.elixir + 4;
        }

        if (session.players.defense.elixir + 4 > 10) {
            session.players.defense.elixir = 10;
        }
        else {
            session.players.defense.elixir = session.players.defense.elixir + 4;
        }

        let attackerNew = session.players.defense;
        let defenderNew = session.players.attack;

        session.players.attack = attackerNew;
        session.players.defense = defenderNew;

        session.round++;
        await this.sessions.set(roomID, session);
    }

    async handingCards(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        log.info(`Handing cards in room ${roomID}`);

        if (session.stage !== fightingStage) {
            throw new Error('Game is not in the fighting stage something went wrong');
        }

        session.stage = handingStage;

        const drawFor = (side) => {
            const hand = session.players[side].hand;
            while (hand.length < 4 && session.deck.length > 0) {
                hand.push(session.deck.pop());
            }
        };

        drawFor('attack');
        drawFor('defense');

        session.stage = attackStage

        log.info(`New stage: ${session.stage}`);

        await this.sessions.set(roomID, session);
    }

    async addCardToTable(roomID, user, side, cardId) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        log.info(`Adding card ${cardId} to ${side} table in room ${roomID}`);

        if (session.stage !== side) {
            throw new Error(`Not ${side}’s turn`);
        }

        let player
        if (side === 'defense') {
            player = session.players.defense;
        } else if (side === 'attack') {
            player = session.players.attack;
        }

        if (player.username !== user) {
            throw new Error(`Player ${user} is not on the ${side} side`);
        }

        if (player.table && Object.keys(player.table).length > 0) {
            throw new Error(`${side} table already has a card`);
        }

        log.info(`Adding card ${cardId} to ${side} table in room ${roomID}`);

        log.info("Cards in player's hand:", player.hand.map(c => c.id));

        const hand = player.hand;
        // Преобразуем incoming cardId к строке
        const idToFind = String(cardId);

        const idx = hand.findIndex(c => c.id === idToFind);
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

        await this.sessions.set(roomID, session);

        log.info(`Card ${card.id} added to ${side} table in room ${roomID}`);

        return card;
    }

    async cardBattle(roomID) {
        const session = await this.sessions.getCopy(roomID);
        if (!session) throw new Error('Session not found');

        if (session.stage !== fightingStage) {
            throw new Error('Game is not in fighting stage');
        }

        const atk = session.players.attack.table;
        const def = session.players.defense.table;
        if (!atk || !def) {
            throw new Error('Both attack and defense cards must be played');
        }

        const atkMultiplier =
            (atk.attribute === intellect   && def.attribute === strength) ||
            (atk.attribute === strength    && def.attribute === agility)  ||
            (atk.attribute === agility     && def.attribute === intellect)
                ? 2
                : 1;

        const defMultiplier =
            (def.attribute === intellect   && atk.attribute === strength) ||
            (def.attribute === strength    && atk.attribute === agility)  ||
            (def.attribute === agility     && atk.attribute === intellect)
                ? 2
                : 1;

        const attackPower  = atk.attack  * atkMultiplier;
        const defensePower = def.defence * defMultiplier;

        let damage = attackPower - defensePower;
        const winner = damage > 0 ? 'attack' : 'defense';
        damage = Math.abs(damage);

        const loserSide = winner === 'attack' ? 'defense' : 'attack';
        session.players[loserSide].health -= damage;

        if (session.players[loserSide].health <= 0) {
            session.condition = 'finished';
            session.winner    = [winner];
        }

        session.discard.push(atk, def);

        session.players.attack.table  = [];
        session.players.defense.table = [];

        session.stage = fightingStage;
        await this.sessions.set(roomID, session);

        return {
            winner,
            damage,
            hpAttack:  session.players.attack.health,
            hpDefense: session.players.defense.health
        };
    }

    async getPlayerByUsername(username) {
        return await database.players().filterUsername(username).get();;
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