import {Router} from 'express'
import homeRoutes from './routes/home.js'

const routes: Router = Router()

routes.use('/', homeRoutes)

export default routes
