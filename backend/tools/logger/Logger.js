import { createLogger, format as winstonFormat, transports } from 'winston';

export default class Logger {
    /**
     * @param {Object} options
     * @param {string} [options.level='info']
     * @param {'json'|'text'} [options.format='text']
     */
    constructor({ level = 'info', format: logFormat = 'text' } = {}) {
        const isJson = logFormat === 'json';

        const loggerFormats = [
            winstonFormat.timestamp(),
            isJson ? winstonFormat.json() : winstonFormat.colorize({ all: true }),
            !isJson &&
            winstonFormat.printf(({ timestamp, level, message, ...meta }) => {
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `[${timestamp}] [${level}] ${message}${metaStr ? ` ${metaStr}` : ''}`;
            }),
        ].filter(Boolean);

        this.logger = createLogger({
            level,
            format: winstonFormat.combine(...loggerFormats),
            transports: [
                new transports.Console(),
                // new transports.File({ filename: 'app.log' }),
            ],
        });
    }

    info(message, meta) {
        this.logger.info(message, meta);
    }

    warn(message, meta) {
        this.logger.warn(message, meta);
    }

    error(message, meta) {
        this.logger.error(message, meta);
    }

    debug(message, meta) {
        this.logger.debug(message, meta);
    }

    log(level, message, meta) {
        this.logger.log(level, message, meta);
    }
}
