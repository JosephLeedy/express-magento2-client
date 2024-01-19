import {Request, Response as ExpressResponse} from 'express'
import redisClient from '../redis.js'
import {buildOauthAuthorizationHeader} from '../helpers/oauth.js'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'

export default async function ProxyApiRequest(request: Request, response: ExpressResponse): Promise<void> {
    const {endpoint} = request.params
    let requestUrl: string = `${process.env.MAGENTO_BASE_URL}/rest/V1/${endpoint}`
    let oauthCredentials: OauthCredentials
    let accessToken: OauthToken
    let result: Response

    if (Object.prototype.hasOwnProperty.call(request.params, 'parameters')) {
        requestUrl += `?${request.params.parameters}`
    }

    oauthCredentials = (await redisClient.hGetAll('OAUTH:CREDENTIALS') ?? {}) as OauthCredentials

    if (Object.keys(oauthCredentials).length === 0) {
        response.status(500)
            .json({
                message: 'Could not get OAuth credentials. Please verify that the integration is set up properly in '
                    + 'Magento.'
            })

        return
    }

    accessToken = (await redisClient.hGetAll('OAUTH:API_TOKEN') ?? {}) as OauthToken

    if (Object.keys(accessToken).length === 0) {
        response.status(500)
            .json({
                message: 'Could not get OAuth access token. Please verify that the integration is set up properly in '
                    + 'Magento.'
            })

        return
    }

    result = await fetch(
        requestUrl,
        {
            method: request.method,
            headers: {
                Authorization: buildOauthAuthorizationHeader(
                    request.method,
                    oauthCredentials,
                    requestUrl,
                    accessToken
                )
            }
        }
    )

    response.status(result.status)
        .json(await result.json())
}
