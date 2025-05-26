// tools/websocket.js
import { Server as IOServer } from 'socket.io';
import TokenManager from '../../tools/tokens/TokenManager.js';
import log from '../../tools/logger/Logger.js';
import config from '../../tools/config/Config.js';
import {attackStage, defenseStage, fightingStage, Game} from './Game.js';
import { database } from "../../data/sql/Database.js";

/* ------------------------------------------------------------------
 * WebSocket gateway rewritten as a class
 * ----------------------------------------------------------------*/
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

                const player = await database.players().filterUsername(user.username).get();
                if (!player) {
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
                    await this._handlePlayCard(roomID, attackStage, cardId);

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
                    await this._handlePlayCard(roomID, defenseStage, cardId);

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
                    this.io.to(roomID).emit('endGame', {by: user.username});

                    // full sessions data go to functions and see for how it works
                    await this._emitGameState(roomID);
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

    /* ------------- factory for playCard handlers ------------- */
    /* ------------ обновлённый метод ------------ */
    async _handlePlayCard(roomID, side, cardId) {
        try {
            const card    = await this.game.addCardToTable(roomID, side, cardId);
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

            // ── SERVER → CLIENT
            // event: 'battleResult'
            // payload: { diff: number }
            const diff = await this.game.cardBattle(roomID);
            this.io.to(roomID).emit('battleResult', { diff });

            // full sessions data go to functions and see for how it works
            await this._emitGameState(roomID);

            // ── SERVER → CLIENT
            // event: 'hpUpdate'
            // payload: { attackHP: number, defenseHP: number
            await this.game.removeHealthFromPlayer(roomID, defenseStage, diff);

            // helper function to get updated game state (nothing sends to client)
            await this.game.startRound(roomID);

            const updated = await this.game.getGame(roomID);

            // ── SERVER → CLIENT
            // event: 'hpUpdate'
            // payload: { attackHP: number, defenseHP: number }
            this.io.to(roomID).emit('hpUpdate', {
                attackHP:  updated.players.attack.health,
                defenseHP: updated.players.defense.health
            });

            // full sessions data go to functions and see for how it works
            await this._emitGameState(roomID);

            if (updated.winner.length) {
                const reason = updated.winner.length === 2 ? 'draw' : 'player defeated';

                // ── SERVER → CLIENT
                // event: 'endGame'
                // payload: { winner: string[], reason: string }
                this.io.to(roomID).emit('endGame', { winner: updated.winner, reason });

                // full sessions data go to functions and see for how it works
                await this._emitGameState(roomID);
                return this.io.socketsLeave(roomID);
            }


            // helper function to hand out new cards (nothing sends to client)
            await this.game.handingCards(roomID);
            const next = await this.game.getGame(roomID);
            this.io.to(roomID).emit('handingCards', {
                round: next.round,
                hands: {
                    attack:  next.players.attack.hand,
                    defense: next.players.defense.hand
                }
            });

            // full sessions data go to functions and see for how it works
            await this._emitGameState(roomID);

        } catch (err) {
            log.error(`Play card error: ${err.message}`);
            this.io.to(roomID).emit('error', { message: err.message || 'Unknown play card error' });
        }
    }


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