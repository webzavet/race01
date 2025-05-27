import { v4 as uuidv4 } from 'uuid';

export default class PlayersRepo {
    constructor(builder = null, counter = null ) {
        this.builder = builder
        this.counter = counter
    }

    async insert({id = uuidv4(), username, room, createdAt = new Date() }) {
        const stmt = {
            id: id,
            username: username,
            room: room,
            created_at: createdAt
        };
        await this.builder.insert(stmt);
        return stmt;
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

    filterRoom(room) {
        this.builder  = this.builder.where('room', room);
        this.counter  = this.counter.where('room', room);
        return this;
    }

    filterUsername(username) {
        this.builder  = this.builder.where('username', username);
        this.counter  = this.counter.where('username', username);
        return this;
    }
};
