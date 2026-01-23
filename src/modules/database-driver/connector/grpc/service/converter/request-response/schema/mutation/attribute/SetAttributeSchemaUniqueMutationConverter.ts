import {
    SetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaUniqueMutation.ts'
import type {
    GrpcSetAttributeSchemaUniqueMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    ScopedAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ScopedAttributeUniquenessType.ts'
import {
    AttributeUniquenessTypeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/AttributeUniquenessTypeConverter.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { EntityScopeDefault } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { List as ImmutableList } from 'immutable'

export class SetAttributeSchemaUniqueMutationConverter implements SchemaMutationConverter<SetAttributeSchemaUniqueMutation, GrpcSetAttributeSchemaUniqueMutation> {
    public static readonly INSTANCE = new SetAttributeSchemaUniqueMutationConverter()

    convert(mutation: GrpcSetAttributeSchemaUniqueMutation): SetAttributeSchemaUniqueMutation {
        const uniqueInScopes = mutation.uniqueInScopes.length === 0 ?
            [new ScopedAttributeUniquenessType(EntityScopeDefault, AttributeUniquenessTypeConverter.convertAttributeUniquenessType(mutation.unique))] :
            mutation.uniqueInScopes.map(it => new ScopedAttributeUniquenessType(EntityConverter.convertEntityScope(it.scope), AttributeUniquenessTypeConverter.convertAttributeUniquenessType(it.uniquenessType)))

        return new SetAttributeSchemaUniqueMutation(
            mutation.name,
            ImmutableList(uniqueInScopes)
        )
    }
}
