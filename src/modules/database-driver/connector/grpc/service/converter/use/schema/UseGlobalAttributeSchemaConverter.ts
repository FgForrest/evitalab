import type {
    AttributeUniquenessTypeConverter
} from '@/modules/database-driver/connector/grpc/service/converter/AttributeUniquenessTypeConverter.ts'
import type {
    GrpcUseGlobalAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import {
    UseGlobalAttributeSchemaMutation
} from '@/modules/database-driver/request-response/cdc/UseGlobalAttributeSchemaMutation.ts'

export class UseGlobalAttributeSchemaConverter {
    private readonly attributeUniquenessTypeConverter: AttributeUniquenessTypeConverter
    constructor(attributeUniquenessTypeConverter: AttributeUniquenessTypeConverter) {
        this.attributeUniquenessTypeConverter = attributeUniquenessTypeConverter
    }
    convertUseGlobalAttributeSchema(useGlobalAttributeSchema: GrpcUseGlobalAttributeSchemaMutation): UseGlobalAttributeSchemaMutation {
        return new UseGlobalAttributeSchemaMutation(
            useGlobalAttributeSchema.name
        )
    }
}
