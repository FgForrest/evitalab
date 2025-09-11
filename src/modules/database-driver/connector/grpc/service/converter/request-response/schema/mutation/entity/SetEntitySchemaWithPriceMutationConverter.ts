import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetEntitySchemaWithPriceMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/SetEntitySchemaWithPriceMutation.ts'
import type {
    GrpcSetEntitySchemaWithPriceMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import { EntityConverter } from '@/modules/database-driver/connector/grpc/service/converter/EntityConverter.ts'
import Immutable from 'immutable'

export class SetEntitySchemaWithPriceMutationConverter implements SchemaMutationConverter<SetEntitySchemaWithPriceMutation, GrpcSetEntitySchemaWithPriceMutation> {

    convert(mutation: GrpcSetEntitySchemaWithPriceMutation): SetEntitySchemaWithPriceMutation {
        const indexedInScopes = mutation.indexedInScopes.map(EntityConverter.convertEntityScope)

        return new SetEntitySchemaWithPriceMutation(
            mutation.withPrice,
            Immutable.List(indexedInScopes),
            mutation.indexedPricePlaces
        )
    }
}
