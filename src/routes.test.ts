import {jest} from '@jest/globals'

jest.unstable_mockModule('glob', () => ({
    glob: jest.fn(() => [
        'test/data/routes/foo.ts',
    ])
}))

await import('glob')
const {default: router} = await import('./routes.js')

describe('Routes Loader', (): void => {
    afterEach((): void => {
        jest.resetAllMocks()
    })

    it('loads routes defined in routes directory', async (): Promise<void> => {
        const expectedRoutePaths: string[] = [
            '/',
            '/bar',
        ]
        const actualRoutePaths: string[] = router.stack[1]?.handle?.stack.map(
            (layer: {route: {path: string}}): string => layer.route.path
        )

        expect(actualRoutePaths).toEqual(expectedRoutePaths)
        expect(router.stack[1].regexp.toString()).toContain('foo')
    })
})
