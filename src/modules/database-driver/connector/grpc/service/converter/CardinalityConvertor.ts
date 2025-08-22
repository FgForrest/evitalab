//todo: lho
import { GrpcCardinality } from '@/modules/database-driver/connector/grpc/gen/GrpcEnums_pb.ts'
import { Cardinality } from '@/modules/database-driver/request-response/schema/Cardinality.ts'

export class CardinalityConvertor {
    convertCardinality(cardinality: GrpcCardinality): Cardinality {
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
            default:
                throw new Error('Unknown cardinality')
        }
    }
}
