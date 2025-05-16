import Config from './tools/config/config.js';
import buildLogger from './tools/logger/logger.js';
import Migrator from './tools/migrator/migrator.js';

export default class Backend {
    /**
     * Starting the backend server.
     * @param {string[]} args — the arg from command line (process.argv.slice(2))
     * @returns {Promise<boolean>}
     */
    static async Run(args = []) {
        const cfg = Config.load('./config.yaml');

        const log = buildLogger({
            level: cfg.server.logging.level,
            json: cfg.server.logging.format === 'json'
        });

        const [command, subcommand] = args; // e.g. ['service','run'] or ['migrate','up']

        switch (`${command} ${subcommand || ''}`.trim()) {
            case 'migrate up':
                log.info('Starting migrations: up');
                await Migrator.up();
                log.info('Migrations up completed.');
                break;

            case 'migrate down':
                log.info('Starting migrations: down');
                await Migrator.down();
                log.info('Migrations down completed.');
                break;

            case 'service run':
                log.info('Starting HTTP server...');
                log.info(`Server started on ${cfg.server.host}:${cfg.server.port}`);
                log.info('Press Ctrl+C to stop the server.');
                break;

            default:
                log.error(`Unknown command: ${args.join(' ')}`);
                log.error(
                    `Usage:
                      \t node index.js service run \n
                      \t node index.js migrate up \n
                      \t node index.js migrate down \n`
                );
                return false;
        }

        return true;
    }
}
