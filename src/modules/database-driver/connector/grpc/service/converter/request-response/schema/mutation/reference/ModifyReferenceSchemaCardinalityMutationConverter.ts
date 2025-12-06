import type {
    GrpcModifyReferenceSchemaCardinalityMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ModifyReferenceSchemaCardinalityMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSchemaCardinalityMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CardinalityConvertor
} from '@/modules/database-driver/connector/grpc/service/converter/CardinalityConvertor.ts'

export class ModifyReferenceSchemaCardinalityMutationConverter implements SchemaMutationConverter<ModifyReferenceSchemaCardinalityMutation, GrpcModifyReferenceSchemaCardinalityMutation> {
    public static readonly INSTANCE = new ModifyReferenceSchemaCardinalityMutationConverter()

    convert(mutation: GrpcModifyReferenceSchemaCardinalityMutation): ModifyReferenceSchemaCardinalityMutation {
        return new ModifyReferenceSchemaCardinalityMutation(
            mutation.name,
            CardinalityConvertor.convertCardinality(mutation.cardinality)
        )
    }
}
