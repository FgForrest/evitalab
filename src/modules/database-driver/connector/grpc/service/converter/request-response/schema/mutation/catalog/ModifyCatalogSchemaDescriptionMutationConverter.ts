import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaDescriptionMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyCatalogSchemaDescriptionMutation.ts'
import type {
    GrpcModifyCatalogSchemaDescriptionMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'

export class ModifyCatalogSchemaDescriptionMutationConverter implements SchemaMutationConverter<ModifyCatalogSchemaDescriptionMutation, GrpcModifyCatalogSchemaDescriptionMutation> {

    convert(mutation: GrpcModifyCatalogSchemaDescriptionMutation): ModifyCatalogSchemaDescriptionMutation {
        return new ModifyCatalogSchemaDescriptionMutation(mutation.description)
    }
}
