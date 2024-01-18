import redisClient from '../redis.js'
import type {OauthCredentials, OauthRequestParameters, OauthToken} from '../types/Oauth.js'

let crypto: typeof import('node:crypto')

try {
    crypto = await import('node:crypto')
} catch (_error: unknown) {
    console.error('Crypto support is disabled')
}

export function buildOauthAuthorizationHeader(
    httpMethod: string,
    oauthCredentials: OauthCredentials,
    requestUrl: string,
    requestToken: OauthToken | null = null
): string {
    const requestParameters: OauthRequestParameters = {
        oauth_consumer_key: oauthCredentials.oauth_consumer_key,
        oauth_nonce: crypto.randomUUID().replace(/-/g, ''),
        oauth_signature_method: 'HMAC-SHA256',
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(10),
        oauth_token: requestToken?.oauth_token ?? null,
        oauth_verifier: requestToken !== null ? oauthCredentials.oauth_verifier : null,
        oauth_version: '1.0'
    }
    const url: URL = new URL(requestUrl)
    const parameters: string[] = (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(requestParameters).filter(([_key, value]): boolean => value !== null) as [string, string][]
        ).concat(Array.from(url.searchParams.entries()))
        .sort(
            (parameterA: [string, string], parameterB: [string, string]): number => {
                return parameterA[0] < parameterB[0] ? -1 : 1
            }
        ).map(([key, value]): string => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    const signature: string = `${httpMethod.toUpperCase()}&`
        + encodeURIComponent(`${url.protocol}//${url.host}${url.pathname}`) + '&'
        + encodeURIComponent(parameters.join('&'))
    const hashedSignature = crypto.createHmac(
            'sha256',
            encodeURIComponent(oauthCredentials.oauth_consumer_secret) + '&'
                + encodeURIComponent(requestToken?.oauth_token_secret ?? '')
        ).update(signature, 'binary')
        .digest()
        .toString('base64')

    parameters.splice(
        parameters.findIndex((value: string): boolean => value.startsWith('oauth_signature_method')),
        0,
        `oauth_signature=${encodeURIComponent(hashedSignature)}`
    )

    return `OAuth ${parameters.join(', ')}`
}

export async function fetchAndStoreOauthToken(
    oauthCredentials: OauthCredentials,
    requestToken: OauthToken | null = null
): Promise<OauthToken | null> {
    const requestUrl: string = oauthCredentials.store_base_url
        + (requestToken === null ? 'oauth/token/request' : 'oauth/token/access')
    const authorizationHeader: string = buildOauthAuthorizationHeader(
        'POST',
        oauthCredentials,
        requestUrl,
        requestToken
    )
    const redisSubKey: string = requestToken === null ? 'REQUEST_TOKEN' : 'API_TOKEN'
    let response: Response
    let responseText: string
    let responseTextParameters: URLSearchParams
    let oauthToken: OauthToken | null = null

    try {
        response = await fetch(
            requestUrl,
            {
                method: 'POST',
                headers: {
                    Authorization: authorizationHeader
                }
            }
        )
        responseText = await response.text()
        responseTextParameters = new URLSearchParams(responseText)

        if (!response.ok) {
            console.error(
                `\nCould not get %s token from Magento API. HTTP Status: %i %s. Error: %s\n`,
                requestToken === null ? 'request' : 'api',
                response.status,
                response.statusText,
                responseTextParameters.get('oauth_problem') ?? ''
            )

            return null
        }

        oauthToken = Object.fromEntries(responseTextParameters.entries()) as OauthToken

        await redisClient.hSet(`OAUTH:${redisSubKey}`, oauthToken)
    } catch (error: unknown) {
        console.error(error)
    }

    return oauthToken
}
