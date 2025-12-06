import type {
    GrpcModifyAssociatedDataSchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    ModifyAssociatedDataSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/ModifyAssociatedDataSchemaNameMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

export class ModifyAssociatedDataSchemaNameMutationConverter implements SchemaMutationConverter<ModifyAssociatedDataSchemaNameMutation, GrpcModifyAssociatedDataSchemaNameMutation> {
    public static readonly INSTANCE = new ModifyAssociatedDataSchemaNameMutationConverter()

    convert(mutation: GrpcModifyAssociatedDataSchemaNameMutation): ModifyAssociatedDataSchemaNameMutation {
        if (mutation.newName == undefined) {
            throw new UnexpectedError("")
        }

        return new ModifyAssociatedDataSchemaNameMutation(
            mutation.name,
            mutation.newName
        )
    }
}
