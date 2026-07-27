import { describe, test, expect, vi } from 'vitest'
import {
    CatalogStatisticsConverter
} from '../../../../../../../src/modules/database-driver/connector/grpc/service/converter/CatalogStatisticsConverter'
import {
    GrpcCatalogState
} from '../../../../../../../src/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { CatalogState } from '../../../../../../../src/modules/database-driver/request-response/CatalogState'

describe('CatalogStatisticsConverter.convertCatalogState', () => {
    const converter = new CatalogStatisticsConverter()

    test.each([
        [GrpcCatalogState.MISSING, CatalogState.Missing],
        [GrpcCatalogState.OUT_OF_DATE, CatalogState.OutOfDate],
        [GrpcCatalogState.BEING_UPGRADED, CatalogState.BeingUpgraded],
        [GrpcCatalogState.ALIVE, CatalogState.Alive],
        [GrpcCatalogState.INACTIVE, CatalogState.Inactive]
    ])('maps %s to the internal state', (grpcState, expected) => {
        expect(converter.convertCatalogState(grpcState)).toBe(expected)
    })

    test('degrades an unknown catalog state to Unknown instead of throwing', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        // a value no current GrpcCatalogState member uses — simulates a newer server
        expect(converter.convertCatalogState(999 as GrpcCatalogState)).toBe(CatalogState.Unknown)
        vi.restoreAllMocks()
    })
})
