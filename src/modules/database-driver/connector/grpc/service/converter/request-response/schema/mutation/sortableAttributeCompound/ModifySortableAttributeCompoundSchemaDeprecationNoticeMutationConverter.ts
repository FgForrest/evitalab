import type {
    GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import {
    ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter implements SchemaMutationConverter<ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation, GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation> {

    convert(mutation: GrpcModifySortableAttributeCompoundSchemaDeprecationNoticeMutation): ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation {
        return new ModifySortableAttributeCompoundSchemaDeprecationNoticeMutation(
            mutation.name,
            mutation.deprecationNotice
        )
    }
}
