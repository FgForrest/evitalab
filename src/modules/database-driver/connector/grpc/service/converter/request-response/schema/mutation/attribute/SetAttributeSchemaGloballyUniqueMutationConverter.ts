import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaGloballyUniqueMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaGloballyUniqueMutation.ts'
import type {
    GrpcSetAttributeSchemaGloballyUniqueMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    ScopedGlobalAttributeUniquenessType
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ScopedGlobalAttributeUniquenessType.ts'
import { EntityScopeDefault } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { ScopesConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScopesConverter.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import { List as ImmutableList } from 'immutable'

export class SetAttributeSchemaGloballyUniqueMutationConverter implements SchemaMutationConverter<SetAttributeSchemaGloballyUniqueMutation, GrpcSetAttributeSchemaGloballyUniqueMutation> {
    public static readonly INSTANCE = new SetAttributeSchemaGloballyUniqueMutationConverter()

    convert(mutation: GrpcSetAttributeSchemaGloballyUniqueMutation): SetAttributeSchemaGloballyUniqueMutation {
        const uniqueGloballyInScopes = mutation.uniqueGloballyInScopes.length === 0 ?
            [new ScopedGlobalAttributeUniquenessType(EntityScopeDefault, ScopesConverter.convertGlobalAttributeUniquenessType(mutation.uniqueGlobally))] :
            mutation.uniqueGloballyInScopes.map(it => new ScopedGlobalAttributeUniquenessType(EntityConverter.convertEntityScope(it.scope), ScopesConverter.convertGlobalAttributeUniquenessType(it.uniquenessType)))

        return new SetAttributeSchemaGloballyUniqueMutation(
            mutation.name,
            ImmutableList(uniqueGloballyInScopes)
        )
    }
}
