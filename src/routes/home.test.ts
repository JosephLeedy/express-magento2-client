import request from 'supertest'
import type {Response} from 'supertest'
import app, {server} from '../main.js'

describe('Index Route', (): void => {
    afterAll((): void => {
        server.close()
    })

    it('sends a message with a status of OK', (done: jest.DoneCallback): void => {
        request(app)
            .get('/')
            .then((response: Response): void => {
                expect(response.text).toEqual('Nothing to see here, move along!')
                expect(response.statusCode).toEqual(200)
            })
            .finally(done)
    })
})
