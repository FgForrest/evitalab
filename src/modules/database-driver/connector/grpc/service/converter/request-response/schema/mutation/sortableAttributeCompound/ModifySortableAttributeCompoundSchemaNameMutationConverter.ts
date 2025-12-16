import {
    ModifySortableAttributeCompoundSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaNameMutation.ts'
import type {
    GrpcModifySortableAttributeCompoundSchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifySortableAttributeCompoundSchemaNameMutationConverter implements SchemaMutationConverter<ModifySortableAttributeCompoundSchemaNameMutation, GrpcModifySortableAttributeCompoundSchemaNameMutation> {
    public static readonly INSTANCE = new ModifySortableAttributeCompoundSchemaNameMutationConverter()

    convert(mutation: GrpcModifySortableAttributeCompoundSchemaNameMutation): ModifySortableAttributeCompoundSchemaNameMutation {
        return new ModifySortableAttributeCompoundSchemaNameMutation(
            mutation.name,
            mutation.newName
        )
    }
}
