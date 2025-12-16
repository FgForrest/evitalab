import type {
    GrpcRemoveSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import {
    RemoveSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortableAttributeCompound/RemoveSortableAttributeCompoundSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class RemoveSortableAttributeCompoundSchemaMutationConverter implements SchemaMutationConverter<RemoveSortableAttributeCompoundSchemaMutation, GrpcRemoveSortableAttributeCompoundSchemaMutation> {
    public static readonly INSTANCE = new RemoveSortableAttributeCompoundSchemaMutationConverter()

    convert(mutation: GrpcRemoveSortableAttributeCompoundSchemaMutation): RemoveSortableAttributeCompoundSchemaMutation {
        return new RemoveSortableAttributeCompoundSchemaMutation(mutation.name)
    }
}
