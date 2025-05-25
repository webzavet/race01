import {database} from "../../data/sql/Database.js";
import PasswordHasher from '../../tools/password_hasher/PasswordHasher.js';
import TokenManager from '../../tools/tokens/TokenManager.js';
import {InvalidPasswordError, PasswordMismatchError, UserAlreadyExistsError, UserNotFoundError} from "./errors.js";
import config from "../../tools/config/Config.js";

export default class Auth {
    constructor() {
        this.db = database;
        this.tokenManager = new TokenManager();
    }

    async register(
        username,
        password_one,
        password_second,
        avatar = config.server.default.userAvatar
    ) {
        if (password_one !== password_second) {
            throw new PasswordMismatchError('Passwords do not match');
        }

        const existingUser = await this.db.users().filterUsername(username).get();
        if (existingUser) {
            throw new UserAlreadyExistsError('Username already exists');
        }

        const pasHash = await PasswordHasher.hashPassword(password_one);

        const newUser = {
            username: username,
            passHash: pasHash,
            avatar: avatar,
            createdAt: new Date(),
        };

        await this.db.users().insert(newUser);

        return {
            username: username,
            token: this.tokenManager.createToken(username)
        };
    }

    async login(
        username,
        password
    ) {
        const user = await this.db.users().filterUsername(username).get();
        if (!user) {
            throw new UserNotFoundError('User not found');
        }

        const isPasswordValid = await PasswordHasher.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            throw new InvalidPasswordError('Invalid password');
        }

        return {
            username: username,
            token: this.tokenManager.createToken(username)
        };
    }
}