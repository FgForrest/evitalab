import type {
    GrpcSetSortableAttributeCompoundIndexedMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import {
    SetSortableAttributeCompoundIndexedMutation
} from '@/modules/database-driver/request-response/schema/mutation/sortableAttributeCompound/SetSortableAttributeCompoundIndexedMutation.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { List as ImmutableList } from 'immutable'
import type {
    SortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/SortableAttributeCompoundSchemaMutation.ts'

export class SetSortableAttributeCompoundIndexedMutationConverter implements SchemaMutationConverter<SetSortableAttributeCompoundIndexedMutation, GrpcSetSortableAttributeCompoundIndexedMutation>, SortableAttributeCompoundSchemaMutation {
    public static readonly INSTANCE = new SetSortableAttributeCompoundIndexedMutationConverter()

    convert(mutation: GrpcSetSortableAttributeCompoundIndexedMutation): SetSortableAttributeCompoundIndexedMutation {
        const indexedInScopes = mutation.indexedInScopes.map(EntityConverter.convertEntityScope)

        return new SetSortableAttributeCompoundIndexedMutation(
            mutation.name,
            ImmutableList(indexedInScopes)
        )
    }
}
