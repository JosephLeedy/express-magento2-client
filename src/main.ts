import { Server } from 'node:http'
import express, {Request, Response} from 'express'

const app = express()
export let server: Server

app.get('/', (_request: Request, response: Response): void => {
    response.send('Happy birthday! 🎂');
})

server = app.listen(3000, (): void => {
    console.log('Server is listening on port 3000...\n')
})

export default app
