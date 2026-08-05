import { describe, test, expect } from 'vitest'
import { Code, ConnectError } from '@connectrpc/connect'
import { EvitaClientManagement } from '../../../src/modules/database-driver/EvitaClientManagement'
import type { ServerFileChunk } from '../../../src/modules/database-driver/EvitaClientManagement'
import type { EvitaManagementServiceClient } from '../../../src/modules/database-driver/AbstractEvitaClient'
import { ErrorTransformer } from '../../../src/modules/database-driver/exception/ErrorTransformer'
import { Uuid } from '../../../src/modules/database-driver/data-type/Uuid'

const fileId: Uuid = Uuid.fromBits(1n, 2n)

function chunk(size: number, fill: number): Uint8Array {
    return new Uint8Array(size).fill(fill)
}

/**
 * Stands in for the generated management client. Mimics connect-web: the signal is honoured between
 * chunks and an aborted stream fails with a `ConnectError` carrying `Code.Canceled`.
 */
function managementClient(
    chunks: Uint8Array[],
    receivedChunks: Uint8Array[] = [],
    failAfter?: number
): EvitaManagementServiceClient {
    const totalSizeInBytes: string = String(chunks.reduce((sum, it) => sum + it.length, 0))
    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fetchFile(_request: any, options?: { signal?: AbortSignal }): AsyncIterable<any> {
            return (async function* () {
                let index: number = 0
                for (const it of chunks) {
                    if (options?.signal?.aborted === true) {
                        throw new ConnectError('canceled', Code.Canceled)
                    }
                    if (failAfter != undefined && index === failAfter) {
                        throw new Error('connection lost')
                    }
                    index++
                    receivedChunks.push(it)
                    yield { fileContents: it, totalSizeInBytes }
                }
            })()
        }
    } as unknown as EvitaManagementServiceClient
}

function management(client: EvitaManagementServiceClient): EvitaClientManagement {
    const errorTransformer: ErrorTransformer = {
        transformError: (e: unknown) => e as Error
    } as unknown as ErrorTransformer
    const notUsed = undefined as unknown as never
    return new EvitaClientManagement(
        errorTransformer,
        notUsed,
        () => client,
        notUsed,
        notUsed,
        notUsed,
        notUsed,
        notUsed,
        notUsed,
        notUsed
    )
}

describe('fetchFileStream', () => {

    test('Should report monotonically increasing progress ending at the total size', async () => {
        const chunks: Uint8Array[] = [chunk(10, 1), chunk(10, 2), chunk(5, 3)]
        const progress: [bigint, bigint][] = []

        const received: ServerFileChunk[] = []
        for await (const it of management(managementClient(chunks)).fetchFileStream(
            fileId,
            { onProgress: (bytesRead, totalSizeInBytes) => progress.push([bytesRead, totalSizeInBytes]) }
        )) {
            received.push(it)
        }

        expect(received.length).toEqual(3)
        expect(progress).toEqual([[10n, 25n], [20n, 25n], [25n, 25n]])
        expect(received.map(it => it.bytesRead)).toEqual([10n, 20n, 25n])
        expect(received[received.length - 1]!.bytesRead).toEqual(received[0]!.totalSizeInBytes)
    })

    test('Should stop consuming and report cancellation when the signal is aborted', async () => {
        const chunks: Uint8Array[] = [chunk(10, 1), chunk(10, 2), chunk(10, 3), chunk(10, 4)]
        const consumedByClient: Uint8Array[] = []
        const abortController: AbortController = new AbortController()

        let consumed: number = 0
        let error: unknown = undefined
        try {
            for await (const _ of management(managementClient(chunks, consumedByClient))
                .fetchFileStream(fileId, { signal: abortController.signal })) {
                consumed++
                if (consumed === 2) {
                    abortController.abort()
                }
            }
        } catch (e) {
            error = e
        }

        expect(consumed).toEqual(2)
        expect(consumedByClient.length).toEqual(2)
        expect(error).toBeInstanceOf(ConnectError)
        expect((error as ConnectError).code).toEqual(Code.Canceled)
    })
})

describe('fetchFile', () => {

    test('Should produce a blob of the summed chunk sizes', async () => {
        const chunks: Uint8Array[] = [chunk(10, 1), chunk(10, 2), chunk(5, 3)]

        const blob: Blob = await management(managementClient(chunks)).fetchFile(fileId)

        expect(blob.size).toEqual(25)
        expect(new Uint8Array(await blob.arrayBuffer()).at(24)).toEqual(3)
    })

    test('Should propagate a transfer failure', async () => {
        const chunks: Uint8Array[] = [chunk(10, 1), chunk(10, 2)]

        await expect(management(managementClient(chunks, [], 1)).fetchFile(fileId))
            .rejects.toThrow('connection lost')
    })
})
