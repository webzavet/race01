import { db } from './db.js';

export default class UsersDB {
    constructor(builder = null, counter = null) {
        this.builder = builder || db('users');
        this.counter = counter || db('users').count({ count: '*' });
    }

    static New() {
        return new UsersDB();
    }

    async insert({ id, username, email, avatar, created_at = new Date() }) {
        const user = { id, username, email, avatar, created_at };
        await db('users').insert(user);
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
        return this.builder;
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

    filterId(id) {
        this.builder  = this.builder.where('id', id);
        this.counter  = this.counter.where('id', id);
        return this;
    }

    filterUsername(username) {
        this.builder  = this.builder.where('username', username);
        this.counter  = this.counter.where('username', username);
        return this;
    }

    filterEmail(email) {
        this.builder  = this.builder.where('email', email);
        this.counter  = this.counter.where('email', email);
        return this;
    }

    // Транзакция — передаём функцию, внутри которой используем trx вместо db
    async transaction(fn) {
        return await db.transaction(async trx => {
            const repo = new UsersDB(trx('users'), trx('users').count({ count: '*' }));
            await fn(repo);
        });
    }
}
