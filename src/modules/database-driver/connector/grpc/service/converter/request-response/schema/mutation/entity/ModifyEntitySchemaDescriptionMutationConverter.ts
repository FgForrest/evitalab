import {
    ModifyEntitySchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/ModifyEntitySchemaDescriptionMutation.ts'
import type {
    GrpcModifyEntitySchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyEntitySchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaDescriptionMutation, GrpcModifyEntitySchemaDescriptionMutation> {

    convert(mutation: GrpcModifyEntitySchemaDescriptionMutation): ModifyEntitySchemaDescriptionMutation {
        return new ModifyEntitySchemaDescriptionMutation(mutation.description)
    }
}
