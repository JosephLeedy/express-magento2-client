import type {Server} from 'node:http'
import express from 'express'
import './config.js'
import routes from './routes.js'

const app = express()
const port: number = process.env.PORT || 3000
export let server: Server

app.use('/', routes)

server = app.listen(port, (): void => {
    console.log(`Server is listening on port ${port}...\n`)
})

export default app
