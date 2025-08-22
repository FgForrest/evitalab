//todo: lho
import type {
    GrpcRemoveAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    RemoveAttributeSchemaMutation
} from '@/modules/database-driver/request-response/cdc/RemoveAttributeSchemaMutation.ts'

export class RemoveAttributeSchemaConverter {
    public convertRemoveAttributeSchemaMutation(removeAttributeSchemaMutation: GrpcRemoveAttributeSchemaMutation): RemoveAttributeSchemaMutation {
        return new RemoveAttributeSchemaMutation(
            removeAttributeSchemaMutation.name
        )
    }

}
