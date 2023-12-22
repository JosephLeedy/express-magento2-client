import request from 'supertest'
import type {Response} from 'supertest'
import app from './main'

describe('Index Route', (): void => {
    it('sends a message with a status of OK', (done: jest.DoneCallback): void => {
        request(app)
            .get('/')
            .then((response: Response): void => {
                expect(response.text).toEqual('Happy birthday! 🎂')
                expect(response.statusCode).toEqual(200)
            })
            .finally(done)
    })
})
