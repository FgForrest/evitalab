import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAssociatedDataSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/ModifyAssociatedDataSchemaDescriptionMutation.ts'
import type {
    GrpcModifyAssociatedDataSchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'

export class ModifyAssociatedDataSchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifyAssociatedDataSchemaDescriptionMutation, GrpcModifyAssociatedDataSchemaDescriptionMutation> {

    convert(mutation: GrpcModifyAssociatedDataSchemaDescriptionMutation): ModifyAssociatedDataSchemaDescriptionMutation {
        return new ModifyAssociatedDataSchemaDescriptionMutation(
            mutation.name,
            mutation.description
        )
    }
}
