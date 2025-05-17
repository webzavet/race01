import UsersDB from '../../data/UsersDB.js';
import PasswordHasher from './PasswordHasher.js';
import TokenManager from '../../tools/tokens/TokenManager.js';

export default class AuthDomain {
    constructor(cfg) {
        this.db = new UsersDB;
        this.tokenManager = new TokenManager({
            secretKey: cfg.secretKey,
            expiresIn: cfg.expiresIn,
        });
    }

    async register(
        username,
        password_one,
        password_second,
        avatar
    ) {
        if (password_one !== password_second) {
            throw new Error('Passwords do not match');
        }

        const existingUser = await this.db.New().filterUsername(username).get();

        if (existingUser) {
            throw new Error('Username already exists');
        }

        const pasHash = await PasswordHasher.hashPassword(password_one);

        const newUser = {
            username: username,
            password_hash: pasHash,
            avatar: avatar,
            created_at: new Date(),
        };

        await this.db.New().insert(newUser);

        return {
            username: username,
            token: this.tokenManager.createToken(username)
        };
    }

    async login(
        username,
        password
    ) {
        const user = await this.db.New().filterUsername(username).get();

        if (!user) {
            throw new Error('User not found');
        }

        const isPasswordValid = await  PasswordHasher.verifyPassword(password, user.password_hash);

        if (!isPasswordValid) {
            throw new Error('Invalid password');
        }

        return {
            username: username,
            token: this.tokenManager.createToken(username)
        };
    }
}