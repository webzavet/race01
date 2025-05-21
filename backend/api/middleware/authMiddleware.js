import config from '../../tools/config/Config.js';
import TokenManager from '../../tools/tokens/TokenManager.js'; // или ваш путь
import {AppError} from "../../tools/errors/AppError.js";

// Инициализируем один раз при импорте
const tm = new TokenManager();

/**
 * Express-middleware для аутентификации по JWT.
 * При успехе — в req.user кладется payload токена.
 * При провале — отправляется 401.
 */

export class TokenUnauthorizedError extends AppError {
    constructor(msg = 'Token not found') {
        super(msg, 'TOKEN_UNAUTHORIZED', 401);
    }
}

export function authMiddleware(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        const [scheme, token] = auth.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ error: 'Token not found' });
        }

        req.user = tm.verifyToken(token);
        next();
    } catch (err) {
        throw new TokenUnauthorizedError('Token is invalid');
    }
}
