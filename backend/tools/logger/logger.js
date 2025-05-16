import { createLogger, format, transports } from 'winston';

export default function buildLogger({ level = 'info', json = false } = {}) {
    const loggerFormats = [
        format.timestamp(),
        json ? format.json() : format.colorize({ all: true }),
        json ? format.json() : format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
            return `[${timestamp}] [${level}] ${message} ${metaStr}`;
        }),
    ];

    return createLogger({
        level,
        format: format.combine(...loggerFormats),
        transports: [
            new transports.Console(),
            // new transports.File({ filename: 'app.log' }),  // if needed, uncomment to log to a file
        ],
    });
}
