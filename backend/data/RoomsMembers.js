import { db } from './db.js';

export default class RoomsMembers {
    constructor(builder = null, counter = null ) {
        this.builder = builder || db('rooms_members');
        this.counter = counter || db('rooms_members').count({ count: '*' });
    }

    New() {
        return new RoomsMembers();
    }

    async insert({username, roomId, createdAt = new Date() }) {
        const room = {username, roomId, createdAt };
        await db('rooms_members').insert(room);
        return room;
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

    filterRoomName(name) {
        this.builder  = this.builder.where('name', name);
        this.counter  = this.counter.where('name', name);
        return this;
    }

    filterUsername(username) {
        this.builder  = this.builder.where('username', username);
        this.counter  = this.counter.where('username', username);
        return this;
    }
};
