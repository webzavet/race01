import express from 'express';
import Config from '../tools/config/Config.js';
import Logger from '../tools/logger/Logger.js';
import router  from './router.js';


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

        this.app.use("/auth", router);
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
