// backend/api/rest/middleware/auth.js
import Config from '../../tools/config/Config.js';
import TokenManager from '../../tools/tokens/TokenManager.js'; // или ваш путь

// Инициализируем один раз при импорте
const cfg = Config.load('./config.yaml');
const tm = new TokenManager({
    secretKey: cfg.jwt.secretKey,
    expiresIn: cfg.jwt.expiresIn,
});

/**
 * Express-middleware для аутентификации по JWT.
 * При успехе — в req.user кладется payload токена.
 * При провале — отправляется 401.
 */
export function authMiddleware(req, res, next) {
    try {
        const auth = req.headers.authorization || '';
        const [scheme, token] = auth.split(' ');
        if (scheme !== 'Bearer' || !token) {
            return res.status(401).json({ error: 'Token not found' });
        }

        const payload = tm.verifyToken(token);
        // payload должен содержать как минимум username и role
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: err.message });
    }
}
