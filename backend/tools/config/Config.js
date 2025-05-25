import fs       from 'fs';
import path     from 'path';
import yaml     from 'js-yaml';

class Config {
    constructor(raw) {
        this.server = {
            host:  raw.server.host,
            port: raw.server.port,
            logging: {
                level:  raw.server.logging.level,
                format: raw.server.logging.format,
            },

            default : {
                userAvatar: raw.server.default.user_avatar,
            }
        };

        this.jwt = {
            secretKey: raw.jwt.token.secret_key,
            ttl: raw.jwt.token.ttl,
        };

        this.database = {
            sql: {
                host: raw.database.sql.host,
                port: raw.database.sql.port,
                user: raw.database.sql.user,
                password: raw.database.sql.password,
                name: raw.database.sql.name,
            },
            redis: {
                host: raw.database.redis.host,
                port: raw.database.redis.port,
                password: raw.database.redis.password,
            }
        };

        this.oauth = {
            google: {
                clientId:     raw.oauth.google.client_id,
                clientSecret: raw.oauth.google.client_secret,
                redirectUrl:  raw.oauth.google.redirect_url,
            }
        };

        this.aws = {
            region:          raw.aws.region,
            accessKeyId:     raw.aws.access_key_id,
            secretAccessKey: raw.aws.secret_access_key,
            bucketName:      raw.aws.bucket_name,
        };
    }

    /**
     * Download YAML config file and parse it into Config object
     * @param {string} filePath — Path to the YAML config file
     * @returns {Config}
     */
    static load(filePath) {
        const absPath = path.isAbsolute(filePath)
            ? filePath
            : path.resolve(process.cwd(), filePath);

        const fileContents = fs.readFileSync(absPath, 'utf8');
        const rawConfig    = yaml.load(fileContents);

        return new Config(rawConfig);
    }
}

const config = Config.load('./config.yaml');

export default config;
