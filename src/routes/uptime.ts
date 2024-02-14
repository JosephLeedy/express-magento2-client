import {Router} from 'express'
import type {Request, Response} from 'express'

const uptimeRoutes: Router = Router()

uptimeRoutes.get('/', (_request: Request, response: Response) => {
    response.send(process.uptime().toString(10))
})

export default uptimeRoutes
