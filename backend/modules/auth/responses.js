// backend/api/rest/responses/index.js

/**
 * Формирует JSON:API-ответ с токеном
 * @param {string} username — идентификатор пользователя (id)
 * @param {string} token — строка токена
 * @returns {object} — JSON-совместимый объект ответа
 */
export function renderTokenResponse(username, token) {
    return {
        data: {
            username: username,
            token: token
        }
    };
}
