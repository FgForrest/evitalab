import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaConflictResolutionMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyCatalogSchemaConflictResolutionMutation.ts'
import type {
    GrpcModifyCatalogSchemaConflictResolutionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import {
    ConflictResolutionConverter
} from '@/modules/database-driver/connector/grpc/service/converter/ConflictResolutionConverter.ts'

export class ModifyCatalogSchemaConflictResolutionMutationConverter implements SchemaMutationConverter<ModifyCatalogSchemaConflictResolutionMutation, GrpcModifyCatalogSchemaConflictResolutionMutation> {
    public static readonly INSTANCE = new ModifyCatalogSchemaConflictResolutionMutationConverter()

    convert(mutation: GrpcModifyCatalogSchemaConflictResolutionMutation): ModifyCatalogSchemaConflictResolutionMutation {
        return new ModifyCatalogSchemaConflictResolutionMutation(
            ConflictResolutionConverter.convertConflictResolution(mutation.conflictResolution)
        )
    }
}
