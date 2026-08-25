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
    public static readonly INSTANCE = new SetPriceInnerRecordHandlingMutationConverter()

    convert(mutation: GrpcSetPriceInnerRecordHandlingMutation): SetPriceInnerRecordHandlingMutation {
        // the Java converter guards against protobuf's `UNRECOGNIZED` sentinel, i.e. an enum number this schema
        // version doesn't know. TypeScript has no such member, unknown numbers simply pass through the enum type,
        // hence the reverse-mapping check. `UNKNOWN` is a legal value (handling not fetched with the entity) and
        // must not be rejected here.
        if (GrpcPriceInnerRecordHandling[mutation.priceInnerRecordHandling] == undefined) {
            throw new UnexpectedError('Unrecognized price inner record handling: ' + mutation.priceInnerRecordHandling)
        }
        return new SetPriceInnerRecordHandlingMutation(
            EntityConverter.convertPriceInnerHandling(mutation.priceInnerRecordHandling)
        )
    }
}
