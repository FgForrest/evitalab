import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcAllowEvolutionModeInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import Immutable from 'immutable'
import {
    AllowEvolutionModeInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/AllowEvolutionModeInEntitySchemaMutation.ts'

export class AllowEvolutionModeInEntitySchemaMutationConverter implements SchemaMutationConverter<AllowEvolutionModeInEntitySchemaMutation, GrpcAllowEvolutionModeInEntitySchemaMutation> {

    convert(mutation: GrpcAllowEvolutionModeInEntitySchemaMutation): AllowEvolutionModeInEntitySchemaMutation {
        return new AllowEvolutionModeInEntitySchemaMutation(
            Immutable.List(CatalogSchemaConverter.convertEvolutionMode(mutation.evolutionModes))
        )
    }
}
