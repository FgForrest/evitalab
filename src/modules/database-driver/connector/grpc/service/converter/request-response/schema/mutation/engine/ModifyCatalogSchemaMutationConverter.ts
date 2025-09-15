import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/ModifyCatalogSchemaMutation.ts'
import type {
    GrpcModifyCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import Immutable from 'immutable'
import {
    DelegatingLocalCatalogSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingLocalCatalogSchemaMutationConverter.ts'

export class ModifyCatalogSchemaMutationConverter implements SchemaMutationConverter<ModifyCatalogSchemaMutation, GrpcModifyCatalogSchemaMutation> {

    convert(mutation: GrpcModifyCatalogSchemaMutation): ModifyCatalogSchemaMutation {
        const schemaMutations = mutation.schemaMutations.map(DelegatingLocalCatalogSchemaMutationConverter.convert)

        return new ModifyCatalogSchemaMutation(
            mutation.catalogName,
            undefined,
            Immutable.List(schemaMutations)
        )
    }
}
