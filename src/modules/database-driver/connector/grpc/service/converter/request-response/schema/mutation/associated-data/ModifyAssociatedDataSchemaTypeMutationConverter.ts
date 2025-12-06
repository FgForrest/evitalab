import type {
    GrpcModifyAssociatedDataSchemaTypeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    ModifyAssociatedDataSchemaTypeMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/ModifyAssociatedDataSchemaTypeMutation.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { ScalarConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScalarConverter.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class ModifyAssociatedDataSchemaTypeMutationConverter implements SchemaMutationConverter<ModifyAssociatedDataSchemaTypeMutation, GrpcModifyAssociatedDataSchemaTypeMutation> {
    public static readonly INSTANCE = new ModifyAssociatedDataSchemaTypeMutationConverter()

    convert(mutation: GrpcModifyAssociatedDataSchemaTypeMutation): ModifyAssociatedDataSchemaTypeMutation {
        if (mutation.type == undefined) {
            throw new UnexpectedError('Unexpected type ' + mutation.type)
        }

        return new ModifyAssociatedDataSchemaTypeMutation(
            mutation.name,
            ScalarConverter.convertAssociatedDataScalar(mutation.type)
        )
    }
}
