// backend/api/rest/handlers/auth.js
import AuthDomain from '../../modules/auth/AuthDomain.js';
import { parseRegister, parseLogin } from './requests.js';
import { renderTokenResponse } from './responses.js';
import config from "../../tools/config/Config.js";
import log from "../../tools/logger/Logger.js";

const authDomain = new AuthDomain(config);

/**
 * POST /auth/register
 */
export async function registerHandler(req, res, next) {
    try {
        const { username, password, password_confirmation } = parseRegister(req.body);

        const data = await authDomain.register(
            username,
            password,
            password_confirmation
        );

        const response = renderTokenResponse(username, data.token);

        log.info(`User ${username} registered successfully`, { user: username });
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
        const { username, password } = parseLogin(req.body);

        const data = await authDomain.login(username, password);

        const response = renderTokenResponse(username, data.token);

        log.info(`User ${username} logged in successfully`, { user: username });
        res.json(response);
    } catch (err) {
        next(err);
    }
}
