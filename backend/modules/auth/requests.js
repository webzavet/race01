// backend/api/rest/requests/index.js

import {BadRequestError} from "../../tools/errors/AppError.js";

/**
 * Парсит и валидирует тело запроса на регистрацию
 * Ожидаемый формат:
 * {
 *   data: {
 *     username: string,
 *     password: string,
 *     password_confirmation: string
 *   }
 * }
 * @param {object} body — req.body
 * @returns {{id, password, password_confirmation}}
 * @throws Error
 */
export function parseRegister(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { id, type, attributes } = data;
    if (!id || !type || !attributes) {
        throw new BadRequestError('Missing required registration fields');
    }

    if (type !== 'register') {
        throw new BadRequestError('Invalid type');
    }

    const { password, password_confirmation } = attributes;
    if (!password || !password_confirmation) {
        throw new BadRequestError('Missing required registration fields');
    }


    return { username: id, password, password_confirmation };
}

/**
 * Парсит и валидирует тело запроса на логин
 * Ожидаемый формат:
 * {
 *   data: {
 *     username: string,
 *     password: string
 *   }
 * }
 * @param {object} body — req.body
 * @returns {{id, password}}
 * @throws Error
 */
export function parseLogin(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new BadRequestError('Missing `data` object');
    }

    const { id, type, attributes } = data;
    if (!id || !type || !attributes) {
        throw new BadRequestError('Missing required login fields');
    }

    if (type !== 'login') {
        throw new BadRequestError('Invalid type');
    }

    const { password } = attributes;
    if (!password) {
        throw new BadRequestError('Missing required login fields');
    }

    return { username: id, password };
}
