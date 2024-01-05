import {Request, Response as ExpressResponse} from 'express'
import redisClient from '../../redis.js'
import {fetchAndStoreOauthToken} from '../../helpers/oauth.js'
import {OauthCredentials, OauthToken} from '../../types/Oauth.js'

export default async function Identity(request: Request, response: ExpressResponse): Promise<void> {
    let oauthCredentials: OauthCredentials
    let requestToken: OauthToken | null
    let apiToken: OauthToken | null

    if (
        request.query === undefined
        || !Object.prototype.hasOwnProperty.call(request.query, 'oauth_consumer_key')
        || !Object.prototype.hasOwnProperty.call(request.query, 'success_call_back')
    ) {
        response.status(400).send('A required field is missing from the request')

        return
    }

    oauthCredentials = (await redisClient.hGetAll('PRODUCT_VIEWER:OAUTH:CREDENTIALS') ?? {}) as OauthCredentials

    if (Object.keys(oauthCredentials).length === 0) {
        response.status(400).send('OAuth callback was not previously called')

        return
    }

    if (oauthCredentials.oauth_consumer_key !== request.query.oauth_consumer_key) {
        response.status(400).send('Invalid OAuth consumer key')

        return
    }

    requestToken = await fetchAndStoreOauthToken(oauthCredentials)

    if (requestToken === null) {
        response.status(500).send('Could not fetch or store request token from Magento API')

        return
    }

    apiToken = await fetchAndStoreOauthToken(oauthCredentials, requestToken)

    if (apiToken === null) {
        response.status(500).send('Could not fetch or store API token from Magento API')

        return
    }

    response.redirect(<string>request.query.success_call_back)
}
