// backend/data/SessionStore.js
const AsyncLock = require('async-lock');

let example =  {
    room: "room",
    round: 1,
    stage: "attack", //defence, //fight
    condition: "playing", //waiting

    players: {
        attack: {
            username: "player1",
            health: 20,
            elixir: 0,
            hand: [

            ],
            table: {

            }
        },

        defense: {
            username: "player2",
            health: 20,
            elixir: 0,
            hand: [

            ],
            table: {

            }
        }
    },

    deck: [

    ],

    discard: [

    ],

    winner: []
}

/**
 * Локальное хранилище игровых сессий на основе Map.
 * Все операции синхронизированы по sessionId через async-lock.
 */
class SessionStore {
    constructor() {
        /** @private Map<sessionId,string> */
        this._sessions = new Map();
        /** @private */
        this._lock = new AsyncLock();
    }

    /* ─────────────────────── базовые CRUD ─────────────────────── */
    async set(sessionId, session) {
        await this._lock.acquire(sessionId, () => {
            this._sessions.set(sessionId, session);
        });
    }

    async get(sessionId) {
        return this._lock.acquire(sessionId, () => {
            return this._sessions.get(sessionId) || null;
        });
    }

    async getCopy(sessionId) {
        return this._lock.acquire(sessionId, () => {
            const s = this._sessions.get(sessionId);
            return s ? JSON.parse(JSON.stringify(s)) : null;
        });
    }

    async delete(sessionId) {
        await this._lock.acquire(sessionId, () => this._sessions.delete(sessionId));
    }

    /** Частичное обновление по строковому пути. */
    // async update(sessionId, path, value) {
    //     // prevent prototype pollution
    //     const keys = path.split('.');
    //     if (keys.includes('__proto__') || keys.includes('constructor') || keys.includes('prototype')) {
    //         return; // ignore unsafe paths
    //     }
    //     await this._lock.acquire(sessionId, () => {
    //         const s = this._sessions.get(sessionId);
    //         if (!s) throw new Error(`Session ${sessionId} not found`);
    //
    //         let cur = s;
    //         for (let i = 0; i < keys.length - 1; i++) {
    //             if (cur[keys[i]] === undefined) cur[keys[i]] = {};
    //             cur = cur[keys[i]];
    //         }
    //         cur[keys.at(-1)] = value;
    //     });
    // }
    //
    /* ─────────────────────── utils ─────────────────────── */
    // _validateSide(side) {
    //     if (side !== 'attack' && side !== 'defense') {
    //         throw new Error("side must be attack or defense");
    //     }
    // }
    //
    // async _sideUpdate(sessionId, side, subPath, value) {
    //     this._validateSide(side);
    //     await this.update(sessionId, `players.${side}.${subPath}`, value);
    // }
    //
    // async _sideGet(sessionId, side) {
    //     this._validateSide(side);
    //     const s = await this.get(sessionId);
    //     return s ? s.players[side] : null;
    // }
    //
    // /* ─────────────────────── общие шорткаты ─────────────────────── */
    // async SetRound(id, round)        { await this.update(id, 'round', round); }
    // async SetStage(id, stage)        { await this.update(id, 'stage', stage); }
    // async SetCondition(id, cond)     { await this.update(id, 'condition', cond); }
    // async SetTimer(id, seconds)      { await this.update(id, 'timer.duration', seconds); }
    //
    // /* ─────────────────────── deck / discard ─────────────────────── */
    // async SetDeck(id, deckArr)    { await this.update(id, 'deck', deckArr); }
    // async SetDiscard(id, discArr) { await this.update(id, 'discard', discArr); }
    //
    // async RemoveFromDeck(id, cardId) {
    //     await this._lock.acquire(id, () => {
    //         const s = this._sessions.get(id);
    //         if (!s) throw new Error(`Session ${id} not found`);
    //         s.deck = s.deck.filter(c => c.id !== cardId);
    //     });
    // }
    //
    // async AddToDiscard(id, cardObj) {
    //     await this._lock.acquire(id, () => {
    //         const s = this._sessions.get(id);
    //         if (!s) throw new Error(`Session ${id} not found`);
    //         s.discard.push(cardObj);
    //     });
    // }
    //
    // /* ─────────────────────── side-specific setters ─────────────────────── */
    // async AttackSetHealth(id, val)  { await this._sideUpdate(id, 'attack',  'health', val); }
    // async DefenceSetHealth(id, val) { await this._sideUpdate(id, 'defense', 'health', val); }
    //
    // async AttackSetElixir(id, val)  { await this._sideUpdate(id, 'attack',  'elixir', val); }
    // async DefenceSetElixir(id, val) { await this._sideUpdate(id, 'defense', 'elixir', val); }
    //
    // async AttackSetHand(id, arr)    { await this._sideUpdate(id, 'attack',  'hand',  arr); }
    // async DefenceSetHand(id, arr)   { await this._sideUpdate(id, 'defense', 'hand',  arr); }
    //
    // async AttackSetTable(id, arr)   { await this._sideUpdate(id, 'attack',  'table', arr); }
    // async DefenceSetTable(id, arr)  { await this._sideUpdate(id, 'defense', 'table', arr); }
    //
    // /* ─────────────────────── whole side replace / get ─────────────────────── */
    // async AttackSet(id, model)  { await this.update(id, 'players.attack',  model); }
    // async DefenceSet(id, model) { await this.update(id, 'players.defense', model); }
    //
    // async AttackGet(id)  { return await this._sideGet(id, 'attack'); }
    // async DefenceGet(id) { return await this._sideGet(id, 'defense'); }
}

// module.exports = SessionStore;
// module.exports.default = SessionStore;

export const sessions = new SessionStore();