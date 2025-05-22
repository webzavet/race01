import express from 'express';
import { authMiddleware } from './middleware/authMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import {loginHandler, registerHandler} from "../modules/auth/handlers.js";
import {
    closeRoomHandler,
    createRoomHandler,
    deleteRoomHandler,
    getRoomHandler,
    joinRoomHandler,
    leaveRoomHandler
} from "../modules/rooms/handlers.js";
import config from "../tools/config/Config.js";
import log from "../tools/logger/Logger.js";
import {initWebSocket} from "../modules/game/ws.js";
import * as http from "node:http";

const router = express.Router();

export class Api {
    constructor() {
        this.app = express();
        this.server = null;
        this.io = null;

        this.app.use(express.json());

        this.app.use((req, _res, next) => {
            log.info(`${req.method} ${req.originalUrl}`);
            next();
        });

        const authRouter = express.Router();
        authRouter.post('/register', registerHandler);
        authRouter.post('/login',    loginHandler);
        this.app.use('/auth', authRouter);

        // ROOMS
        const roomsRouter = express.Router();
        roomsRouter.use(authMiddleware);
        roomsRouter.post   ('/', createRoomHandler);
        roomsRouter.get    ('/:roomName', getRoomHandler);    // читаем из params
        roomsRouter.patch  ('/:roomName',  closeRoomHandler);
        roomsRouter.delete ('/:roomName', deleteRoomHandler);

        roomsRouter.post   ('/:roomName/player',   joinRoomHandler);
        roomsRouter.delete ('/:roomName/player',  leaveRoomHandler);
        this.app.use('/rooms', roomsRouter);

        this.app.use(errorMiddleware)
    }

    start() {
        this.server = http.createServer(this.app);
        // 2) инициализируем WebSocket
        this.io = initWebSocket(this.server);
        // 3) запускаем оба (REST + WS) на одном порту
        this.server.listen(config.server.port, () =>
            log.info(`API+WS started on port ${config.server.port}`)
        );
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) return resolve();
            this.server.close(err => {
                if (err) return reject(err);
                resolve();
            });

            if (this.io) {
                this.io.emit('serverShutdown', { message: 'Server is shutting down' });
                this.io.disconnectSockets(true);
            }
        });
    }
}
