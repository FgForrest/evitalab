import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    MarkCatalogMissingMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/MarkCatalogMissingMutation.ts'
import type {
    GrpcMarkCatalogMissingMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class MarkCatalogMissingMutationConverter implements SchemaMutationConverter<MarkCatalogMissingMutation, GrpcMarkCatalogMissingMutation> {
    public static readonly INSTANCE = new MarkCatalogMissingMutationConverter()

    convert(mutation: GrpcMarkCatalogMissingMutation): MarkCatalogMissingMutation {
        return new MarkCatalogMissingMutation(mutation.catalogName)
    }
}
