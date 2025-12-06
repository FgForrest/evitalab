import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    RemoveAssociatedDataSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/RemoveAssociatedDataSchemaMutation.ts'
import type {
    GrpcRemoveAssociatedDataSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'

export class RemoveAssociatedDataSchemaMutationConverter implements SchemaMutationConverter<RemoveAssociatedDataSchemaMutation, GrpcRemoveAssociatedDataSchemaMutation> {
    public static readonly INSTANCE = new RemoveAssociatedDataSchemaMutationConverter()

    convert(mutation: GrpcRemoveAssociatedDataSchemaMutation): RemoveAssociatedDataSchemaMutation {
        return new RemoveAssociatedDataSchemaMutation(mutation.name)
    }
}
