import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    AllowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/AllowEvolutionModeInCatalogSchemaMutation.ts'
import type {
    GrpcAllowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import {
    CatalogEvolutionModeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogEvolutionModeConverter.ts'
import Immutable from 'immutable'

export class AllowEvolutionModeInCatalogSchemaMutationConverter implements SchemaMutationConverter<AllowEvolutionModeInCatalogSchemaMutation, GrpcAllowEvolutionModeInCatalogSchemaMutation> {

    convert(mutation: GrpcAllowEvolutionModeInCatalogSchemaMutation): AllowEvolutionModeInCatalogSchemaMutation {
        return new AllowEvolutionModeInCatalogSchemaMutation(
            Immutable.List(mutation.evolutionModes.map(CatalogEvolutionModeConverter.convertCatalogEvolutionMode))
        )
    }
}
