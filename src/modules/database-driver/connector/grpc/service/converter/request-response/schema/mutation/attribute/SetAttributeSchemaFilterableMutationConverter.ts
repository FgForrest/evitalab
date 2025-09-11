import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaFilterableMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaFilterableMutation.ts'
import type {
    GrpcSetAttributeSchemaFilterableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { EntityScope } from '@/modules/database-driver/request-response/schema/EntityScope.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import Immutable from 'immutable'

export class SetAttributeSchemaFilterableMutationConverter implements SchemaMutationConverter<SetAttributeSchemaFilterableMutation, GrpcSetAttributeSchemaFilterableMutation> {

    convert(mutation: GrpcSetAttributeSchemaFilterableMutation): SetAttributeSchemaFilterableMutation {
        const filterableInScopes = mutation.filterableInScopes.length === 0 ?
            (mutation.filterable ? EntityScope.DefaultScopes : EntityScope.NoScope) : mutation.filterableInScopes.map(EntityConverter.convertEntityScope)

        return new SetAttributeSchemaFilterableMutation(
            mutation.name,
            Immutable.List(filterableInScopes)
        )
    }
}
