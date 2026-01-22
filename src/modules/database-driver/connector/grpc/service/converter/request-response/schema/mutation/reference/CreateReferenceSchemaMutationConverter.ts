import {
    CreateReferenceSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/CreateReferenceSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcCreateReferenceSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'
import {
    CardinalityConvertor
} from '@/modules/database-driver/connector/grpc/service/converter/CardinalityConvertor.ts'

export class CreateReferenceSchemaMutationConverter implements SchemaMutationConverter<CreateReferenceSchemaMutation, GrpcCreateReferenceSchemaMutation> {
    public static readonly INSTANCE = new CreateReferenceSchemaMutationConverter()

    convert(mutation: GrpcCreateReferenceSchemaMutation): CreateReferenceSchemaMutation {
        const indexedInScopes = mutation.indexedInScopes.length === 0 ?
            (mutation.filterable ? [new ScopedReferenceIndexType(EntityScope.DefaultScope, ReferenceIndexType.ForFiltering)] : ScopedReferenceIndexType.Empty) :
            mutation.indexedInScopes.map(scope => new ScopedReferenceIndexType(EntityConverter.convertEntityScope(scope), ReferenceIndexType.ForFiltering))

        const facetedInScopes = mutation.facetedInScopes.length === 0 ?
            (mutation.faceted ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.facetedInScopes.map((scope) => EntityConverter.convertEntityScope(scope))

        return new CreateReferenceSchemaMutation(
            mutation.name,
            mutation.description,
            mutation.deprecationNotice,
            CardinalityConvertor.convertCardinality(mutation.cardinality),
            mutation.referencedEntityType,
            mutation.referencedEntityTypeManaged,
            mutation.referencedGroupType,
            mutation.referencedGroupTypeManaged,
            ImmutableList(indexedInScopes),
            ImmutableList(facetedInScopes)
        )
    }
}
