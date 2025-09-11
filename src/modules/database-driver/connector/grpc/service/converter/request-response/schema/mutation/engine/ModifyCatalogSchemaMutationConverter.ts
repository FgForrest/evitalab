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

export class ModifyCatalogSchemaMutationConverter implements SchemaMutationConverter<ModifyCatalogSchemaMutation, GrpcModifyCatalogSchemaMutation> {

    //todo pfi: DelegatingLocalCatalogSchemaMutationConverter
    convert(mutation: GrpcModifyCatalogSchemaMutation): ModifyCatalogSchemaMutation {
        const schemaMutations = mutation.schemaMutations.map(DelegatingLocalCatalogSchemaMutationConverter.convert)

        return new ModifyCatalogSchemaMutation(
            mutation.catalogName,
            undefined,
            Immutable.List(schemaMutations)
        )
    }
}
