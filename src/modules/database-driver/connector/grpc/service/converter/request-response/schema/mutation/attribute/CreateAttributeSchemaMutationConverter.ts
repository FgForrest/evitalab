import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CreateAttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/CreateAttributeSchemaMutation.ts'
import type {
    GrpcCreateAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/ScopedAttributeUniquenessType.ts'
import { ScalarConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScalarConverter.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import {
    AttributeUniquenessTypeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/AttributeUniquenessTypeConverter.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'
import { List as ImmutableList } from 'immutable'

export class CreateAttributeSchemaMutationConverter implements SchemaMutationConverter<CreateAttributeSchemaMutation, GrpcCreateAttributeSchemaMutation> {
    public static readonly INSTANCE = new CreateAttributeSchemaMutationConverter()

    convert(mutation: GrpcCreateAttributeSchemaMutation): CreateAttributeSchemaMutation {
        if (mutation.type == undefined) {
            throw new UnexpectedError('Unexpected type: ' + String(mutation.type))
        }

        const uniqueInScopes = mutation.uniqueInScopes.length === 0 ?
            [new ScopedAttributeUniquenessType(EntityScope.DefaultScope, AttributeUniquenessTypeConverter.convertAttributeUniquenessType(mutation.unique))] :
            mutation.uniqueInScopes.map(it => new ScopedAttributeUniquenessType(EntityConverter.convertEntityScope(it.scope), AttributeUniquenessTypeConverter.convertAttributeUniquenessType(it.uniquenessType)))

        const filterableInScopes = mutation.filterableInScopes.length === 0 ?
            (mutation.filterable ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.filterableInScopes.map(scope => EntityConverter.convertEntityScope(scope))

        const sortableInScopes = mutation.sortableInScopes.length === 0 ?
            (mutation.sortable ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.sortableInScopes.map(scope => EntityConverter.convertEntityScope(scope))

        return new CreateAttributeSchemaMutation(
            mutation.name,
            mutation.description,
            mutation.deprecationNotice,
            ImmutableList(uniqueInScopes),
            ImmutableList(filterableInScopes),
            ImmutableList(sortableInScopes),
            mutation.localized,
            mutation.nullable,
            mutation.representative,
            ScalarConverter.convertScalar(mutation.type),
            mutation.defaultValue ? EvitaValueConverter.convertGrpcValue(mutation.defaultValue, mutation.defaultValue?.value.case) : undefined,
            mutation.indexedDecimalPlaces
        )
    }
}
