import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetEntitySchemaWithHierarchyMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/SetEntitySchemaWithHierarchyMutation.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import type {
    GrpcSetEntitySchemaWithHierarchyMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import Immutable from 'immutable'

export class SetEntitySchemaWithHierarchyMutationConverter implements SchemaMutationConverter<SetEntitySchemaWithHierarchyMutation, GrpcSetEntitySchemaWithHierarchyMutation> {

    convert(mutation: GrpcSetEntitySchemaWithHierarchyMutation): SetEntitySchemaWithHierarchyMutation {
        const indexedInScopes = mutation.indexedInScopes.map(EntityConverter.convertEntityScope)

        return new SetEntitySchemaWithHierarchyMutation(
            mutation.withHierarchy,
            Immutable.List(indexedInScopes)
        )
    }
}
