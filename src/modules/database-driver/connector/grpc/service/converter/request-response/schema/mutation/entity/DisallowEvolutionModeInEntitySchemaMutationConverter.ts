import type {
    GrpcDisallowEvolutionModeInEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'
import {
    DisallowEvolutionModeInEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/entity/DisallowEvolutionModeInEntitySchemaMutation.ts'
import { Set as ImmutableSet } from 'immutable'

export class DisallowEvolutionModeInEntitySchemaMutationConverter implements SchemaMutationConverter<DisallowEvolutionModeInEntitySchemaMutation, GrpcDisallowEvolutionModeInEntitySchemaMutation> {
    public static readonly INSTANCE = new DisallowEvolutionModeInEntitySchemaMutationConverter()

    convert(mutation: GrpcDisallowEvolutionModeInEntitySchemaMutation): DisallowEvolutionModeInEntitySchemaMutation {
        return new DisallowEvolutionModeInEntitySchemaMutation(
            ImmutableSet(CatalogSchemaConverter.convertEvolutionMode(mutation.evolutionModes))
        )
    }
}
