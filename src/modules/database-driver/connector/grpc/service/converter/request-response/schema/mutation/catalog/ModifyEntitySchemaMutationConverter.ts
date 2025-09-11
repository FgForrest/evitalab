import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyEntitySchemaMutation.ts'
import type {
    GrpcModifyEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import Immutable from 'immutable'

export class ModifyEntitySchemaMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaMutation, GrpcModifyEntitySchemaMutation> {

    // todo pfi: create DelegatingEntitySchemaMutationConverter
    convert(mutation: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        const entitySchemaMutations = mutation.entitySchemaMutations.map(DelegatingEntitySchemaMutationConverter.convert)

        return new ModifyEntitySchemaMutation(
            mutation.entityType,
            Immutable.List(entitySchemaMutations)
        )
    }
}
