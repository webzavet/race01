// backend/api/rest/handlers/auth.js
import AuthDomain from '../../modules/auth/AuthDomain.js';
import { parseRegister, parseLogin } from './requests.js';
import { renderTokenResponse } from './responses.js';

const authDomain = new AuthDomain({
    secretKey: process.env.JWT_SECRET || 'default',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
});

/**
 * POST /auth/register
 */
export async function registerHandler(req, res) {
    try {
        // Парсим и валидируем JSON:API-запрос
        const { username, password, password_confirmation } = parseRegister(req.body);

        // Вызываем доменную логику регистрации
        const token = await authDomain.register(
            username,
            password,
            password_confirmation
        );

        // Формируем ответ и отправляем
        const response = renderTokenResponse(username, token);
        res.status(201).json(response);
    } catch (err) {
        res.status(400).json({ errors: [{ detail: err.message }] });
    }
}

/**
 * POST /auth/login
 */
export async function loginHandler(req, res) {
    try {
        // Парсим и валидируем JSON:API-запрос
        const { username, password } = parseLogin(req.body);

        // Вызываем доменную логику логина
        const token = await authDomain.login(username, password);

        // Формируем ответ и отправляем
        const response = renderTokenResponse(username, token);
        res.json(response);
    } catch (err) {
        const status = err.message === 'Invalid password' || err.message === 'User not found' ? 401 : 400;
        res.status(status).json({ errors: [{ detail: err.message }] });
    }
}
