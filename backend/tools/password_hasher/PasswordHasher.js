import bcrypt from 'bcrypt';

export default class PasswordHasher {
    /**
     * Хеширует пароль с помощью bcrypt и возвращает готовый хеш,
     * включающий соль и cost-фактор.
     * @param {string} password — пароль пользователя
     * @returns {Promise<string>} — строка-хеш, готовая к сохранению в БД
     */
    static async hashPassword(password) {
        const saltRounds = 12; // можно настроить для баланса безопасности и производительности
        const hash = await bcrypt.hash(password, saltRounds);
        return hash;
    }

    /**
     * Проверяет соответствие пароля и сохранённого хеша.
     * @param {string} password — введённый пароль пользователя
     * @param {string} hash — сохранённый хеш из БД
     * @returns {Promise<boolean>} — true, если пароль совпадает
     */
    static async verifyPassword(password, hash) {
        return bcrypt.compare(password, hash);
    }
}