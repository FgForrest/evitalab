import { describe, test, expect } from 'vitest'
import {
    resolveClientVersion
} from '../../../../../../src/modules/database-driver/connector/grpc/utils/ClientVersion'

describe('resolveClientVersion', () => {

    test('Should pass through a version the server can parse', () => {
        expect(resolveClientVersion('2026.2.0')).toEqual('2026.2.0')
        expect(resolveClientVersion('2026.2')).toEqual('2026.2')
        expect(resolveClientVersion('2026.2-SNAPSHOT')).toEqual('2026.2-SNAPSHOT')
        expect(resolveClientVersion('2026.2.0-SNAPSHOT')).toEqual('2026.2.0-SNAPSHOT')
        expect(resolveClientVersion(' 2026.2.0\n')).toEqual('2026.2.0')
    })

    test('Should reject a version the server cannot parse', () => {
        expect(resolveClientVersion(undefined)).toBeUndefined()
        expect(resolveClientVersion('')).toBeUndefined()
        expect(resolveClientVersion('?')).toBeUndefined()
        expect(resolveClientVersion('2026')).toBeUndefined()
        expect(resolveClientVersion('dev')).toBeUndefined()
        expect(resolveClientVersion('vX.Y.Z')).toBeUndefined()
    })
})
