import config from '../../tools/config/Config.js';
import TokenManager from '../../tools/tokens/TokenManager.js';
import {AppError} from "../../tools/errors/AppError.js";

const tm = new TokenManager();


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
