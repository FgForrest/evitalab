import type {
    GrpcModifySortableAttributeCompoundSchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import {
    ModifySortableAttributeCompoundSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortable-attribute-compound/ModifySortableAttributeCompoundSchemaDescriptionMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifySortableAttributeCompoundSchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifySortableAttributeCompoundSchemaDescriptionMutation, GrpcModifySortableAttributeCompoundSchemaDescriptionMutation> {
    public static readonly INSTANCE = new ModifySortableAttributeCompoundSchemaDescriptionMutationConverter()

    convert(mutation: GrpcModifySortableAttributeCompoundSchemaDescriptionMutation): ModifySortableAttributeCompoundSchemaDescriptionMutation {
        return new ModifySortableAttributeCompoundSchemaDescriptionMutation(
            mutation.name,
            mutation.description
        )
    }
}
