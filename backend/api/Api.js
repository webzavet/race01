import express from 'express';
import Config from '../tools/config/Config.js';
import Logger from '../tools/logger/Logger.js';

// import { authRoutes }  from './modules/auth/routes.js';
// import { gameRoutes }  from './modules/game/routes.js';

export class Api {
    constructor(cfg, log) {
        this.cfg = cfg;
        this.log = log;
        this.app = express();
        this.server = null;

        this.app.use(express.json());

        const deps = { cfg: this.cfg, log: this.log /* + сервисы */ };

        // this.app.use('/auth',  authRoutes(deps));
        // this.app.use('/game',  gameRoutes(deps));
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
