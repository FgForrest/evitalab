import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CreateAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/CreateAssociatedDataSchemaMutation.ts'
import type {
    GrpcCreateAssociatedDataSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import { ScalarConverter } from '@/modules/database-driver/connector/grpc/service/converter/ScalarConverter.ts'

export class CreateAssociatedDataSchemaMutationConverter implements SchemaMutationConverter<CreateAssociatedDataSchemaMutation, GrpcCreateAssociatedDataSchemaMutation> {

    convert(mutation: GrpcCreateAssociatedDataSchemaMutation): CreateAssociatedDataSchemaMutation {
        if (mutation.type == undefined) {
            throw new UnexpectedError('Unexpected type ' + mutation.type)
        }

        return new CreateAssociatedDataSchemaMutation(
            mutation.name,
            mutation.description,
            mutation.deprecationNotice,
            ScalarConverter.convertAssociatedDataScalar(mutation.type),
            mutation.localized,
            mutation.nullable
        )
    }
}
