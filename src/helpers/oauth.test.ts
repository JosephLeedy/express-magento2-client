import {jest} from '@jest/globals'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'

jest.unstable_mockModule('node:crypto', (): object => ({
    ...(jest.requireActual('node:crypto') as object),
    randomUUID: jest.fn((): string => '64760bfd-3b18-451f-b43b-a3edc4486567')
}))

await import('node:crypto')

const {buildOauthAuthorizationHeader} = await import('./oauth.js')

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
                const expectedHeader: string = 'OAuth oauth_consumer_key=hlxtlxx0h17jedm52rq2sm7722x4p1m8, '
                    + 'oauth_nonce=64760bfd3b18451fb43ba3edc4486567, '
                    + `oauth_signature=${oauthSignature}, `
                    + 'oauth_signature_method=HMAC-SHA256, '
                    + 'oauth_timestamp=1704322724, '
                    + 'oauth_token=94c4lo4teducsbxhtan5qsroaj3au8yo, '
                    + 'oauth_verifier=ugh0thz43kjdwr9ty4yilfsvy7ckloim, '
                    + 'oauth_version=1.0'
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
})
