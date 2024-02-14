import {jest} from '@jest/globals'
import request from 'supertest'
import type {Response} from 'supertest'

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
    }
}))

const {default: app, server} = await import( '../main.js')

describe('Ping Route', (): void => {
    afterAll((): void => {
        server.close()
    })

    it('returns a message with an HTTP status of OK', (done: globalThis.jest.DoneCallback): void => {
        request(app)
            .get('/ping')
            .then((response: Response): void => {
                expect(response.text).toEqual('PONG')
                expect(response.statusCode).toEqual(200)
            })
            .finally(done)
    })
})
