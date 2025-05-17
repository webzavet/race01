import jwt from 'jsonwebtoken';

export default class TokenManager {
    /**
     * @param {Object} options
     * @param {string} options.secretKey - sk
     * @param {string|number} options.expiresIn - ttl
     */
    constructor({ secretKey, expiresIn }) {
        if (!secretKey) {
            throw new Error('TokenManager: secretKey is required');
        }
        this.secretKey = secretKey;
        this.expiresIn = expiresIn;
    }

    /**
     * @param {string} username
     * @returns {string} token
     */
    createToken(username) {
        if (!username) {
            throw new Error('TokenManager.createToken: username is required');
        }
        const payload = { username };
        return jwt.sign(payload, this.secretKey, { expiresIn: this.expiresIn });
    }

    /**
     * @param {string} token
     * @returns {{ username: string }} username
     */
    verifyToken(token) {
        if (!token) {
            throw new Error('TokenManager.verifyToken: token is required');
        }
        try {
            const decoded = jwt.verify(token, this.secretKey);
            return { username: decoded.username };
        } catch (err) {
            throw new Error(`TokenManager.verifyToken: invalid token: ${err.message}`);
        }
    }
}
