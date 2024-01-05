import {Request, Response} from 'express'
import redisClient from '../../redis.js'

export default async function Callback(request: Request, response: Response): Promise<void> {
    if (
        request.body === undefined
        || !Object.prototype.hasOwnProperty.call(request.body, 'oauth_consumer_key')
        || !Object.prototype.hasOwnProperty.call(request.body, 'oauth_consumer_secret')
        || !Object.prototype.hasOwnProperty.call(request.body, 'store_base_url')
        || !Object.prototype.hasOwnProperty.call(request.body, 'oauth_verifier')
    ) {
        response.status(400).send('A required field is missing from the request body')

        return
    }

    if (request.body.store_base_url.replace(/\/$/, '') !== process.env.MAGENTO_BASE_URL.replace(/\/$/, '')) {
        response.status(400).send('Invalid store base URL')

        return
    }

    await redisClient.hSet('PRODUCT_VIEWER:OAUTH:CREDENTIALS', request.body)

    response.sendStatus(200)
}
