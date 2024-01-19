export {};

declare global {
    namespace NodeJS {
        interface ProcessEnv {
            PORT: string
            FRONTEND_URL: string
            REDIS_HOST: string
            REDIS_PORT: string
            REDIS_SOCKET_PATH?: string
            REDIS_DATABASE: string
            REDIS_USERNAME?: string
            REDIS_PASSWORD?: string
            REDIS_USE_TLS: 'true' | 'false'
            REDIS_TLS_KEY_PATH?: string
            REDIS_TLS_CERTIFICATE_PATH?: string
            REDIS_TLS_CERT_AUTHORITY_PATH?: string
            MAGENTO_BASE_URL: string
        }
    }
}
