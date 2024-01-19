import {Router} from 'express'
import type {Request, RequestHandler, Response} from 'express'

const catalogRoutes: Router = Router()
const requestHandler: RequestHandler = async (request: Request, response: Response) => {
    /* Lazy-load the request handler on-demand instead of when the route is configured. Work-around for Redis client
       being used before it is fully initialized. (This issue might be caused by an ESM import bug in Node.js.) */
    const {default: ProxyApiRequest} = await import('../actions/ProxyApiRequest.js')

    ProxyApiRequest(request, response)
}

catalogRoutes.get('/:endpoint(products)/:parameters', requestHandler)
catalogRoutes.get('/:endpoint(categories)', requestHandler)

export default catalogRoutes
