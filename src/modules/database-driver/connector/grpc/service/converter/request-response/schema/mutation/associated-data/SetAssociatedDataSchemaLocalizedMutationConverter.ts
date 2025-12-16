import type {
    GrpcSetAssociatedDataSchemaLocalizedMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataSchemaMutations_pb.ts'
import {
    SetAssociatedDataSchemaLocalizedMutation
} from '@/modules/database-driver/request-response/schema/mutation/associatedData/SetAssociatedDataSchemaLocalizedMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class SetAssociatedDataSchemaLocalizedMutationConverter implements SchemaMutationConverter<SetAssociatedDataSchemaLocalizedMutation, GrpcSetAssociatedDataSchemaLocalizedMutation> {
    public static readonly INSTANCE = new SetAssociatedDataSchemaLocalizedMutationConverter()

    convert(mutation: GrpcSetAssociatedDataSchemaLocalizedMutation): SetAssociatedDataSchemaLocalizedMutation {
        return new SetAssociatedDataSchemaLocalizedMutation(
            mutation.name,
            mutation.localized
        )
    }
}
