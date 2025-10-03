import {
    SetEntitySchemaWithGeneratedPrimaryKeyMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/SetEntitySchemaWithGeneratedPrimaryKeyMutation.ts'
import type {
    GrpcSetEntitySchemaWithGeneratedPrimaryKeyMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class SetEntitySchemaWithGeneratedPrimaryKeyMutationConverter implements SchemaMutationConverter<SetEntitySchemaWithGeneratedPrimaryKeyMutation, GrpcSetEntitySchemaWithGeneratedPrimaryKeyMutation> {

    convert(mutation: GrpcSetEntitySchemaWithGeneratedPrimaryKeyMutation): SetEntitySchemaWithGeneratedPrimaryKeyMutation {
        return new SetEntitySchemaWithGeneratedPrimaryKeyMutation(mutation.withGeneratedPrimaryKey)
    }
}
