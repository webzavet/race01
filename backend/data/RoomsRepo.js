export default class RoomsRepo {
    constructor(builder = null, counter = null) {
        this.builder = builder;
        this.counter = counter;
    }

    async insert({
         name,
         passHash,
         maxPlayers = 2,
         status = 'waiting',
         createdAt = new Date()
    }) {
        const room = {
            name: name,
            password_hash: passHash,
            max_players:  maxPlayers,
            status: status,
            created_at: createdAt
        };
        await this.builder.insert(room);
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
        return rows || null;
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

    filterName(name) {
        this.builder  = this.builder.where('name', name);
        this.counter  = this.counter.where('name', name);
        return this;
    }

    filterStatus(status) {
        this.builder  = this.builder.where('status', status);
        this.counter  = this.counter.where('status', status);
        return this;
    }

    async updateStatus(newStatus) {
        return this.builder.update({ status: newStatus });
    }
}