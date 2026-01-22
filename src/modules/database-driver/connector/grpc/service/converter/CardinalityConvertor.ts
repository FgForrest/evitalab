import { GrpcCardinality } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

export class CardinalityConvertor {
    static convertCardinality(cardinality: GrpcCardinality): Cardinality {
        switch (cardinality) {
            case GrpcCardinality.EXACTLY_ONE:
                return Cardinality.ExactlyOne
            case GrpcCardinality.NOT_SPECIFIED:
                return Cardinality.NotSpecified
            case GrpcCardinality.ONE_OR_MORE:
                return Cardinality.OneOrMore
            case GrpcCardinality.ZERO_OR_MORE:
                return Cardinality.ZeroOrMore
            case GrpcCardinality.ZERO_OR_ONE:
                return Cardinality.ZeroOrOne
            case GrpcCardinality.ZERO_OR_MORE_WITH_DUPLICATES:
                return Cardinality.ZeroOrMoreWithDuplicates
            case GrpcCardinality.ONE_OR_MORE_WITH_DUPLICATES:
                return Cardinality.OneOrMoreWithDuplicates
            default:
                throw new UnexpectedError(
                    `Unsupported cardinality '${String(cardinality)}'.`
                )        }
    }
}
