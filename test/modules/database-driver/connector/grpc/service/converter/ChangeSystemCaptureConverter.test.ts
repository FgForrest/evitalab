// DelegatingEntitySchemaMutationConverter and ModifyEntitySchemaMutationConverter form a pre-existing
// circular dependency that only initializes cleanly when the delegating converter loads first — as it
// does at app runtime via MutationHistoryConverter. Import it first to reproduce that load order.
import '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter'
import { describe, test, expect } from 'vitest'
import {
    ChangeSystemCaptureConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/ChangeSystemCaptureConverter'
import {
    GrpcChangeCaptureOperation,
    type GrpcChangeSystemCapture
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'
import { Operation } from '../../../../../../../src/modules/database-driver/request-response/cdc/Operation'
import {
    CreateCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/CreateCatalogSchemaMutation'
import {
    RestoreCatalogSchemaMutation
} from '../../../../../../../src/modules/database-driver/request-response/schema/mutation/engine/RestoreCatalogSchemaMutation'

function capture(overrides: Partial<GrpcChangeSystemCapture>): GrpcChangeSystemCapture {
    return {
        version: '1',
        index: 0,
        operation: GrpcChangeCaptureOperation.UPSERT,
        systemMutation: undefined,
        timestamp: undefined,
        ...overrides
    } as GrpcChangeSystemCapture
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
            systemMutation: {
                mutation: {
                    case: 'createCatalogSchemaMutation',
                    value: { catalogName: 'testCatalog' }
                }
            } as GrpcChangeSystemCapture['systemMutation']
        }))

        expect(result.body).toBeInstanceOf(CreateCatalogSchemaMutation)
        expect((result.body as CreateCatalogSchemaMutation).catalogName).toBe('testCatalog')
    })

    test('delegates the restoreCatalogSchemaMutation body conversion', () => {
        const result = converter.convertChangeSystemCapture(capture({
            systemMutation: {
                mutation: {
                    case: 'restoreCatalogSchemaMutation',
                    value: { catalogName: 'restoredCatalog' }
                }
            } as GrpcChangeSystemCapture['systemMutation']
        }))

        expect(result.body).toBeInstanceOf(RestoreCatalogSchemaMutation)
        expect((result.body as RestoreCatalogSchemaMutation).catalogName).toBe('restoredCatalog')
    })

    test('leaves the body undefined when no system mutation is present', () => {
        const result = converter.convertChangeSystemCapture(capture({ systemMutation: undefined }))
        expect(result.body).toBeUndefined()
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
