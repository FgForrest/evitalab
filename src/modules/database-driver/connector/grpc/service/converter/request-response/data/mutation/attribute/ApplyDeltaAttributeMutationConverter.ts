import type {
    GrpcApplyDeltaAttributeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeMutations_pb.ts'
import {
    ApplyDeltaAttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/ApplyDeltaAttributeMutation.ts'
import {
    AttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/AttributeMutationConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { Range } from '@/modules/database-driver/data-type/Range.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class ApplyDeltaAttributeMutationConverter extends AttributeMutationConverter<ApplyDeltaAttributeMutation<any>, GrpcApplyDeltaAttributeMutation> {
    public static readonly INSTANCE = new ApplyDeltaAttributeMutationConverter()

    convert(mutation: GrpcApplyDeltaAttributeMutation): ApplyDeltaAttributeMutation<any> {
        const key = AttributeMutationConverter.buildAttributeKey(mutation.attributeName, mutation.attributeLocale)

        let delta: number
        switch (mutation.delta.case) {
            case 'integerDelta':
                delta = mutation.delta.value
                break
            case 'longDelta':
                delta = Number(mutation.delta.value) // Convert string to number
                break
            case 'bigDecimalDelta':
                delta = EvitaValueConverter.convertGrpcBigDecimal(mutation.delta.value).toFloat()
                break
            default:
                throw new UnexpectedError('Delta value has to be provided when applying ApplyDeltaAttributeMutation!')
        }

        let requiredRange: Range<any> | undefined
        switch (mutation.requiredRangeAfterApplication.case) {
            case 'integerRequiredRangeAfterApplication':
                requiredRange = EvitaValueConverter.convertGrpcIntegerNumberRange(mutation.requiredRangeAfterApplication.value)
                break
            case 'longRequiredRangeAfterApplication':
                requiredRange = EvitaValueConverter.convertGrpcLongNumberRange(mutation.requiredRangeAfterApplication.value)
                break
            case 'bigDecimalRequiredRangeAfterApplication':
                requiredRange = EvitaValueConverter.convertGrpcBigDecimalNumberRange(mutation.requiredRangeAfterApplication.value)
                break
            default:
                requiredRange = undefined
        }

        return new ApplyDeltaAttributeMutation(key, delta, requiredRange)
    }
}
