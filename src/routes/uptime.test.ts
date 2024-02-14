import {jest} from '@jest/globals'
import request from 'supertest'
import type {Response} from 'supertest'

jest.unstable_mockModule('../redis.js', (): object => ({
    default: {
        connect: jest.fn(),
    }
}))

const {default: app, server} = await import( '../main.js')

describe('Uptime Route', (): void => {
    afterAll((): void => {
        server.close()
    })

    it(
        'returns the total amount of time that the application has been running',
        (done: globalThis.jest.DoneCallback): void => {
            const originalProcess: NodeJS.Process = process

            global.process = {
                ...originalProcess,
                uptime: (): number => 42.906180167
            }

            request(app)
                .get('/uptime')
                .then((response: Response): void => {
                    expect(response.text).toEqual('42.906180167')
                    expect(response.statusCode).toEqual(200)
                }).finally((): void => {
                    global.process = originalProcess
                }).finally(done)
        }
    )
})
