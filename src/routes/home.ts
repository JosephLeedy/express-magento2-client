import {Router} from 'express'
import type {Request, Response} from 'express'

const indexRoutes: Router = Router()

indexRoutes.get('/', (_request: Request, response: Response) => {
    response.send('Happy birthday! 🎂')
})

export default indexRoutes
