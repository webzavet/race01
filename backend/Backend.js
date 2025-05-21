import Config from './tools/config/Config.js';
import log from './tools/logger/Logger.js';
import Migrator from './tools/migrator/Migrator.js';
import { Api } from './api/Api.js';
import config from './tools/config/Config.js';

export default class Backend {
    /**
     * Starting the backend server.
     * @param {string[]} args — the arg from command line (process.argv.slice(2))
     * @returns {Promise<boolean>}
     */
    static async Run(args = []) {
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

            case 'service run': {
                log.info('Starting HTTP server...');
                const api = new Api(config, log);
                api.start();
                log.info(`Server started on ${config.server.host}:${config.server.port}`);
                log.info('Press Ctrl+C to stop the server.');

                // Ловим Ctrl+C
                process.on('SIGINT', async () => {
                    log.info('SIGINT received, shutting down…');
                    try {
                        await api.stop();
                        log.info('Server stopped gracefully');
                        process.exit(0);
                    } catch (err) {
                        log.error('Error during shutdown:', err);
                        process.exit(1);
                    }
                });

                await new Promise(() => {}); // вечно «висим» до Ctrl+C
                return true;
            }

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
