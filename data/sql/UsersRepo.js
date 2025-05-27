import config from "../../tools/config/Config.js";

export default class UsersRepo {
    constructor(builder = null, counter = null) {
        this.builder = builder
        this.counter = counter
    }

    async insert({username, passHash, avatar = config.server.default.userAvatar, createdAt = new Date() }) {
        const user = {
            username: username,
            password_hash: passHash,
            avatar: avatar,
            created_at: createdAt
        };
        await this.builder.insert(user);
        return user;
    }

    async delete() {
        await this.builder.del();
    }

    async get() {
        const row = await this.builder.first();
        return row || null;
    }

    async select() {
        const rows = await this.builder;
        return this.builder || null;
    }

    async count() {
        const [{ count }] = await this.counter;
        return Number(count);
    }

    page(limit, offset) {
        this.builder  = this.builder.limit(limit).offset(offset);
        this.counter = this.counter.limit(limit).offset(offset);
        return this;
    }

    filterUsername(username) {
        this.builder  = this.builder.where('username', username);
        this.counter  = this.counter.where('username', username);
        return this;
    }
}
