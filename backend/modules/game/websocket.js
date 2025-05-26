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
                    this.io.to(roomID).emit('startGame', {id: roomID, session});
                } else {
                    throw new wsError('Room is full');
                }

                /* ------- gameplay events ------- */
                socket.on('playCardAttack', this._handlePlayCard(attackStage, roomID));
                socket.on('playCardDefense', this._handlePlayCard(defenseStage, roomID));

                socket.on('endGame', async () => {
                    await this.game.endGame(roomID);
                    this.io.to(roomID).emit('endGame', {by: user.username});
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
    _handlePlayCard(side, roomID) {
        return async ({ cardId }) => {
            const card = await this.game.addCardToTable(roomID, side, cardId);
            const session = await this.game.getGame(roomID);

            this.io.to(roomID).emit('cardPlayed', { side, card, nextStage: session.stage });

            if (session.stage !== fightingStage) return;

            // resolve battle only after defender played
            const diff = await this.game.cardBattle(roomID);
            this.io.to(roomID).emit('battleResult', { diff });

            await this.game.removeHealthFromPlayer(roomID, defenseStage, diff);
            const updated = await this.game.getGame(roomID);
            this.io.to(roomID).emit('hpUpdate', {
                attackHP: updated.players.attack.health,
                defenseHP: updated.players.defense.health,
            });

            if (updated.winner.length) {
                const reason = updated.winner.length === 2 ? 'draw' : 'player defeated';
                this.io.to(roomID).emit('endGame', { winner: updated.winner, reason });
                this.io.socketsLeave(roomID);
                return;
            }

            await this.game.handingCards(roomID);
            const nextSession = await this.game.getGame(roomID);
            this.io.to(roomID).emit('handingCards', {
                round: nextSession.round,
                hands: {
                    attack: nextSession.players.attack.hand,
                    defense: nextSession.players.defense.hand,
                },
            });
        };
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