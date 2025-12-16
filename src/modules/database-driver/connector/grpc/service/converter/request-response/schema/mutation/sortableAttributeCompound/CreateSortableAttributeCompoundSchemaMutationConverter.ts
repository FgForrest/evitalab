import type {
    GrpcCreateSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import {
    CreateSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortableAttributeCompound/CreateSortableAttributeCompoundSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'
import {
    EntitySchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EntitySchemaConverter.ts'

export class CreateSortableAttributeCompoundSchemaMutationConverter implements SchemaMutationConverter<CreateSortableAttributeCompoundSchemaMutation, GrpcCreateSortableAttributeCompoundSchemaMutation> {
    public static readonly INSTANCE = new CreateSortableAttributeCompoundSchemaMutationConverter()

    convert(mutation: GrpcCreateSortableAttributeCompoundSchemaMutation): CreateSortableAttributeCompoundSchemaMutation {
        const indexedInScopes = mutation.indexedInScopes.map(EntityConverter.convertEntityScope)
        const attributeElements = EntitySchemaConverter.toAttributeElement(mutation.attributeElements)

        return new CreateSortableAttributeCompoundSchemaMutation(
            mutation.name,
            mutation.description,
            mutation.deprecationNotice,
            ImmutableList(indexedInScopes),
            ImmutableList(attributeElements)
        )
    }
}
