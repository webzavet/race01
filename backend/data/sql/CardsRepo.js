export default class CardsRepo {
    constructor(builder = null, counter = null) {
        this.builder = builder
        this.counter = counter
    }

    async insert({
        id,
        name,
        icon = null,
        descr,
        attack,
        defence,
        cost,
        attribute,
        createdAt = new Date(),
    }) {
        const card = {
            id:         id,
            name:       name,
            icon:       icon,
            descr:      descr,
            attack:     attack,
            defence:    defence,
            cost:       cost,
            attribute:  attribute,
            created_at: createdAt,
        };
        await this.builder.insert(card);
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

    filterAttack(attack) {
        this.builder = this.builder.where('attack', attack);
        this.counter = this.counter.where('attack', attack);
        return this;
    }

    filterDefence(defence) {
        this.builder = this.builder.where('defence', defence);
        this.counter = this.counter.where('defence', defence);
        return this;
    }

    filterById(id) {
        this.builder = this.builder.where('id', id);
        this.counter = this.counter.where('id', id);
        return this;
    }
}
