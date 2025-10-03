import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaSortableMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaSortableMutation.ts'
import type {
    GrpcSetAttributeSchemaSortableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'

export class SetAttributeSchemaSortableMutationConverter implements SchemaMutationConverter<SetAttributeSchemaSortableMutation, GrpcSetAttributeSchemaSortableMutation> {

    convert(mutation: GrpcSetAttributeSchemaSortableMutation): SetAttributeSchemaSortableMutation {
        const sortableInScopes = mutation.sortableInScopes.length === 0 ?
            (mutation.sortable ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.sortableInScopes.map(EntityConverter.convertEntityScope)

        return new SetAttributeSchemaSortableMutation(
            mutation.name,
            ImmutableList(sortableInScopes)
        )
    }
}
