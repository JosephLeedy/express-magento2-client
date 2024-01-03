import {readFileSync} from 'node:fs'
import {createClient, RedisClientType, RedisFunctions, RedisModules, RedisScripts} from 'redis'

const redisKeyFile: Buffer | undefined = process.env.REDIS_TLS_KEY_PATH === undefined
    ? process.env.REDIS_TLS_KEY_PATH
    : readFileSync(process.env.REDIS_TLS_KEY_PATH)
const redisCertFile: Buffer | undefined = process.env.REDIS_TLS_CERTIFICATE_PATH === undefined
    ? process.env.REDIS_TLS_CERTIFICATE_PATH
    : readFileSync(process.env.REDIS_TLS_CERTIFICATE_PATH)
const redisCaFile: Buffer | undefined = process.env.REDIS_TLS_CERT_AUTHORITY_PATH === undefined
    ? process.env.REDIS_TLS_CERT_AUTHORITY_PATH
    : readFileSync(process.env.REDIS_TLS_CERT_AUTHORITY_PATH)
const redisClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts> = createClient({
        username: process.env.REDIS_USERNAME,
        password: process.env.REDIS_PASSWORD,
        database: parseInt(process.env.REDIS_DATABASE || '0', 10),
        socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379', 10),
            path: process.env.REDIS_SOCKET_PATH,
            tls: process.env.REDIS_USE_TLS !== undefined ? process.env.REDIS_USE_TLS === 'true' : false,
            key: redisKeyFile,
            cert: redisCertFile,
            ca: redisCaFile,
        },
    }).on('error', (error: string): void => {
        console.error('Redis encountered an error: %s', error)
    })

export default redisClient
