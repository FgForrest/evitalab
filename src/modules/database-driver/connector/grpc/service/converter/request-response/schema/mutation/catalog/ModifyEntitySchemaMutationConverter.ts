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
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'

export class ModifyEntitySchemaMutationConverter implements SchemaMutationConverter<ModifyEntitySchemaMutation, GrpcModifyEntitySchemaMutation> {
    public static readonly INSTANCE = new ModifyEntitySchemaMutationConverter()

    convert(mutation: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        // the delegate is called explicitly rather than passed as an unbound reference, so that neither
        // `this` nor the extra arguments Array.map hands to its callback can reach it
        const entitySchemaMutations: SchemaMutation[] = mutation.entitySchemaMutations
            .map(entitySchemaMutation => DelegatingEntitySchemaMutationConverter.convert(entitySchemaMutation))

        return new ModifyEntitySchemaMutation(
            mutation.entityType,
            ImmutableList(entitySchemaMutations)
        )
    }
}
