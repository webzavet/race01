// database.js
import knex from 'knex';
import RoomsRepo   from './RoomsRepo.js';
import UsersRepo   from './UsersRepo.js';
import CardsRepo   from './CardsRepo.js';
import PlayersRepo from './PlayersRepo.js';
import config from '../../tools/config/Config.js';

export class Database {
    constructor() {
        this.knex = knex({
            client:  'mysql2',
            connection: {
                host:     config.database.sql.host,
                port:     config.database.sql.port,
                user:     config.database.sql.user,
                password: config.database.sql.password,
                database: config.database.sql.name,
                multipleStatements: true
            },
            pool: { min: 2, max: 10 },
        });
    }

    users(builder = this.knex('users')) {
        return new UsersRepo(builder, builder.clone().count({ count: '*' }));
    }

    rooms(builder = this.knex('rooms')) {
        return new RoomsRepo(builder, builder.clone().count({ count: '*' }));
    }

    cards(builder = this.knex('cards')) {
        return new CardsRepo(builder, builder.clone().count({ count: '*' }));
    }

    players(builder = this.knex('players')) {
        return new PlayersRepo(builder, builder.clone().count({ count: '*' }));
    }

    async transaction(fn) {
        return this.knex.transaction(async trx => {
            const dbCtx = {
                users:       this.users(trx('users')),
                rooms:       this.rooms(trx('rooms')),
                cards:       this.cards(trx('cards')),
                players: this.players(trx('players')),
            };
            return fn(dbCtx);
        });
    }

    async destroy() {
        await this.knex.destroy();
    }
}

// экспортируем синглтон — чтобы пул был один на приложение
export const database = new Database();
