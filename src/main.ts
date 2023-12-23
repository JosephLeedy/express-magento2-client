import { Server } from 'node:http'
import express, {Request, Response} from 'express'
import './config'

const app = express()
const port: number = process.env.PORT || 3000
export let server: Server

app.get('/', (_request: Request, response: Response): void => {
    response.send('Happy birthday! 🎂');
})

server = app.listen(port, (): void => {
    console.log(`Server is listening on port ${port}...\n`)
})

export default app
