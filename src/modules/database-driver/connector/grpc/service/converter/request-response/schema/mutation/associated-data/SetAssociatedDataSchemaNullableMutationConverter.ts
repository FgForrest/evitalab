import type {
    GrpcSetAssociatedDataSchemaNullableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    SetAssociatedDataSchemaNullableMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/SetAssociatedDataSchemaNullableMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class SetAssociatedDataSchemaNullableMutationConverter implements SchemaMutationConverter<SetAssociatedDataSchemaNullableMutation, GrpcSetAssociatedDataSchemaNullableMutation> {

    convert(mutation: GrpcSetAssociatedDataSchemaNullableMutation): SetAssociatedDataSchemaNullableMutation {
        return new SetAssociatedDataSchemaNullableMutation(
            mutation.name,
            mutation.nullable
        )
    }
}
