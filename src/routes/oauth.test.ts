import {jest} from '@jest/globals'
import type {Response} from 'supertest'
import request from 'supertest'
import type {OauthCredentials} from '../types/Oauth.js'

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
        hSet: jest.fn()
    }
}))

const {default: redisClient} = await import('../redis.js')
const {default: app, server} = await import('../main.js')

describe('OAuth Routes', (): void => {
    afterAll((): void => {
        server.close()
    })

    afterEach((): void => {
        jest.resetAllMocks()
    })

    describe('OAuth Callback Route', (): void => {
        const originalProcessEnv: NodeJS.ProcessEnv = process.env
        const oauthCredentials: OauthCredentials = {
            oauth_consumer_key: 'ytw52n5fd90ufca3qyvj3lp1ox17eafi',
            oauth_consumer_secret: 'cgo2hb82bwcu2421gejc34mxf48hc4l7',
            store_base_url: 'https://magento.test/',
            oauth_verifier: 'uisv74f8joerz3gvo6ufkln84rbxksfp'
        }

        beforeEach((): void => {
            jest.resetModules()

            process.env = {
                ...originalProcessEnv,
                MAGENTO_BASE_URL: 'https://magento.test'
            }
        })

        afterEach((): void => {
            process.env = originalProcessEnv
        })

        it(
            'receives the OAuth credentials, stores them, and returns a success status',
            (done: globalThis.jest.DoneCallback): void => {
                expect.assertions(2)

                request(app)
                    .post('/oauth/callback')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(oauthCredentials)
                    .then((response: Response): void => {
                        expect(redisClient.hSet).toBeCalledWith('PRODUCT_VIEWER:OAUTH:CREDENTIALS', oauthCredentials)
                        expect(response.statusCode).toEqual(200)
                    })
                    .finally(done)
            }
        )

        it(
            'returns an error message and status if a field is missing from the request body',
            (done: globalThis.jest.DoneCallback): void => {
                expect.assertions(3)

                const badOauthCredentials: Partial<OauthCredentials> = structuredClone(oauthCredentials)

                delete badOauthCredentials.oauth_consumer_key

                request(app)
                    .post('/oauth/callback')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(badOauthCredentials)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(400)
                        expect(response.text).toEqual('A required field is missing from the request body')
                        expect(redisClient.hSet).not.toHaveBeenCalled()
                    })
                    .finally(done)

            }
        )

        it(
            'returns an error message and status the received store URL does not match the configured store URL',
            (done: globalThis.jest.DoneCallback): void => {
                expect.assertions(3)

                const invalidOauthCredentials: OauthCredentials = structuredClone(oauthCredentials)

                invalidOauthCredentials.store_base_url = 'https://invalid.test/'

                request(app)
                    .post('/oauth/callback')
                    .set('Content-Type', 'application/x-www-form-urlencoded')
                    .send(invalidOauthCredentials)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(400)
                        expect(response.text).toEqual('Invalid store base URL')
                        expect(redisClient.hSet).not.toHaveBeenCalled()
                    })
                    .finally(done)
            }
        )
    })
})
