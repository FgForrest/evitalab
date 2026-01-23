import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaSortableMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaSortableMutation.ts'
import type {
    GrpcSetAttributeSchemaSortableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { EntityScopeDefaults, EntityScopeNone } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'

export class SetAttributeSchemaSortableMutationConverter implements SchemaMutationConverter<SetAttributeSchemaSortableMutation, GrpcSetAttributeSchemaSortableMutation> {
    public static readonly INSTANCE = new SetAttributeSchemaSortableMutationConverter()

    convert(mutation: GrpcSetAttributeSchemaSortableMutation): SetAttributeSchemaSortableMutation {
        const sortableInScopes = mutation.sortableInScopes.length === 0 ?
            (mutation.sortable ? EntityScopeDefaults : EntityScopeNone) : mutation.sortableInScopes.map((scope) => EntityConverter.convertEntityScope(scope))

        return new SetAttributeSchemaSortableMutation(
            mutation.name,
            ImmutableList(sortableInScopes)
        )
    }
}
