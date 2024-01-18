import {jest} from '@jest/globals'
import type {Response} from 'supertest'
import request from 'supertest'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
        hSet: jest.fn(),
        hGetAll: jest.fn((): Promise<OauthCredentials> => Promise.resolve({
            oauth_consumer_key: 'ytw52n5fd90ufca3qyvj3lp1ox17eafi',
            oauth_consumer_secret: 'cgo2hb82bwcu2421gejc34mxf48hc4l7',
            store_base_url: 'https://magento.test/',
            oauth_verifier: 'uisv74f8joerz3gvo6ufkln84rbxksfp'
        }))
    }
}))
jest.unstable_mockModule('../helpers/oauth.js', (): object => ({
    buildOauthAuthorizationHeader: jest.fn((): string => ''),
    fetchAndStoreOauthToken: jest.fn(
        (_oauthCredentials: OauthCredentials, requestToken: OauthToken | null = null): Promise<OauthToken> => {
            let oauthToken: OauthToken

            if (requestToken === null) {
                oauthToken = {
                    oauth_token_secret: '4pwzpm7bu2ul71np4xitwro8jjbexpm1',
                    oauth_token: 'kxep2f77ecy66oc1s7ex8c81gvz6j7ci'
                }
            } else {
                oauthToken = {
                    oauth_token_secret: 'b5p8169tc0z8z8v1z9v7riw9hhv6kise',
                    oauth_token: 'af4ppibobk6ctso260ax569hbbrnirov'
                }
            }

            return Promise.resolve(oauthToken)
        }
    )
}))

const {default: redisClient} = await import('../redis.js')
const {default: app, server} = await import('../main.js')
const {fetchAndStoreOauthToken} = await import('../helpers/oauth.js')

type OauthIdentityParameters = {
    oauth_consumer_key: string
    success_call_back: string
}

describe('OAuth Routes', (): void => {
    afterAll((): void => {
        server.close()
    })

    afterEach((): void => {
        jest.clearAllMocks()
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
                        expect(redisClient.hSet).toBeCalledWith('OAUTH:CREDENTIALS', oauthCredentials)
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

    describe('OAuth Identity Route', (): void => {
        const queryParameters: OauthIdentityParameters = {
            oauth_consumer_key: 'ytw52n5fd90ufca3qyvj3lp1ox17eafi',
            success_call_back: 'https://magento.testt/admin/admin/integration/loginSuccessCallback/'
                + 'key/c45s0rm5n16sv069jziltx2rxt8er0jw4brwhv24062uizi57undtf1oca6h9y7s/'
        }

        it('fetches and stores OAuth request and access tokens', (done: globalThis.jest.DoneCallback): void => {
            expect.assertions(4)

            request(app)
                .get('/oauth/identity')
                .query(queryParameters)
                .then((response: Response): void => {
                    expect(redisClient.hGetAll).toHaveBeenCalled()
                    expect(response.statusCode).toEqual(302)
                    expect(response.redirect).toBeTruthy()
                    expect(response.headers.location).toEqual(queryParameters.success_call_back)
                })
                .finally(done)
        })

        it(
            'returns an error message and status if a query parameter is missing from the request',
            (done: globalThis.jest.DoneCallback): void => {
                expect.assertions(3)

                const badQueryParameters: Partial<OauthIdentityParameters> = structuredClone(queryParameters)

                delete badQueryParameters.success_call_back

                request(app)
                    .get('/oauth/identity')
                    .query(badQueryParameters)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(400)
                        expect(response.text).toEqual('A required field is missing from the request')
                        expect(redisClient.hGetAll).not.toHaveBeenCalled()
                    })
                    .finally(done)
            }
        )

        it(
            'returns an error message and status if the OAuth callback endpoint was not previously called',
            (done: globalThis.jest.DoneCallback): void => {
                (redisClient.hGetAll as jest.Mock).mockImplementationOnce(
                    (): Promise<OauthCredentials> => Promise.resolve({} as OauthCredentials)
                )

                expect.assertions(2)

                request(app)
                    .get('/oauth/identity')
                    .query(queryParameters)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(400)
                        expect(response.text).toEqual('OAuth callback was not previously called')
                    })
                    .finally(done)
            }
        )

        it(
            'returns an error message and status if the received OAuth Consumer Key does not match the stored '
                + 'Consumer Key',
            (done: globalThis.jest.DoneCallback): void => {
                (redisClient.hGetAll as jest.Mock).mockImplementationOnce(
                    (): Promise<OauthCredentials> => Promise.resolve({
                        oauth_consumer_key: 'od3v7fgln7bagz5tdkfe5w4v18hf9llu',
                        oauth_consumer_secret: '0d0af6r6cmfjctvvtoddxn27vpc9ki8n',
                        store_base_url: 'https://magento.test/',
                        oauth_verifier: 'uisv74f8joerz3gvo6ufkln84rbxksfp'
                    })
                )

                expect.assertions(2)

                request(app)
                    .get('/oauth/identity')
                    .query(queryParameters)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(400)
                        expect(response.text).toEqual('Invalid OAuth consumer key')
                    })
                    .finally(done)
            }
        )

        it(
            'returns an error message and status if the request token cannot be fetched and stored',
            (done: globalThis.jest.DoneCallback): void => {
                (fetchAndStoreOauthToken as jest.Mock).mockImplementationOnce(
                    (): Promise<OauthToken | null> => Promise.resolve(null)
                )

                expect.assertions(2)

                request(app)
                    .get('/oauth/identity')
                    .query(queryParameters)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(500)
                        expect(response.text).toEqual('Could not fetch or store request token from Magento API')
                    })
                    .finally(done)
            }
        )

        it(
            'returns an error message and status if the API token cannot be fetched and stored',
            (done: globalThis.jest.DoneCallback): void => {
                (fetchAndStoreOauthToken as jest.Mock)
                    .mockImplementationOnce(
                        (): Promise<OauthToken | null> => Promise.resolve({
                            oauth_token_secret: '4pwzpm7bu2ul71np4xitwro8jjbexpm1',
                            oauth_token: 'kxep2f77ecy66oc1s7ex8c81gvz6j7ci'
                        })
                    ).mockImplementationOnce((): Promise<OauthToken | null> => Promise.resolve(null))

                expect.assertions(2)

                request(app)
                    .get('/oauth/identity')
                    .query(queryParameters)
                    .then((response: Response): void => {
                        expect(response.statusCode).toEqual(500)
                        expect(response.text).toEqual('Could not fetch or store API token from Magento API')
                    })
                    .finally(done)
            }
        )
    })
})
