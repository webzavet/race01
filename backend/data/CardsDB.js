import { db } from './db.js';

export default class CardsDB {
    constructor(builder = null, counter = null) {
        this.builder = builder || db('cards');
        this.counter = counter || db('cards').count({ count: '*' });
    }

    static New() {
        return new CardsDB();
    }

    async insert({
        id,
        name,
        icon      = null,
        descr,
        damage,
        defence,
        attribute,
        cost,
        created_at = new Date(),
    }) {
        const card = { id, name, icon, descr, damage, defence, attribute, cost, created_at };
        await db('cards').insert(card);
        return card;
    }

    async update(data) {
        await this.builder.update(data);
    }

    async delete() {
        await this.builder.del();
    }

    async get() {
        const row = await this.builder.first();
        return row || null;
    }

    async select() {
        return this.builder;
    }

    async count() {
        const [{ count }] = await this.counter;
        return Number(count);
    }

    page(limit, offset) {
        this.builder  = this.builder.limit(limit).offset(offset);
        this.counter  = this.counter.limit(limit).offset(offset);
        return this;
    }

    filterId(id) {
        this.builder = this.builder.where('id', id);
        this.counter = this.counter.where('id', id);
        return this;
    }

    filterName(name) {
        this.builder = this.builder.where('name', name);
        this.counter = this.counter.where('name', name);
        return this;
    }

    filterAttribute(attribute) {
        this.builder = this.builder.where('attribute', attribute);
        this.counter = this.counter.where('attribute', attribute);
        return this;
    }

    filterCost(cost) {
        this.builder = this.builder.where('cost', cost);
        this.counter = this.counter.where('cost', cost);
        return this;
    }

    filterCostBetween(min, max) {
        this.builder = this.builder.whereBetween('cost', [min, max]);
        this.counter = this.counter.whereBetween('cost', [min, max]);
        return this;
    }

    // Транзакция: fn получает новый repo, внутри которого все запросы в рамках одного trx
    async transaction(fn) {
        return db.transaction(async trx => {
            const repo = new CardsDB(
                trx('cards'),
                trx('cards').count({ count: '*' })
            );
            await fn(repo);
        });
    }
}
