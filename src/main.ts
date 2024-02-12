import type {Server} from 'node:http'
import express from 'express'
import type {Express} from 'express'
import cors from 'cors'
import './config.js'
import redisClient from './redis.js'
import routes from './routes.js'
import {AddressInfo} from 'node:net'

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

app.use(cors({origin: process.env.FRONTEND_URL}))
app.use('/', routes)

server = app.listen(port, (): void => {
    const listeningPort = (server.address() as AddressInfo).port

    console.log(`Server is listening on port ${listeningPort}...\n`)
})

export default app
