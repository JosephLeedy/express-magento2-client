import path from 'node:path'
import {Router} from 'express'
import {glob} from 'glob'
import homeRoutes from './routes/home.js'

const baseDirectory: string = process.env.NODE_ENV !== 'production' ? 'src' : 'dist'
const routeFiles: string[] = await glob(
    `${baseDirectory}/routes/*.{ts,js}`,
    {
        ignore: [
            `${baseDirectory}/routes/home.{ts,js}`,
            `${baseDirectory}/routes/*.test.{ts,js}`
        ]
    }
)
const routes: Router = Router()

routes.use('/', homeRoutes)

routeFiles.forEach(async (routeFile: string): Promise<void> => {
    const fileName = path.basename(routeFile.replace(/\.ts$/, '.js'))
    const routerImport: {default: Router} = await import('./routes/' + fileName)

    routes.use('/' + path.basename(fileName, '.js'), routerImport.default)
})

export default routes
