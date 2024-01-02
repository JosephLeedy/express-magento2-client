import {Router} from 'express'
import type {Request, Response} from 'express'

const fooRoutes: Router = Router()

fooRoutes.get('/', (_request: Request, response: Response) => {
    response.send('Lorem ipsum dolar sit amet, consectetur adipiscing elit.')
})

fooRoutes.get('/bar', (_request: Request, response: Response) => {
    response.send('Etiam iaculis fermentum ligula ut maximus.')
})

export default fooRoutes
