import path from 'node:path'
import {fileURLToPath} from 'node:url'
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
    const fileName: string = path.basename(routeFile.replace(/\.ts$/, '.js'))
    let routePath = path.relative(
        path.dirname(fileURLToPath(import.meta.url)), path.dirname(routeFile) + '/' + fileName
    )
    let routerImport: {default: Router}

    if (!routePath.startsWith('.')) {
        routePath = './' + routePath
    }

    routerImport = await import(routePath)

    routes.use('/' + path.basename(fileName, '.js'), routerImport.default)
})

export default routes
