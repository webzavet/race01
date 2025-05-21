export class AppError extends Error {
    /**
     * @param {string} message
     * @param {string} code        // машинно-читаемый код
     * @param {number} status = 400  // HTTP-статус (для веб-слоя)
     * @param {Error} cause       // причина ошибки (если есть)
     */
    constructor(message, code, status = 400, cause= null) {
        super(message);
        this.code = code;
        this.status = status;
        if (cause) this.cause = cause;
    }
}

export class InternalError  extends AppError {
    constructor(msg = 'Internal error', cause = null) {
        super(msg, 'INTERNAL_ERROR', 500, cause);
    }
}
