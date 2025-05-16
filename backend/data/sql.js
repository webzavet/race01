import knex from 'knex';
import Config from '../tools/config/config.js';

const config = Config.load('./config.yaml');
export const db = knex({
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