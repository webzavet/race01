// backend/api/rest/requests/index.js

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
 * @returns {{ username: string, password: string, password_confirmation: string }}
 * @throws Error
 */
export function parseRegister(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new Error('Missing `data` object');
    }

    const { username, password, password_confirmation } = data;

    if (!username || !password || !password_confirmation) {
        throw new Error('Missing required registration fields');
    }

    return { username, password, password_confirmation };
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
 * @returns {{ username: string, password: string }}
 * @throws Error
 */
export function parseLogin(body) {
    const { data } = body || {};

    if (!data || typeof data !== 'object') {
        throw new Error('Missing `data` object');
    }

    const { username, password } = data;

    if (!username || !password) {
        throw new Error('Missing required login fields');
    }

    return { username, password };
}
