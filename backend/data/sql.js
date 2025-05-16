import knex from 'knex';
import Config from '../tools/config/config.js';

const config = Config.load('./config.yaml');
export const db = knex({
    client:  'mysql2',
    connection: config.database.url,
    pool: { min: 2, max: 10 },
});