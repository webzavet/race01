import knex from 'knex';
import Config from '../../modules/config/config';

const config = Config.load('./config.yaml');
export const db = knex({
    client:  'mysql2',
    connection: config.database.url,
    pool: { min: 2, max: 10 },
});