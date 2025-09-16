import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CreateReflectedReferenceSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/CreateReflectedReferenceSchemaMutation.ts'
import type {
    GrpcCreateReflectedReferenceSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    ScopedReferenceIndexType
} from '@/modules/database-driver/request-response/schema/mutation/reference/ScopedReferenceIndexType.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { ReferenceIndexType } from '@/modules/database-driver/request-response/schema/ReferenceIndexType.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import {
    CardinalityConvertor
} from '@/modules/database-driver/connector/grpc/service/converter/CardinalityConvertor.ts'
import { List as ImmutableList } from 'immutable'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'

export class CreateReflectedReferenceSchemaMutationConverter implements SchemaMutationConverter<CreateReflectedReferenceSchemaMutation, GrpcCreateReflectedReferenceSchemaMutation> {

    convert(mutation: GrpcCreateReflectedReferenceSchemaMutation): CreateReflectedReferenceSchemaMutation {
        const indexedInScopes = mutation.indexedInScopes.length === 0 ?
            [new ScopedReferenceIndexType(EntityScope.DefaultScope, ReferenceIndexType.ForFiltering)] :
            mutation.indexedInScopes.map(scope => new ScopedReferenceIndexType(EntityConverter.convertEntityScope(scope), ReferenceIndexType.ForFiltering))

        const facetedInScopes = mutation.facetedInScopes.length === 0 ?
            (mutation.faceted ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.facetedInScopes.map(EntityConverter.convertEntityScope)

        return new CreateReflectedReferenceSchemaMutation(
            mutation.name,
            mutation.description,
            mutation.deprecationNotice,
            CardinalityConvertor.convertCardinality(mutation.cardinality),
            mutation.referencedEntityType,
            mutation.reflectedReferenceName,
            mutation.indexedInherited ? undefined : ImmutableList(indexedInScopes),
            mutation.facetedInherited ? undefined : ImmutableList(facetedInScopes),
            CatalogSchemaConverter.convertAttributeInheritanceBehavior(mutation.attributeInheritanceBehavior),
            ImmutableList(mutation.attributeInheritanceFilter)
        )
    }
}
