//todo: lho
import type {
    GrpcModifyEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcCatalogSchemaMutations_pb.ts'
import {
    ModifyEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/ModifyEntitySchemaMutation.ts'
import type {
    EntitySchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/EntitySchemaMutationConverter.ts'

export class ModifyEntitySchemaConverter {
    private entitySchemaMutationConverter: EntitySchemaMutationConverter

    constructor(entitySchemaMutationConverter: EntitySchemaMutationConverter) {
        this.entitySchemaMutationConverter = entitySchemaMutationConverter
    }

    convertModifyEntitySchema(modifyEntitySchema: GrpcModifyEntitySchemaMutation): ModifyEntitySchemaMutation {
        return new ModifyEntitySchemaMutation(
            modifyEntitySchema.entityType,
            this.entitySchemaMutationConverter.convertEntitySchemaMutations(modifyEntitySchema.entitySchemaMutations)
        )
    }
}
