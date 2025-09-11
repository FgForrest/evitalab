import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaNameMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaNameMutation.ts'
import type {
    GrpcModifyCatalogSchemaNameMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class ModifyCatalogSchemaNameMutationConverter implements SchemaMutationConverter<ModifyCatalogSchemaNameMutation, GrpcModifyCatalogSchemaNameMutation> {

    convert(mutation: GrpcModifyCatalogSchemaNameMutation): ModifyCatalogSchemaNameMutation {
        return new ModifyCatalogSchemaNameMutation(
            mutation.catalogName,
            mutation.newCatalogName,
            mutation.overwriteTarget
        )
    }
}
