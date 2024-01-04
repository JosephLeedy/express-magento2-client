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
    const parameters: [string, string][] = (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            Object.entries(requestParameters).filter(([_key, value]): boolean => value !== null) as [string, string][]
        ).sort(
            (parameterA: [string, string], parameterB: [string, string]): number => {
                return parameterA[0] < parameterB[0] ? -1 : 1
            }
        )
    const url: URL = new URL(requestUrl)
    const searchParameters: string = Array.from(url.searchParams.entries())
        .map(([key, value]): string => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&')
    const signatureParameters: string = parameters.map(([key, value]): string => `${key}=${value}`).join('&')
        + (searchParameters.length > 0 ? '&' + searchParameters : '')
    const signature: string = `${httpMethod.toUpperCase()}&`
        + encodeURIComponent(`${url.protocol}//${url.host}${url.pathname}`) + '&'
        + encodeURIComponent(signatureParameters)
    const hashedSignature = crypto.createHmac(
            'sha256',
            encodeURIComponent(oauthCredentials.oauth_consumer_secret) + '&'
                + encodeURIComponent(requestToken?.oauth_token_secret ?? '')
        ).update(signature, 'binary')
        .digest()
        .toString('base64')

    parameters.push([
        'oauth_signature',
        hashedSignature
    ])

    return 'OAuth '
        + parameters.sort(
            (parameterA: [string, string], parameterB: [string, string]): number => {
                return parameterA[0] < parameterB[0] ? -1 : 1
            }
        ).map(([key, value]): string => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join(', ')
}

