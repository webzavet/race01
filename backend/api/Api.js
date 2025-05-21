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

const router = express.Router();

export class Api {
    constructor(cfg, log) {
        this.cfg = cfg;
        this.log = log;

        this.app = express();
        this.server = null;

        this.app.use(express.json());

        this.app.use((req, _res, next) => {
            this.log.info(`${req.method} ${req.originalUrl}`);
            next();
        });

        const authRouter = express.Router();
        authRouter.post('/register', registerHandler);
        authRouter.post('/login',    loginHandler);
        this.app.use('/auth', authRouter);

        // ROOMS
        const roomsRouter = express.Router();
        roomsRouter.use(authMiddleware);
        roomsRouter.post   ('/create', createRoomHandler);
        roomsRouter.get    ('/:roomName', getRoomHandler);    // читаем из params
        roomsRouter.post   ('/join',   joinRoomHandler);
        roomsRouter.delete ('/leave',  leaveRoomHandler);
        roomsRouter.patch  ('/close',  closeRoomHandler);
        roomsRouter.delete ('/delete', deleteRoomHandler);
        this.app.use('/rooms', roomsRouter);

        this.app.use(errorMiddleware)
    }

    start() {
        this.server = this.app.listen(this.cfg.server.port, () =>
            this.log.info(`API started on ${this.cfg.server.port}`));
    }

    stop() {
        return new Promise((resolve, reject) => {
            if (!this.server) return resolve();
            this.server.close(err => {
                if (err) return reject(err);
                resolve();
            });
        });
    }
}
