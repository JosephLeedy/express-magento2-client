import {jest} from '@jest/globals'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'

jest.unstable_mockModule('node:crypto', (): object => ({
    ...(jest.requireActual('node:crypto') as object),
    randomUUID: jest.fn((): string => '64760bfd-3b18-451f-b43b-a3edc4486567')
}))
jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        hSet: jest.fn()
    }
}))

await import('node:crypto')

const {default: redisClient} = await import('../redis.js')
const {buildOauthAuthorizationHeader, fetchAndStoreOauthToken} = await import('./oauth.js')

describe('OAuth Helper', (): void => {
    describe('Build OAuth Authorization Header', (): void => {
        it.each(
            [
                {
                    requestType: 'a request token',
                    oauthSignature: '7f4G0yXcKwh2XRt9OQh7qDMN2H%2FBx8A%2BHv5bfJuFtWQ%3D',
                    requestMethod: 'POST',
                    requestUrl: 'https://magento.test/oauth/token/request'
                },
                {
                    requestType: 'an access token',
                    oauthSignature: '%2FgpXusvw5ctyMQldSyFZ7i1i%2FDu%2F6wRCC19B08JSNz8%3D',
                    requestMethod: 'POST',
                    requestUrl: 'https://magento.test/oauth/token/access'
                },
                {
                    requestType: 'a product search',
                    oauthSignature: 'Q3qnaprAhoppJjrWAtBRUHAsm8%2BF92ChhjjVmZRde38%3D',
                    requestMethod: 'GET',
                    requestUrl: 'https://magento.test/rest/V1/products/?searchCriteria[pageSize]=50'
                }
            ]
        )(
            'builds an OAuth authorization header for $requestType request',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({requestType, oauthSignature, requestMethod, requestUrl}): void => {
                jest.useFakeTimers({now: 1704322724000})

                const oauthCredentials: OauthCredentials = {
                    oauth_consumer_key: 'hlxtlxx0h17jedm52rq2sm7722x4p1m8',
                    oauth_consumer_secret: 'oeforph3omea4cmmpu59rpmrte3aoil0',
                    store_base_url: 'https://magento.test/',
                    oauth_verifier: 'ugh0thz43kjdwr9ty4yilfsvy7ckloim'
                }
                const oauthToken: OauthToken = {
                    oauth_token: '94c4lo4teducsbxhtan5qsroaj3au8yo',
                    oauth_token_secret: '82puk5fh3ha45er3dfvpi6r04nrpulee'
                }
                const searchParameters: string = Array.from(new URL(requestUrl).searchParams.entries())
                    .map(([key, value]): string => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
                    .join(', ')
                const expectedHeader: string = 'OAuth oauth_consumer_key=hlxtlxx0h17jedm52rq2sm7722x4p1m8, '
                    + 'oauth_nonce=64760bfd3b18451fb43ba3edc4486567, '
                    + `oauth_signature=${oauthSignature}, `
                    + 'oauth_signature_method=HMAC-SHA256, '
                    + 'oauth_timestamp=1704322724, '
                    + 'oauth_token=94c4lo4teducsbxhtan5qsroaj3au8yo, '
                    + 'oauth_verifier=ugh0thz43kjdwr9ty4yilfsvy7ckloim, '
                    + 'oauth_version=1.0'
                    + (searchParameters.length > 0 ? `, ${searchParameters}` : '')
                const actualHeader: string = buildOauthAuthorizationHeader(
                    requestMethod,
                    oauthCredentials,
                    requestUrl,
                    oauthToken
                )

                expect(actualHeader).toEqual(expectedHeader)

                jest.useRealTimers()
            }
        )
    })

    describe('Fetch and Store OAuth Token', (): void => {
        afterEach((): void => {
            jest.restoreAllMocks()
        })

        it.each(
            [
                {
                    tokenType: 'a request token',
                    requestUrl: 'https://magento.test/oauth/token/request',
                    requestToken: null,
                    redisSubKey: 'REQUEST_TOKEN'
                },
                {
                    tokenType: 'an api token',
                    requestUrl: 'https://magento.test/oauth/token/access',
                    requestToken: {
                        oauth_token: 'yw5ae9f3ptz9u9qkuuyex183idqfzhxy',
                        oauth_token_secret: 'ltd3zsqu6s4oiprzjz3syxb2u62wtahx'
                    },
                    redisSubKey: 'API_TOKEN'
                }
            ]
        )(
            'fetches a $tokenType token from the Magento API and stores it in Redis',
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            async ({tokenType, requestUrl, requestToken, redisSubKey}): Promise<void> => {
                const fetchSpy: jest.SpiedFunction<typeof fetch> = jest.spyOn(global, 'fetch')
                    .mockImplementation(
                        (): Promise<Response> => Promise.resolve(
                            {
                                ok: true,
                                status: 200,
                                text: (): Promise<string> => Promise.resolve(
                                    'oauth_token=7ol0bz55k80d3z499nr10c3at9wprrkc'
                                    + '&oauth_token_secret=v768p9ivf0h27o9x54n4v2xvs5ipkq8w'
                                )
                            } as Response
                        )
                    )
                const oauthCredentials: OauthCredentials = {
                    oauth_consumer_key: 'ivj07l9ik7gpyooyrolunyhusuldkbxw',
                    oauth_consumer_secret: 'oeforph3omea4cmmpu59rpmrte3aoil0',
                    store_base_url: 'https://magento.test/',
                    oauth_verifier: 'v768p9ivf0h27o9x54n4v2xvs5ipkq8w'
                }
                const expectedFetchOptions: RequestInit = {
                    method: 'POST',
                    headers: {
                        Authorization: buildOauthAuthorizationHeader('POST', oauthCredentials, requestUrl, requestToken)
                    }
                }
                const expectedOauthToken: OauthToken = {
                    oauth_token: '7ol0bz55k80d3z499nr10c3at9wprrkc',
                    oauth_token_secret: 'v768p9ivf0h27o9x54n4v2xvs5ipkq8w'
                }
                const actualOauthToken: OauthToken | null =
                    await fetchAndStoreOauthToken(oauthCredentials, requestToken)

                expect(actualOauthToken).toEqual(expectedOauthToken)
                expect(fetchSpy).toBeCalledWith(requestUrl, expectedFetchOptions)
                expect(redisClient.hSet).toBeCalledWith(`PRODUCT_VIEWER:OAUTH:${redisSubKey}`, expectedOauthToken)
            }
        )

        it('logs an error to the console if the token request fails', async (): Promise<void> => {
            jest.spyOn(global, 'fetch').mockImplementation(
                (): Promise<Response> => Promise.resolve(
                    {
                        ok: false,
                        status: 401,
                        statusText: 'Not Authorized',
                        text: (): Promise<string> => Promise.resolve(
                            'oauth_problem=The%20signature%20is%20invalid.%20Verify%20and%20try%20again.'
                        )
                    } as Response
                )
            )

            const consoleErrorSpy = jest.spyOn(console, 'error')
                .mockImplementation(jest.fn)
            const oauthCredentials: OauthCredentials = {
                oauth_consumer_key: 'ivj07l9ik7gpyooyrolunyhusuldkbxw',
                oauth_consumer_secret: 'oeforph3omea4cmmpu59rpmrte3aoil0',
                store_base_url: 'https://magento.test/',
                oauth_verifier: 'v768p9ivf0h27o9x54n4v2xvs5ipkq8w'
            }
            const result: OauthToken | null = await fetchAndStoreOauthToken(oauthCredentials)

            expect(result).toBeNull()
            expect(consoleErrorSpy).toBeCalledWith(
                '\nCould not get %s token from Magento API. HTTP Status: %i %s. Error: %s\n',
                'request',
                401,
                'Not Authorized',
                'The signature is invalid. Verify and try again.'
            )
        })
    })
})
