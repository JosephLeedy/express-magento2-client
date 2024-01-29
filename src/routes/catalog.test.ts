import globalJest = globalThis.jest
import {jest} from '@jest/globals'
import request from 'supertest'
import type {Response as StResponse} from 'supertest'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'
import categoryData from '../../test/data/categories.json' assert {type: 'json'}
import productData from '../../test/data/products.json' assert {type: 'json'}

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
        get: jest.fn(),
        hGetAll: jest.fn(),
        set: jest.fn(),
    }
}))
jest.unstable_mockModule('../helpers/oauth.js', (): object => ({
    buildOauthAuthorizationHeader: jest.fn(),
    fetchAndStoreOauthToken: jest.fn()
}))

const {default: app, server} = await import('../main.js')
const {default: redisClient} = await import('../redis.js')

describe('Catalog Routes', (): void => {
    const originalProcessEnv: NodeJS.ProcessEnv = process.env

    beforeEach((): void => {
        (redisClient.hGetAll as jest.Mock)
            .mockImplementationOnce(
                (): Promise<OauthCredentials> => Promise.resolve({
                    oauth_consumer_key: 'nhk5l9w0v9l8ne0zif6y56qyr391dedb',
                    oauth_consumer_secret: 'e7x9hfv8cncjkjfufuzponwjhfca4alv',
                    oauth_verifier: '6qjlnsnucn8awvpdkog2ve84v17xbtq8',
                    store_base_url: 'https://magento.test'
                } as OauthCredentials)
            ).mockImplementationOnce(
                (): Promise<OauthToken> => Promise.resolve({
                    oauth_token: '1gm2vg3y3e8ar70xnnu040v14opshqww',
                    oauth_token_secret: 'azgvml20jlsqdruossa8kfd14lfmdyv1'
                } as OauthToken)
            )

        jest.spyOn(console, 'error').mockImplementation(jest.fn)

        process.env = {
            ...originalProcessEnv,
            MAGENTO_BASE_URL: 'https://magento.test'
        }
    })

    afterEach((): void => {
        process.env = originalProcessEnv

        jest.restoreAllMocks()
    })

    afterAll((): void => {
        server.close()
    })

    it('proxies a product request to the Magento product API successfully', (done: globalJest.DoneCallback): void => {
        expect.assertions(2)

        jest.spyOn(global, 'fetch').mockImplementation(
            (): Promise<Response> => Promise.resolve(
                {
                    ok: true,
                    status: 200,
                    json: (): Promise<typeof productData> => Promise.resolve(productData)
                } as Response
            )
        )

        request(app)
            .get('/catalog/products/searchCriteria[pageSize]=50&searchCriteria[currentPage]=5')
            .then((response: StResponse): void => {
                expect(response.statusCode).toEqual(200)
                expect(response.body).toEqual(productData)
            }).finally(done)
    })

    it(
        'proxies a categories request to the Magento categories API successfully',
        (done: globalJest.DoneCallback): void => {
            expect.assertions(2)

            jest.spyOn(global, 'fetch').mockImplementation(
                (): Promise<Response> => Promise.resolve(
                    {
                        ok: true,
                        status: 200,
                        json: (): Promise<typeof categoryData> => Promise.resolve(categoryData)
                    } as Response
                )
            )

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(200)
                    expect(response.body).toEqual(categoryData)
                }).finally(done)
        }
    )

    it(
        'returns an error from the Magento API if a proxied request fails',
        (done: globalJest.DoneCallback): void => {
            expect.assertions(2)

            jest.spyOn(global, 'fetch').mockImplementation(
                (): Promise<Response> => Promise.resolve(
                    {
                        ok: false,
                        status: 401,
                        statusText: 'Unauthorized',
                        json: (): Promise<object> => Promise.resolve({
                            message: 'A consumer having the specified key does not exist',
                        })
                    } as Response
                )
            )

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(401)
                    expect(response.body).toEqual({
                        message: 'A consumer having the specified key does not exist',
                    })
                }).finally(done)
        }
    )

    it(
        'returns an error if the OAuth credentials cannot be retrieved',
        (done: globalJest.DoneCallback): void => {
            (redisClient.hGetAll as jest.Mock)
                .mockReset()
                .mockImplementationOnce(
                    (): Promise<undefined> => Promise.resolve(undefined)
                )

            expect.assertions(2)

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(500)
                    expect(response.body).toEqual({
                        message: 'Could not get OAuth credentials. Please verify that the integration is set up '
                            + 'properly in Magento.'
                    })
                }).finally(done)
        }
    )

    it(
        'returns an error if the OAuth authentication token cannot be retrieved',
        (done: globalJest.DoneCallback): void => {
            (redisClient.hGetAll as jest.Mock)
                .mockReset()
                .mockImplementationOnce(
                    (): Promise<OauthCredentials> => Promise.resolve({
                        oauth_consumer_key: 'nhk5l9w0v9l8ne0zif6y56qyr391dedb',
                        oauth_consumer_secret: 'e7x9hfv8cncjkjfufuzponwjhfca4alv',
                        oauth_verifier: '6qjlnsnucn8awvpdkog2ve84v17xbtq8',
                        store_base_url: 'https://magento.test'
                    } as OauthCredentials)
                ).mockImplementationOnce(
                    (): Promise<undefined> => Promise.resolve(undefined)
                )

            expect.assertions(2)

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(500)
                    expect(response.body).toEqual({
                        message: 'Could not get OAuth access token. Please verify that the integration is set up '
                            + 'properly in Magento.'
                    })
                }).finally(done)
        }
    )

    it(
        'returns an error if an unknown error occurs while sending the request to the Magento API',
        (done: globalJest.DoneCallback): void => {
            expect.assertions(2)

            jest.spyOn(global, 'fetch').mockImplementation(
                (): Promise<Response> => Promise.reject(new TypeError('Network error'))
            )

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(500)
                    expect(response.body).toEqual({
                        message: 'An unexpected error was encountered while sending the API request to Magento.'
                    })
                }).finally(done)
        }
    )

    it(
        'returns an error if response from the Magento API cannot be parsed',
        (done: globalJest.DoneCallback): void => {
            expect.assertions(2)

            jest.spyOn(global, 'fetch').mockImplementation(
                (): Promise<Response> => Promise.resolve(
                    {
                        ok: false,
                        status: 500,
                        statusText: 'Internal Server Error',
                        json: (): Promise<object> => Promise.reject(new SyntaxError('Could not parse "<" as JSON'))
                    } as Response
                )
            )

            request(app)
                .get('/catalog/categories')
                .then((response: StResponse): void => {
                    expect(response.statusCode).toEqual(500)
                    expect(response.body).toEqual({
                        message: 'Could not parse response from Magento as JSON.'
                    })
                }).finally(done)
        }
    )

    it('returns cached results from a previous request', (done: globalJest.DoneCallback): void => {
        (redisClient.get as jest.Mock)
            .mockImplementationOnce(
                (): Promise<string> => Promise.resolve(
                    JSON.stringify(
                        {
                            status: 200,
                            json: productData
                        }
                    )
                )
            )

        expect.assertions(2)

        request(app)
            .get('/catalog/products/searchCriteria=')
            .then((response: StResponse): void => {
                expect(response.statusCode).toEqual(200)
                expect(response.body).toEqual(productData)
            }).finally(done)
    })
})
