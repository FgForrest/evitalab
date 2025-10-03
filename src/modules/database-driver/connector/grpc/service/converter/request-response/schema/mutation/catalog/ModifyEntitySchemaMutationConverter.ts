import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/catalog/ModifyEntitySchemaMutation.ts'

import { List as ImmutableList } from 'immutable'
import {
    DelegatingEntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingEntitySchemaMutationConverter.ts'
import type {
    GrpcModifyEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutation_pb.ts'

export class ModifyEntitySchemaMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaMutation, GrpcModifyEntitySchemaMutation> {

    convert(mutation: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        const entitySchemaMutations = mutation.entitySchemaMutations.map(DelegatingEntitySchemaMutationConverter.convert) // todo pfi: fix me

        return new ModifyEntitySchemaMutation(
            mutation.entityType,
            ImmutableList(entitySchemaMutations)
        )
    }
}
