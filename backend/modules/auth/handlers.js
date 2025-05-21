// backend/api/rest/handlers/auth.js
import AuthDomain from '../../modules/auth/AuthDomain.js';
import { parseRegister, parseLogin } from './requests.js';
import { renderTokenResponse } from './responses.js';
import config from "../../tools/config/Config.js";

const authDomain = new AuthDomain(config);

/**
 * POST /auth/register
 */
export async function registerHandler(req, res, next) {
    try {
        // Парсим и валидируем JSON:API-запрос
        const { username, password, password_confirmation } = parseRegister(req.body);

        // Вызываем доменную логику регистрации
        const data = await authDomain.register(
            username,
            password,
            password_confirmation
        );

        // Формируем ответ и отправляем
        const response = renderTokenResponse(username, data.token);
        res.status(201).json(response);
    } catch (err) {
        next(err);
    }
}

/**
 * POST /auth/login
 */
export async function loginHandler(req, res, next) {
    try {
        // Парсим и валидируем JSON:API-запрос
        const { username, password } = parseLogin(req.body);

        // Вызываем доменную логику логина
        const data = await authDomain.login(username, password);

        // Формируем ответ и отправляем
        const response = renderTokenResponse(username, data.token);
        res.json(response);
    } catch (err) {
        next(err);
    }
}
