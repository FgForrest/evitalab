import type {
    GrpcModifyEntitySchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    ModifyEntitySchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyEntitySchemaNameMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyEntitySchemaNameMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaNameMutation, GrpcModifyEntitySchemaNameMutation> {

    convert(mutation: GrpcModifyEntitySchemaNameMutation): ModifyEntitySchemaNameMutation {
        return new ModifyEntitySchemaNameMutation(
            mutation.name,
            mutation.newName,
            mutation.overwriteTarget
        )
    }
}
