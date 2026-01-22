import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    DisallowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/DisallowEvolutionModeInCatalogSchemaMutation.ts'
import type {
    GrpcDisallowEvolutionModeInCatalogSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import {
    CatalogEvolutionModeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogEvolutionModeConverter.ts'

export class DisallowEvolutionModeInCatalogSchemaMutationConverter implements SchemaMutationConverter<DisallowEvolutionModeInCatalogSchemaMutation, GrpcDisallowEvolutionModeInCatalogSchemaMutation> {

    convert(mutation: GrpcDisallowEvolutionModeInCatalogSchemaMutation): DisallowEvolutionModeInCatalogSchemaMutation {
        return new DisallowEvolutionModeInCatalogSchemaMutation(
            Immutable.Set(mutation.evolutionModes.map((mode) => CatalogEvolutionModeConverter.convertCatalogEvolutionMode(mode)))
        )
    }
}
