import {Router} from 'express'
import type {Request, Response} from 'express'

const pingRoutes: Router = Router()

pingRoutes.get('/', (_request: Request, response: Response) => {
    response.send('PONG')
})

export default pingRoutes
