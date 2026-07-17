import { test, expect } from 'vitest'
import { MutationHistoryRequest } from '../../../../src/modules/history-viewer/model/MutationHistoryRequest'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

function build(operationList: unknown, containerTypeList: unknown): MutationHistoryRequest {
    return new MutationHistoryRequest(
        undefined,
        undefined,
        operationList as GrpcChangeCaptureOperation[],
        undefined,
        containerTypeList as GrpcChangeCaptureContainerType[],
        undefined,
        undefined
    )
}

// The filter UI binds enum *names* (strings) as select values, so the criteria
// lists arrive as string names at runtime and must be normalized to numeric
// enum values before being sent over gRPC. A previous implementation used
// `GrpcEnum[it.toString()]`, which reverse-mapped numeric values (e.g. UPSERT=0)
// back to their names, corrupting the request.
test('Should convert string enum names to numeric enum values', () => {
    const request = build(['UPSERT', 'REMOVE'], ['CONTAINER_ATTRIBUTE', 'CONTAINER_REFERENCE'])
    expect(request.operationList)
        .toEqual([GrpcChangeCaptureOperation.UPSERT, GrpcChangeCaptureOperation.REMOVE])
    expect(request.containerTypeList)
        .toEqual([GrpcChangeCaptureContainerType.CONTAINER_ATTRIBUTE, GrpcChangeCaptureContainerType.CONTAINER_REFERENCE])
})

test('Should leave already-numeric enum values untouched (incl. zero-valued UPSERT)', () => {
    const request = build(
        [GrpcChangeCaptureOperation.UPSERT, GrpcChangeCaptureOperation.REMOVE],
        [GrpcChangeCaptureContainerType.CONTAINER_ENTITY]
    )
    expect(request.operationList)
        .toEqual([GrpcChangeCaptureOperation.UPSERT, GrpcChangeCaptureOperation.REMOVE])
    expect(request.containerTypeList)
        .toEqual([GrpcChangeCaptureContainerType.CONTAINER_ENTITY])
})

test('Should default container type to CONTAINER_ENTITY when none provided', () => {
    const request = build([], [])
    expect(request.operationList).toEqual([])
    expect(request.containerTypeList).toEqual([GrpcChangeCaptureContainerType.CONTAINER_ENTITY])
})
