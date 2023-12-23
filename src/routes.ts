import {Router} from 'express'
import homeRoutes from './routes/home'

const routes: Router = Router()

routes.use('/', homeRoutes)

export default routes
