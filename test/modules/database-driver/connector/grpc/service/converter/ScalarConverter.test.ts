import { describe, expect, test } from 'vitest'
import { ScalarConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScalarConverter'
import { GrpcEvitaDataType } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb'
import { Scalar } from '@/modules/database-driver/data-type/Scalar'

/**
 * Derives the scalar a gRPC data type must map to from its name: `BYTE_NUMBER_RANGE_ARRAY` → `ByteNumberRangeArray`.
 */
function expectedScalar(grpcName: string): string {
    return grpcName
        .split('_')
        .map(part => part === 'UUID' ? part : part.charAt(0) + part.slice(1).toLowerCase())
        .join('')
}

describe('ScalarConverter', () => {
    const grpcDataTypes: [string, GrpcEvitaDataType][] = Object.entries(GrpcEvitaDataType)
        .filter((entry): entry is [string, GrpcEvitaDataType] => typeof entry[1] === 'number')

    test.each(grpcDataTypes)('converts %s to the scalar of the same name', (name, dataType) => {
        const scalar: Scalar = ScalarConverter.convertScalar(dataType)

        expect(scalar).toBe(expectedScalar(name))
        expect(Object.values(Scalar)).toContain(scalar)
    })
})
