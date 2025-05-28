let example =  {
    round: 1,
    stage: "attack", //defence, //fight
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

class SessionStore {
    constructor() {
        this._sessions = new Map();
    }

    async set(roomId, session) {
        this._sessions.set(roomId, session);
    }

    async get(roomId) {
        return this._sessions.get(roomId) || null;
    }

    async getCopy(roomId) {
        const s = this._sessions.get(roomId)
        return s ? JSON.parse(JSON.stringify(s)) : null;
    }

    async delete(roomId) {
        this._sessions.delete(roomId);
    }

    async create(roomId, session) {
        if (this._sessions.has(roomId)) {
            throw new Error(`Session ${roomId} already exists`);
        }
        this._sessions.set(roomId, session);
    }
}

export const sessions = new SessionStore();