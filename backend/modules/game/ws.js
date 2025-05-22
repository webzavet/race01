// tools/websocket.js
import { Server as IOServer } from 'socket.io';
import TokenManager from '../../tools/tokens/TokenManager.js';
import log from '../../tools/logger/Logger.js';
import config from '../../tools/config/Config.js';

const tm = new TokenManager({ secretKey: config.jwt.secretKey  });

export function initWebSocket(server) {
    const io = new IOServer(server, {
        cors: { origin: '*', methods: ['GET','POST'] },
        allowRequest: (req, callback) => {
            callback(null, true);
        }
    });

    io.use((socket, next) => {
        const { token } = socket.handshake.auth || {};
        if (!token) {
            log.warn('WS auth failed: auth token missing');
            return next(new Error('Unauthorized'));
        }
        let user;
        try {
            const raw = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
            user = tm.verifyToken(raw);
        } catch (err) {
            log.warn('WS auth failed: invalid token');
            return next(new Error('Unauthorized'));
        }
        socket.data.user = user;
        log.info('WS auth success', user.username);
        next();
    });

    io.on('connection', socket => {
        // Берём ID комнаты из бизнес-логики (заглушка)
        const roomID = 'room-123';
        socket.join(roomID);
        const count = io.sockets.adapter.rooms.get(roomID).size;

        if (count === 1) {
            socket.emit('waitingOpponent');
        } else if (count === 2) {
            io.to(roomID).emit('startGame');
        } else {
            socket.emit('gameFull');
            socket.leave(roomID);
            return;
        }

        socket.on('disconnect', () => {
            const room = io.sockets.adapter.rooms.get(roomID);
            const remaining = room ? room.size : 0;
            socket.to(roomID).emit('playerLeft', { username: socket.data.user.username });
        });
    });

    return io;
}