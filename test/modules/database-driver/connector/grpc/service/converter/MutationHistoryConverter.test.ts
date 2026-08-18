import { describe, expect, test } from 'vitest'
import {
    MutationHistoryConverter
} from '@/modules/database-driver/connector/grpc/service/converter/MutationHistoryConverter'
import {
    GrpcChangeCaptureArea,
    GrpcChangeCaptureOperation,
    type GrpcChangeCatalogCapture
} from '@/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'
import { CaptureArea } from '@/modules/database-driver/request-response/cdc/CaptureArea'
import { Operation } from '@/modules/database-driver/request-response/cdc/Operation'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError'

function capture(overrides: Partial<GrpcChangeCatalogCapture>): GrpcChangeCatalogCapture {
    return {
        version: '7',
        index: 2,
        area: GrpcChangeCaptureArea.SCHEMA,
        operation: GrpcChangeCaptureOperation.UPSERT,
        body: { case: undefined },
        timestamp: undefined,
        ...overrides
    } as unknown as GrpcChangeCatalogCapture
}

describe('MutationHistoryConverter', () => {
    const converter = new MutationHistoryConverter()

    /**
     * The gRPC body carries entity, local, entity schema and infrastructure mutations only, so a catalog-scoped schema
     * mutation arrives without one even though the history is requested with the body content.
     */
    test('a capture without a body is converted into a header-only record', () => {
        const result = converter.convertGrpcMutationHistory(capture({}))

        expect(result.body).toBeUndefined()
        expect(result.version).toBe(7)
        expect(result.index).toBe(2)
        expect(result.area).toBe(CaptureArea.Schema)
        expect(result.operation).toBe(Operation.Upsert)
    })

    test('a body whose inner mutation is unset is treated the same way', () => {
        const result = converter.convertGrpcMutationHistory(capture({
            body: { case: 'schemaMutation', value: { mutation: { case: undefined } } }
        } as unknown as Partial<GrpcChangeCatalogCapture>))

        expect(result.body).toBeUndefined()
    })

    test('a failed conversion names the capture it happened on', () => {
        // a body case this client does not know - the converters themselves degrade unknown mutations instead of failing
        const failing = capture({
            body: { case: 'futureMutation', value: { mutation: { case: 'whatever', value: {} } } }
        } as unknown as Partial<GrpcChangeCatalogCapture>)

        expect(() => converter.convertGrpcMutationHistory(failing)).toThrow(UnexpectedError)
        try {
            converter.convertGrpcMutationHistory(failing)
        } catch (e) {
            const message: string = (e as Error).message
            expect(message).toContain('catalog version: 7')
            expect(message).toContain('index: 2')
            expect(message).toContain(`area: ${CaptureArea.Schema}`)
            expect(message).toContain('body: futureMutation')
        }
    })
})
