import {Request, Response as ExpressResponse} from 'express'
import {createHash} from 'node:crypto'
import redisClient from '../redis.js'
import {buildOauthAuthorizationHeader} from '../helpers/oauth.js'
import type {OauthCredentials, OauthToken} from '../types/Oauth.js'

type ApiRequestResult = {
    status: number
    json: object
}

export default async function ProxyApiRequest(request: Request, response: ExpressResponse): Promise<void> {
    const {endpoint} = request.params
    let requestUrl: string = `${process.env.MAGENTO_BASE_URL}/rest/V1/${endpoint}`
    let requestUrlHash: string
    let cachedRequestResult: ApiRequestResult
    let oauthCredentials: OauthCredentials
    let accessToken: OauthToken
    let result: Response
    let resultJson: object

    if (Object.prototype.hasOwnProperty.call(request.params, 'parameters')) {
        requestUrl += `?${request.params.parameters}`
    }

    requestUrlHash = createHash('SHA1').update(requestUrl).digest('hex')
    cachedRequestResult = JSON.parse(await redisClient.get(`REQUEST:${requestUrlHash}`) ?? '{}') as ApiRequestResult

    if (Object.keys(cachedRequestResult).length > 0) {
        response.status(cachedRequestResult.status)
            .json(cachedRequestResult.json)

        return
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
    resultJson = await result.json()

    await redisClient.set(
        `REQUEST:${requestUrlHash}`,
        JSON.stringify(
            {
                status: result.status,
                json: resultJson
            } as ApiRequestResult
        ),
        {
            EX: parseInt(process.env.REDIS_CACHE_TTL ?? '3600', 10),
            NX: true
        }
    )

    response.status(result.status)
        .json(resultJson)
}
