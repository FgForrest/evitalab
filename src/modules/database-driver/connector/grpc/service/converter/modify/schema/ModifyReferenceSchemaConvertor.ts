//todo: lho
import type {
    GrpcModifyReferenceSchemaCardinalityMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaCardinalityMutation
} from '@/modules/database-driver/request-response/cdc/ModifyReferenceSchemaCardinalityMutation.ts'
import type {
    CardinalityConvertor
} from '@/modules/database-driver/connector/grpc/service/converter/CardinalityConvertor.ts'

export class ModifyReferenceSchemaConvertor {
    private readonly cardinalityConvertor: CardinalityConvertor
    constructor(cardinalityConvertor: CardinalityConvertor) {
        this.cardinalityConvertor = cardinalityConvertor
    }

    convertModifyReferenceSchemaCardinality(modifyReferenceSchema: GrpcModifyReferenceSchemaCardinalityMutation): ModifyReferenceSchemaCardinalityMutation {
        return new ModifyReferenceSchemaCardinalityMutation(
            modifyReferenceSchema.name,
            this.cardinalityConvertor.convertCardinality(modifyReferenceSchema.cardinality)
        )
    }
}
