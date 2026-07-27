import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    UpgradeCatalogFormatMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/UpgradeCatalogFormatMutation.ts'
import type {
    GrpcUpgradeCatalogFormatMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class UpgradeCatalogFormatMutationConverter implements SchemaMutationConverter<UpgradeCatalogFormatMutation, GrpcUpgradeCatalogFormatMutation> {
    public static readonly INSTANCE = new UpgradeCatalogFormatMutationConverter()

    convert(mutation: GrpcUpgradeCatalogFormatMutation): UpgradeCatalogFormatMutation {
        return new UpgradeCatalogFormatMutation(
            mutation.catalogName,
            mutation.fromProtocolVersion,
            mutation.toProtocolVersion
        )
    }
}
