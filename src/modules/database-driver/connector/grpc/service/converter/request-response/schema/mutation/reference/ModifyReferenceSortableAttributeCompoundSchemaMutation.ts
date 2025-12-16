import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceSortableAttributeCompoundSchemaMutation.ts'
import type {
    GrpcModifyReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    DelegatingSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingSortableAttributeCompoundSchemaMutationConverter.ts'

export class ModifyReferenceSortableAttributeCompoundSchemaMutationConverter implements SchemaMutationConverter<ModifyReferenceSortableAttributeCompoundSchemaMutation, GrpcModifyReferenceSortableAttributeCompoundSchemaMutation> {
    public static readonly INSTANCE = new ModifyReferenceSortableAttributeCompoundSchemaMutationConverter()

    convert(mutation: GrpcModifyReferenceSortableAttributeCompoundSchemaMutation): ModifyReferenceSortableAttributeCompoundSchemaMutation {
        return new ModifyReferenceSortableAttributeCompoundSchemaMutation(
            mutation.name,
            DelegatingSortableAttributeCompoundSchemaMutationConverter.convert(mutation.sortableAttributeCompoundSchemaMutation)
        )
    }
}
