// DelegatingEntitySchemaMutationConverter and ModifyEntitySchemaMutationConverter form a pre-existing
// circular dependency that only initializes cleanly when the delegating converter loads first — as it
// does at app runtime via MutationHistoryConverter. Import it first to reproduce that load order.
import '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter'
import { describe, test, expect, vi } from 'vitest'
import {
    ChangeSystemCaptureConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter'
import {
    DelegatingEngineMutationConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingEngineMutationConverter'
import {
    GrpcChangeCaptureOperation,
    type GrpcChangeSystemCapture
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'
import type {
    GrpcEngineMutation
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb'
import { Operation } from '../../../../../../../src/modules/database-driver/request-response/cdc/Operation'
import {
    CreateCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/CreateCatalogSchemaMutation'
import {
    RestoreCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/RestoreCatalogSchemaMutation'
import {
    MarkCatalogMissingMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/MarkCatalogMissingMutation'
import {
    UpgradeCatalogFormatMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/UpgradeCatalogFormatMutation'
import { UnexpectedError } from '../../../../../../../src/modules/base/exception/UnexpectedError'

/** Builds a `systemMutation` capture body wrapping the given engine-mutation oneof. */
function systemMutationBody(
    mutation: GrpcEngineMutation['mutation']
): GrpcChangeSystemCapture['body'] {
    return { case: 'systemMutation', value: { mutation } } as unknown as GrpcChangeSystemCapture['body']
}

function capture(overrides: Partial<GrpcChangeSystemCapture>): GrpcChangeSystemCapture {
    return {
        version: '1',
        index: 0,
        operation: GrpcChangeCaptureOperation.UPSERT,
        body: { case: undefined },
        timestamp: undefined,
        ...overrides
    } as unknown as GrpcChangeSystemCapture
}

describe('ChangeSystemCaptureConverter', () => {
    const converter = new ChangeSystemCaptureConverter()

    test('maps the int64 version string, index and operation', () => {
        const result = converter.convertChangeSystemCapture(capture({
            version: '42',
            index: 3,
            operation: GrpcChangeCaptureOperation.REMOVE
        }))

        expect(result.version).toBe(42)
        expect(result.index).toBe(3)
        expect(result.operation).toBe(Operation.Remove)
    })

    test('maps the transaction operation', () => {
        const result = converter.convertChangeSystemCapture(capture({
            operation: GrpcChangeCaptureOperation.TRANSACTION
        }))
        expect(result.operation).toBe(Operation.Transaction)
    })

    test('delegates the engine mutation body conversion', () => {
        const result = converter.convertChangeSystemCapture(capture({
            body: systemMutationBody({
                case: 'createCatalogSchemaMutation',
                value: { catalogName: 'testCatalog' }
            } as GrpcEngineMutation['mutation'])
        }))

        expect(result.body).toBeInstanceOf(CreateCatalogSchemaMutation)
        expect((result.body as CreateCatalogSchemaMutation).catalogName).toBe('testCatalog')
    })

    test('delegates the restoreCatalogSchemaMutation body conversion', () => {
        const result = converter.convertChangeSystemCapture(capture({
            body: systemMutationBody({
                case: 'restoreCatalogSchemaMutation',
                value: { catalogName: 'restoredCatalog' }
            } as GrpcEngineMutation['mutation'])
        }))

        expect(result.body).toBeInstanceOf(RestoreCatalogSchemaMutation)
        expect((result.body as RestoreCatalogSchemaMutation).catalogName).toBe('restoredCatalog')
    })

    test('converts the markCatalogMissingMutation body', () => {
        const result = converter.convertChangeSystemCapture(capture({
            body: systemMutationBody({
                case: 'markCatalogMissingMutation',
                value: { catalogName: 'vanished' }
            } as GrpcEngineMutation['mutation'])
        }))

        expect(result.body).toBeInstanceOf(MarkCatalogMissingMutation)
        expect((result.body as MarkCatalogMissingMutation).catalogName).toBe('vanished')
    })

    test('converts the upgradeCatalogFormatMutation body with all fields', () => {
        const result = converter.convertChangeSystemCapture(capture({
            body: systemMutationBody({
                case: 'upgradeCatalogFormatMutation',
                value: { catalogName: 'legacy', fromProtocolVersion: 2, toProtocolVersion: 3 }
            } as GrpcEngineMutation['mutation'])
        }))

        expect(result.body).toBeInstanceOf(UpgradeCatalogFormatMutation)
        const body = result.body as UpgradeCatalogFormatMutation
        expect(body.catalogName).toBe('legacy')
        expect(body.fromProtocolVersion).toBe(2)
        expect(body.toProtocolVersion).toBe(3)
    })

    test('leaves the body undefined when no system mutation is present', () => {
        const result = converter.convertChangeSystemCapture(capture({ body: { case: undefined } }))
        expect(result.body).toBeUndefined()
    })

    test('degrades an unset engine-mutation oneof case to a header-only capture without throwing', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        // version-skew: newer server sends a mutation proto3 drops → engine oneof case is unset
        const result = converter.convertChangeSystemCapture(capture({
            version: '5',
            body: systemMutationBody({ case: undefined } as GrpcEngineMutation['mutation'])
        }))

        // header-only body, but the capture identity is preserved so the stream can advance past it
        expect(result.body).toBeUndefined()
        expect(result.version).toBe(5)
        expect(result.operation).toBe(Operation.Upsert)
        vi.restoreAllMocks()
    })

    test('degrades an opt-in host-event body to a header-only capture', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const result = converter.convertChangeSystemCapture(capture({
            version: '9',
            body: { case: 'hostEvent', value: {} } as unknown as GrpcChangeSystemCapture['body']
        }))

        expect(result.body).toBeUndefined()
        expect(result.version).toBe(9)
        vi.restoreAllMocks()
    })

    test('degrades to a header-only capture when a registered converter throws', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const spy = vi.spyOn(DelegatingEngineMutationConverter, 'convert').mockImplementation(() => {
            throw new Error('boom')
        })

        const result = converter.convertChangeSystemCapture(capture({
            version: '11',
            body: systemMutationBody({
                case: 'createCatalogSchemaMutation',
                value: { catalogName: 'testCatalog' }
            } as GrpcEngineMutation['mutation'])
        }))

        expect(result.body).toBeUndefined()
        expect(result.version).toBe(11)
        spy.mockRestore()
        vi.restoreAllMocks()
    })

    test('the delegating converter still throws for a known-but-unregistered oneof case', () => {
        // registry-bug guard: a case the generated types know but the registry forgot must fail loudly
        expect(() => DelegatingEngineMutationConverter.convert({
            mutation: { case: 'someUnregisteredMutation', value: {} }
        } as unknown as GrpcEngineMutation)).toThrow(UnexpectedError)
    })

    test('the delegating converter returns undefined for an unset oneof case', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const result = DelegatingEngineMutationConverter.convert({
            mutation: { case: undefined }
        } as unknown as GrpcEngineMutation)
        expect(result).toBeUndefined()
        vi.restoreAllMocks()
    })

    test('degrades an unknown operation to Unknown without throwing', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const result = converter.convertChangeSystemCapture(capture({
            operation: 999 as GrpcChangeCaptureOperation
        }))
        expect(result.operation).toBe(Operation.Unknown)
        vi.restoreAllMocks()
    })

    test('converts the timestamp when present', () => {
        const result = converter.convertChangeSystemCapture(capture({
            timestamp: {
                timestamp: { seconds: 1_700_000_000n, nanos: 0 },
                offset: 'Z'
            } as GrpcChangeSystemCapture['timestamp']
        }))

        expect(result.timestamp).toBeDefined()
        expect(result.timestamp!.timestamp.seconds).toBe(1_700_000_000n)
    })
})
