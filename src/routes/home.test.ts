import {jest} from '@jest/globals'
import request from 'supertest'
import type {Response} from 'supertest'

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
    }
}))

const {default: app, server} = await import( '../main.js')

describe('Index Route', (): void => {
    afterAll((): void => {
        server.close()
    })

    it('sends a message with a status of OK', (done: globalThis.jest.DoneCallback): void => {
        request(app)
            .get('/')
            .then((response: Response): void => {
                expect(response.text).toEqual('Nothing to see here, move along!')
                expect(response.statusCode).toEqual(200)
            })
            .finally(done)
    })
})
