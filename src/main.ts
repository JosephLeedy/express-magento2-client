import type {Server} from 'node:http'
import express from 'express'
import type {Express} from 'express'
import './config.js'
import redisClient from './redis.js'
import routes from './routes.js'

const app: Express = express()
const port: number = parseInt(process.env.PORT || '3000', 10)
const exitGracefully = async (): Promise<void> => {
    server.close()

    await redisClient.quit()

    process.exitCode = 0
}
export let server: Server

process.on('SIGINT', exitGracefully)

await redisClient.connect()

app.use('/', routes)

server = app.listen(port, (): void => {
    console.log(`Server is listening on port ${port}...\n`)
})

export default app
