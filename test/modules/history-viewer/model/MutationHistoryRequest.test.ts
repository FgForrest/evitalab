import { test, expect } from 'vitest'
import {
    MutationHistoryRequest,
    reverseScanStartIndex
} from '../../../../src/modules/history-viewer/model/MutationHistoryRequest'
import {
    GrpcChangeCaptureContainerType,
    GrpcChangeCaptureOperation
} from '../../../../src/modules/database-driver/connector/grpc/gen/GrpcChangeCapture_pb'

function build(operationList: unknown, containerTypeList: unknown): MutationHistoryRequest {
    return new MutationHistoryRequest({
        operationList: operationList as GrpcChangeCaptureOperation[],
        containerTypeList: containerTypeList as GrpcChangeCaptureContainerType[]
    })
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

// The request used to be built from a 12-argument positional list, in which the UI-only
// `mutableFilters` flag was passed in the `loadTransaction` slot. Named arguments make that
// class of mix-up impossible.
test('Should map every named argument to its own property', () => {
    const request = new MutationHistoryRequest({
        entityPrimaryKey: 42,
        entityType: 'Product',
        containerNameList: ['code'],
        infrastructureAreaType: 'DATA_SITE',
        sinceVersion: 7,
        sinceIndex: reverseScanStartIndex,
        page: 3,
        loadTransaction: false,
        newerThanVersion: 5
    })

    expect(request.entityPrimaryKey).toEqual(42)
    expect(request.entityType).toEqual('Product')
    expect(request.containerNameList).toEqual(['code'])
    expect(request.infrastructureAreaType).toEqual('DATA_SITE')
    expect(request.sinceVersion).toEqual(7)
    expect(request.sinceIndex).toEqual(2147483647)
    expect(request.page).toEqual(3)
    expect(request.loadTransaction).toEqual(false)
    expect(request.newerThanVersion).toEqual(5)
})

test('Should load transaction overviews and apply no boundary by default', () => {
    const request = build([], [])
    expect(request.loadTransaction).toEqual(true)
    expect(request.newerThanVersion).toBeUndefined()
    expect(request.sinceVersion).toBeUndefined()
    expect(request.sinceIndex).toBeUndefined()
})
