// tools/websocket.js
import { Server as IOServer } from 'socket.io';
import TokenManager from '../../tools/tokens/TokenManager.js';
import log from '../../tools/logger/Logger.js';
import config from '../../tools/config/Config.js';
import {attackStage, defenseStage, fightingStage, Game} from './Game.js';

// Helper function to sleep for a given number of milliseconds
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default class WebSocketGateway {
    constructor(server) {
        this.io = new IOServer(server, {
            cors: { origin: '*', methods: ['GET', 'POST'] },
            allowRequest: (req, cb) => cb(null, true),
        });

        this.tokenManager = new TokenManager({ secretKey: config.jwt.secretKey });
        this.game = new Game();

        this._setupAuth();
        this._setupConnection();
    }

    /* ------------- auth middleware ------------- */
    // {
    //     "transports": ["websocket"],
    //     "auth": {
    //         "token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InNlY29uZCIsImlhdCI6MTc0ODIzNTE5NCwiZXhwIjoxNzUwOTEzNTk0fQ.SUOEH7OGjXvzr3dToPxN33LmPTG4efzfKAz2rQ2jltA"
    //     }
    // }
    // So u need to send json body like this in the request to connect to the WebSocket server.
    // This method sets up the authentication middleware for WebSocket connections.
    _setupAuth() {
        this.io.use((socket, next) => {
            try {
                const { token } = socket.handshake.auth || {};
                if (!token)  {
                    socket.disconnect();
                    throw new Error('Missing auth token');
                }

                const raw = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
                socket.data.user = this.tokenManager.verifyToken(raw);
                log.info(`WS auth: ${socket.data.user.username}`);
                next();
            } catch (err) {
                log.error(`WS auth error: ${err.message}`);
                next(new Error('Unauthorized'));
            }
        });
    }

    /* ------------- main connection handler ------------- */
    async _setupConnection() {
        this.io.on('connection', async (socket) => {
            try {
                const user = socket.data.user;
                let roomID;

                const player = await this.game.getPlayerByUsername(user.username);
                if (!player) {
                    socket.disconnect();
                    throw new wsError('Player record not found');
                }
                roomID = player.room;

                socket.join(roomID);

                // ── SERVER → CLIENT: notify about player connection ──
                // event: 'userConnect'
                // payload: { username: string }
                this.io.to(roomID).emit('userConnect', {username: player.username});

                const count = this.io.sockets.adapter.rooms.get(roomID).size;
                if (count === 1) {

                    // ── SERVER → CLIENT (attacker only)
                    // event: 'waitingOpponent'
                    // payload: { username: string }
                    socket.to(roomID).emit('waitingOpponent', {username: player.username});
                } else if (count === 2) {

                    // ── SERVER → CLIENT (both)
                    // event: 'startGame'
                    // payload: { id: string }
                    const session = await this.game.startGame(roomID);
                    this.io.to(roomID).emit('startGame', {id: roomID});

                    // full sessions data go to functions and see for how it works
                    await this._emitGameState(roomID);
                } else {
                    socket.disconnect();
                    throw new wsError('Room is full');
                }

                /**
                 * @event playCardAttack
                 * @client → server
                 * @payload { object } data
                 * @payload { string|number } data.cardId — ID card that attacker plays
                 * @throws error if cardId missing or invalid turn
                 *
                 * @server → client emits:
                 *   cardPlayed   { side: 'attack', card: GameCard, nextStage: string }
                 *   battleResult { diff: number }                (when both played)
                 *   hpUpdate     { attackHP: number, defenseHP: number }
                 *   handingCards { round: number, hands: { attack: GameCard[], defense: GameCard[] } }
                 *   gameState    { full GameSession snapshot }
                 */
                /* ------- gameplay events ------- */
                socket.on('playCardAttack', async (data) => {
                    const cardId = data.cardId;
                    if (!cardId) {
                        socket.emit('error', { message: 'cardId is required' });
                        return;
                    }
                    await this._handlePlayCard(roomID, user.username, attackStage, cardId);

                    // full sessions data go to functions and see for how it works
                    await this._emitGameState(roomID);
                });


                /**
                 * @event playCardDefense
                 * @client → server
                 * @payload { object } data
                 * @payload { string|number } data.cardId — ID card that defender plays
                 * @throws error if cardId missing or invalid turn
                 *
                 * @server → client emits:
                 *   cardPlayed   { side: 'defense', card: GameCard, nextStage: string }
                 *   battleResult { diff: number }
                 *   hpUpdate     { attackHP: number, defenseHP: number }
                 *   handingCards { round: number, hands: { attack: GameCard[], defense: GameCard[] } }
                 *   gameState    { full GameSession snapshot }
                 */
                socket.on('playCardDefense', async (data) => {
                    const cardId = data.cardId;
                    if (!cardId) {
                        socket.emit('error', { message: 'cardId is required' });
                        return;
                    }
                    await this._handlePlayCard(roomID, user.username, defenseStage, cardId);

                    // full sessions data go to functions and see for how it works
                    await this._emitGameState(roomID);
                });

                /**
                 * @event endGame
                 * @client → server
                 * @payload none (optional { reason: string })
                 *
                 * @server → client emits:
                 *   endGame { by: string, winner?: string[], reason?: string }
                 *   gameState { full GameSession snapshot }
                 */
                socket.on('endGame', async () => {
                    await this.game.endGame(roomID);
                    this.io.to(roomID).emit('endGame', {by: user.username, });

                    // full sessions data go to functions and see for how it works
                    log.info(`Game ended for room ${roomID} by ${user.username}`);
                    log.info(`Room ${roomID} deleted`);

                    this.io.socketsLeave(roomID);
                });

                /**
                 * @event serverShutdown
                 * @client → server
                 * @payload { message: string }
                 *
                 * @server → client emits:
                 *   endGame { by: 'server', reason: 'shutdown', message: string }
                 */
                socket.on('serverShutdown', () => {
                    socket.emit('endGame', {by: 'server', reason: 'shutdown'});
                    socket.disconnect();
                });

                /**
                 * @event error
                 * @server → client
                 * @payload { message: string }
                 */
                socket.on('error', err => {
                    log.error(err);
                    socket.emit('error', {message: err.message || 'Unknown error'});
                });

                /**
                 * @event disconnect
                 * @server → client
                 * @payload { username: string }
                 */
                socket.on('disconnect', () => {
                    this.io.to(roomID).emit('userDisconnect', {username: user.username});
                });
            } catch (err) {
                log.error(`WebSocket connection error: ${err.message}`);
                this.io.emit('error', {message: err.message || 'Unknown connection error'});
            }
        });
    }

    async _handlePlayCard(roomID, user, side, cardId) {
        try {
            const card    = await this.game.addCardToTable(roomID, user, side, cardId);
            const session = await this.game.getGame(roomID);

            // ── SERVER → CLIENT
            // event: 'cardPlayed'
            // payload: { side: 'attack'|'defense', card: GameCard, nextStage: string }
            this.io.to(roomID).emit('cardPlayed', {
                side,
                card,
            });

            // full sessions data go to functions and see for how it works
            await this._emitGameState(roomID);

            // if it`s not a fighting stage, we just return
            if (session.stage !== fightingStage) return;

            setTimeout(async () => {
                const diff = await this.game.cardBattle(roomID);

                // ── SERVER → CLIENT
                // event: 'battleResult'
                // payload: { diff: number }
                this.io.to(roomID).emit('battleResult', { diff });
                await this._emitGameState(roomID);

                setTimeout(async () => {
                    await this.game.startRound(roomID);
                    const afterRound = await this.game.getGame(roomID);

                    // ── SERVER → CLIENT
                    // event: 'hpUpdate'
                    // payload: { attackHP: number, defenseHP: number }
                    this.io.to(roomID).emit('hpUpdate', {
                        attackHP:  afterRound.players.attack.health,
                        defenseHP: afterRound.players.defense.health
                    });
                    await this._emitGameState(roomID);

                    if (afterRound.winner.length) {
                        const reason = afterRound.winner.length === 2 ? 'draw' : 'player defeated';

                        // ── SERVER → CLIENT
                        // event: 'endGame'
                        // payload: { winner: string[], reason: string }
                        this.io.to(roomID).emit('endGame', {
                            winner: afterRound.winner,
                            reason
                        });

                        await this.game.endGame(roomID);

                        await this._emitGameState(roomID);
                        return this.io.socketsLeave(roomID);
                    }

                    await this.game.handingCards(roomID);
                    const next = await this.game.getGame(roomID);
                    this.io.to(roomID).emit('handingCards', {
                        round: next.round,
                        hands: {
                            attack:  next.players.attack.hand,
                            defense: next.players.defense.hand
                        }
                    });
                    await this._emitGameState(roomID);
                }, 2000);
            }, 1000);


        } catch (err) {
            log.error(`Play card error: ${err.message}`);
            this.io.to(roomID).emit('error', { message: err.message || 'Unknown play card error' });
        }
    }

    /**
     * @method _emitGameState
     * @description send full data about game session
     * @server → client
     * @event gameState
     * @payload example looks like this:
     *{
     *   "round": 1,
     *   "stage": "attack",
     *   "players": {
     *     "attack": {
     *       "username": "first",
     *       "health": 20,
     *       "elixir": 1,
     *       "hand": [
     *         {
     *           "id": "6",
     *           "name": "Kron",
     *           "icon": "media/cards/icons/kron.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A guardian of the ancient ruins, strong and resilient.",
     *           "attack": 7,
     *           "defence": 2,
     *           "cost": 3,
     *           "attribute": "intellect",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "13",
     *           "name": "Cira",
     *           "icon": "media/cards/icons/cira.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A healer who mends the wounds of allies.",
     *           "attack": 1,
     *           "defence": 5,
     *           "cost": 2,
     *           "attribute": "strange",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "1",
     *           "name": "Ekh",
     *           "icon": "media/cards/icons/ekh.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A mysterious creature with a strange aura.",
     *           "attack": 5,
     *           "defence": 3,
     *           "cost": 2,
     *           "attribute": "strange",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "15",
     *           "name": "Elysia",
     *           "icon": "media/cards/icons/elysia.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A serene spirit that brings peace to the battlefield.",
     *           "attack": 2,
     *           "defence": 4,
     *           "cost": 1,
     *           "attribute": "intellect",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         }
     *       ],
     *       "table": {
     *         "id": "2",
     *         "name": "Zara",
     *         "icon": "media/cards/icons/zara.png",
     *         "sound": "media/cards/sounds/ekh.mp3",
     *         "descr": "A swift and agile warrior from the northern tribes.",
     *         "attack": 4,
     *         "defence": 2,
     *         "cost": 3,
     *         "attribute": "agility",
     *         "created_at": "2025-05-26T09:57:42.000Z"
     *       }
     *     },
     *     "defense": {
     *       "username": "second",
     *       "health": 22,
     *       "elixir": 0,
     *       "hand": [
     *         {
     *           "id": "3",
     *           "name": "Orin",
     *           "icon": "media/cards/icons/orin.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A wise mage with powerful spells.",
     *           "attack": 3,
     *           "defence": 4,
     *           "cost": 5,
     *           "attribute": "intellect",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "11",
     *           "name": "Astra",
     *           "icon": "media/cards/icons/astra.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A celestial being that guides lost souls.",
     *           "attack": 2,
     *           "defence": 6,
     *           "cost": 1,
     *           "attribute": "agility",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "4",
     *           "name": "Thorn",
     *           "icon": "media/cards/icons/thorn.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A fierce beast with sharp claws.",
     *           "attack": 6,
     *           "defence": 1,
     *           "cost": 4,
     *           "attribute": "strange",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         },
     *         {
     *           "id": "9",
     *           "name": "Grom",
     *           "icon": "media/cards/icons/grom.png",
     *           "sound": "media/cards/sounds/ekh.mp3",
     *           "descr": "A hulking brute with unmatched strength.",
     *           "attack": 8,
     *           "defence": 0,
     *           "cost": 5,
     *           "attribute": "intellect",
     *           "created_at": "2025-05-26T09:57:42.000Z"
     *         }
     *       ],
     *       "table": {
     *         "id": "17",
     *         "name": "Griff",
     *         "icon": "media/cards/icons/griff.png",
     *         "sound": "media/cards/sounds/ekh.mp3",
     *         "descr": "A majestic creature that soars through the skies.",
     *         "attack": 5,
     *         "defence": 2,
     *         "cost": 4,
     *         "attribute": "agility",
     *         "created_at": "2025-05-26T09:57:42.000Z"
     *       }
     *     }
     *   },
     *   "deck": [
     *     {
     *       "id": "10",
     *       "name": "Nix",
     *       "icon": "media/cards/icons/nix.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A shadowy figure that moves unseen.",
     *       "attack": 4,
     *       "defence": 4,
     *       "cost": 2,
     *       "attribute": "strange",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "18",
     *       "name": "Hawk",
     *       "icon": "media/cards/icons/hawk.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A keen-eyed hunter with unmatched precision.",
     *       "attack": 3,
     *       "defence": 5,
     *       "cost": 2,
     *       "attribute": "intellect",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "16",
     *       "name": "Frost",
     *       "icon": "media/cards/icons/frost.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "An icy elemental that freezes its foes.",
     *       "attack": 4,
     *       "defence": 3,
     *       "cost": 3,
     *       "attribute": "strange",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "7",
     *       "name": "Vex",
     *       "icon": "media/cards/icons/vex.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A trickster spirit that confuses its enemies.",
     *       "attack": 3,
     *       "defence": 3,
     *       "cost": 2,
     *       "attribute": "strange",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "20",
     *       "name": "Jade",
     *       "icon": "media/cards/icons/jade.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A mystical guardian with a heart of stone.",
     *       "attack": 4,
     *       "defence": 4,
     *       "cost": 3,
     *       "attribute": "agility",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "12",
     *       "name": "Bram",
     *       "icon": "media/cards/icons/bram.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A stalwart defender with an unbreakable shield.",
     *       "attack": 3,
     *       "defence": 7,
     *       "cost": 3,
     *       "attribute": "intellect",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "5",
     *       "name": "Luna",
     *       "icon": "media/cards/icons/luna.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A mystical being that controls the tides.",
     *       "attack": 2,
     *       "defence": 5,
     *       "cost": 1,
     *       "attribute": "agility",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "14",
     *       "name": "Drax",
     *       "icon": "media/cards/icons/drax.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A relentless warrior with a thirst for battle.",
     *       "attack": 6,
     *       "defence": 2,
     *       "cost": 4,
     *       "attribute": "agility",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "19",
     *       "name": "Ivy",
     *       "icon": "media/cards/icons/ivy.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A creeping vine that ensnares its enemies.",
     *       "attack": 2,
     *       "defence": 6,
     *       "cost": 1,
     *       "attribute": "strange",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     },
     *     {
     *       "id": "8",
     *       "name": "Fira",
     *       "icon": "media/cards/icons/fira.png",
     *       "sound": "media/cards/sounds/ekh.mp3",
     *       "descr": "A fiery elemental that burns with passion.",
     *       "attack": 5,
     *       "defence": 1,
     *       "cost": 4,
     *       "attribute": "agility",
     *       "created_at": "2025-05-26T09:57:42.000Z"
     *     }
     *   ],
     *   "discard": [],
     *   "winner": []
     * }
     */
    async _emitGameState(roomID) {
        const session = await this.game.getGame(roomID);
        this.io.to(roomID).emit('gameState', session);
    }
}

class wsError extends Error {
    constructor(message = 'Unexpected error', cause = null) {
        super(message);
        if (cause) {
            this.cause = cause;
        }
    }
}