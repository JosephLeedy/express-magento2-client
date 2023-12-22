import express, {Request, Response} from 'express'

const app = express()

app.get('/', (_request: Request, response: Response): void => {
    response.send('Happy birthday! 🎂');
})

app.listen(3000, (): void => {
    console.log('Server is listening on port 3000...\n')
})

export default app
