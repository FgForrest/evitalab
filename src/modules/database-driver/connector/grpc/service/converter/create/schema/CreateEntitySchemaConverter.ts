import type {
    GrpcCreateEntitySchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEntitySchemaMutations_pb.ts'
import {
    CreateEntitySchemaMutation
} from '@/modules/database-driver/request-response/cdc/CreateEntitySchemaMutation.ts'

export class CreateEntitySchemaConverter {
    public convertCreateEntitySchemaMutation(createEntitySchemaMutation: GrpcCreateEntitySchemaMutation): CreateEntitySchemaMutation {
        return new CreateEntitySchemaMutation(
            createEntitySchemaMutation.entityType
        )
    }
}
