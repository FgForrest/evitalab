import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type {
    GrpcSetPriceInnerRecordHandlingMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcPriceMutations_pb.ts'
import {
    SetPriceInnerRecordHandlingMutation
} from '@/modules/database-driver/request-response/data/mutation/price/SetPriceInnerRecordHandlingMutation.ts'
import { GrpcPriceInnerRecordHandling } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'

export class SetPriceInnerRecordHandlingMutationConverter implements LocalMutationConverter<SetPriceInnerRecordHandlingMutation, GrpcSetPriceInnerRecordHandlingMutation> {

    convert(mutation: GrpcSetPriceInnerRecordHandlingMutation): SetPriceInnerRecordHandlingMutation {
        if (mutation.priceInnerRecordHandling === GrpcPriceInnerRecordHandling.UNKNOWN) { // todo pfi : in origin code was "UNRECOGNIZED"
            throw new UnexpectedError('Unrecognized price inner record handling: ' + mutation.priceInnerRecordHandling)
        }
        return new SetPriceInnerRecordHandlingMutation(
            EntityConverter.convertPriceInnerHandling(mutation.priceInnerRecordHandling)
        )
    }
}
