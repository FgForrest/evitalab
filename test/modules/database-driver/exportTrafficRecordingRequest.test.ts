import { describe, expect, test } from 'vitest'
import { EvitaClientSession } from '../../../src/modules/database-driver/EvitaClientSession'
import { CatalogState } from '../../../src/modules/database-driver/request-response/CatalogState'
import type {
    GrpcExportTrafficRecordingRequest
} from '../../../src/modules/database-driver/connector/grpc/gen/GrpcEvitaTrafficRecordingAPI_pb'
import type { TaskStatus } from '../../../src/modules/database-driver/request-response/task/TaskStatus'

/**
 * Captures the request the session sends for the ExportTrafficRecording RPC. Only the traffic recording client and
 * the task status converter are touched by the tested method, the remaining dependencies are never used.
 */
function sessionCapturingExportRequest(): [EvitaClientSession, GrpcExportTrafficRecordingRequest[]] {
    const capturedRequests: GrpcExportTrafficRecordingRequest[] = []
    const trafficRecordingClient = {
        exportTrafficRecording: (request: GrpcExportTrafficRecordingRequest) => {
            capturedRequests.push(request)
            return Promise.resolve({ taskStatus: {} })
        }
    }
    const session = new EvitaClientSession(
        'session-id',
        'testCatalog',
        CatalogState.Alive,
        undefined as never,
        undefined as never,
        undefined as never,
        undefined as never,
        () => trafficRecordingClient as never,
        undefined as never,
        undefined as never,
        undefined as never,
        () => ({ convert: () => ({} as TaskStatus) }) as never,
        undefined as never,
        undefined as never
    )
    return [session, capturedRequests]
}

describe('EvitaClientSession.exportTrafficRecording', () => {

    test('leaves the chunk file size unset when not specified, so the server default applies', async () => {
        const [session, capturedRequests] = sessionCapturingExportRequest()

        await session.exportTrafficRecording(undefined)

        expect(capturedRequests).toHaveLength(1)
        expect(capturedRequests[0]!.chunkFileSizeInBytes).toBeUndefined()
    })

    test('passes the chunk file size through when specified', async () => {
        const [session, capturedRequests] = sessionCapturingExportRequest()

        await session.exportTrafficRecording(4096n)

        expect(capturedRequests).toHaveLength(1)
        expect(capturedRequests[0]!.chunkFileSizeInBytes).toBe(4096n)
    })

    test('leaves the chunk file size unset for a non-positive size, which the server would reject', async () => {
        const [session, capturedRequests] = sessionCapturingExportRequest()

        await session.exportTrafficRecording(0n)

        expect(capturedRequests).toHaveLength(1)
        expect(capturedRequests[0]!.chunkFileSizeInBytes).toBeUndefined()
    })
})
