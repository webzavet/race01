import jwt from 'jsonwebtoken';
import config from '../config/Config.js';

export default class TokenManager {
    constructor() {
        if (!config) {
            throw new Error('TokenManager: secretKey is required');
        }
        this.secretKey = config.jwt.secretKey;
        this.expiresIn = config.jwt.ttl;
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
