import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaTypeMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ModifyAttributeSchemaTypeMutation.ts'
import type {
    GrpcModifyAttributeSchemaTypeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { ScalarConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScalarConverter.ts'

export class ModifyAttributeSchemaTypeMutationConverter implements SchemaMutationConverter<ModifyAttributeSchemaTypeMutation, GrpcModifyAttributeSchemaTypeMutation> {
    public static readonly INSTANCE = new ModifyAttributeSchemaTypeMutationConverter()

    convert(mutation: GrpcModifyAttributeSchemaTypeMutation): ModifyAttributeSchemaTypeMutation {
        if (mutation.type == undefined) {
            throw new UnexpectedError('Unexpected type: undefined')
        }

        return new ModifyAttributeSchemaTypeMutation(
            mutation.name,
            ScalarConverter.convertScalar(mutation.type),
            mutation.indexedDecimalPlaces
        )
    }
}
