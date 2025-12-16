import type {
    GrpcSetReferenceSchemaFacetedMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    SetReferenceSchemaFacetedMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/SetReferenceSchemaFacetedMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'

export class SetReferenceSchemaFacetedMutationConverter implements SchemaMutationConverter<SetReferenceSchemaFacetedMutation, GrpcSetReferenceSchemaFacetedMutation> {
    public static readonly INSTANCE = new SetReferenceSchemaFacetedMutationConverter()

    convert(mutation: GrpcSetReferenceSchemaFacetedMutation): SetReferenceSchemaFacetedMutation {
        const facetedInScopes = mutation.facetedInScopes.length === 0 ?
            (mutation.faceted ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.facetedInScopes.map(EntityConverter.convertEntityScope)

        return new SetReferenceSchemaFacetedMutation(
            mutation.name,
            mutation.inherited ? undefined : ImmutableList(facetedInScopes)
        )
    }
}
