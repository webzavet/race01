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
                this.io.to(roomID).emit('userConnect', {username: player.username});

                const count = this.io.sockets.adapter.rooms.get(roomID).size;
                if (count === 1) {
                    socket.to(roomID).emit('waitingOpponent', {username: player.username});
                } else if (count === 2) {
                    const session = await this.game.startGame(roomID);
                    this.io.to(roomID).emit('startGame', {id: roomID});
                    await this._emitGameState(roomID);
                } else {
                    throw new wsError('Room is full');
                }

                /* ------- gameplay events ------- */
                socket.on('playCardAttack', async (data) => {
                    const cardId = data.cardId;
                    if (!cardId) {
                        socket.emit('error', { message: 'cardId is required' });
                        return;
                    }
                    await this._handlePlayCard(roomID, attackStage, cardId);
                    await this._emitGameState(roomID);
                });

                socket.on('playCardDefense', async (data) => {
                    const cardId = data.cardId;
                    if (!cardId) {
                        socket.emit('error', { message: 'cardId is required' });
                        return;
                    }
                    await this._handlePlayCard(roomID, defenseStage, cardId);
                    await this._emitGameState(roomID);
                });

                socket.on('endGame', async () => {
                    await this.game.endGame(roomID);
                    this.io.to(roomID).emit('endGame', {by: user.username});
                    await this._emitGameState(roomID);
                    this.io.socketsLeave(roomID);
                });

                socket.on('serverShutdown', () => {
                    socket.emit('endGame', {by: 'server', reason: 'shutdown'});
                    socket.disconnect();
                });

                socket.on('error', err => {
                    log.error(err);
                    socket.emit('error', {message: err.message || 'Unknown error'});
                });

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
            // 1. кладём карту на стол
            const card    = await this.game.addCardToTable(roomID, side, cardId);
            const session = await this.game.getGame(roomID);

            this.io.to(roomID).emit('cardPlayed', {
                side,
                card,
                nextStage: session.stage           // 'defense' или 'fighting'
            });
            await this._emitGameState(roomID);

            // 2. если ещё не фаза боя — ждём карту соперника
            if (session.stage !== fightingStage) return;

            // 3. бой
            const diff = await this.game.cardBattle(roomID);
            this.io.to(roomID).emit('battleResult', { diff });
            await this._emitGameState(roomID);

            // await this.game.StartRound(roomID);

            // 4. снимаем здоровье у защитника
            await this.game.removeHealthFromPlayer(roomID, defenseStage, diff);
            await this.game.startRound(roomID);
            const updated = await this.game.getGame(roomID);
            this.io.to(roomID).emit('hpUpdate', {
                attackHP:  updated.players.attack.health,
                defenseHP: updated.players.defense.health
            });

            await this._emitGameState(roomID);

            // 5. проверяем победителя
            if (updated.winner.length) {
                const reason = updated.winner.length === 2 ? 'draw' : 'player defeated';
                this.io.to(roomID).emit('endGame', { winner: updated.winner, reason });
                await this._emitGameState(roomID);
                return this.io.socketsLeave(roomID);
            }

            // 6. раздаём новые карты
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