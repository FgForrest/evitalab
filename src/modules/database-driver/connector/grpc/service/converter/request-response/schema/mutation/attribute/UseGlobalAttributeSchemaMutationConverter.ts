import {
    UseGlobalAttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/UseGlobalAttributeSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcUseGlobalAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class UseGlobalAttributeSchemaMutationConverter implements SchemaMutationConverter<UseGlobalAttributeSchemaMutation, GrpcUseGlobalAttributeSchemaMutation> {
    public static readonly INSTANCE = new UseGlobalAttributeSchemaMutationConverter()

    convert(mutation: GrpcUseGlobalAttributeSchemaMutation): UseGlobalAttributeSchemaMutation {
        return new UseGlobalAttributeSchemaMutation(mutation.name)
    }
}
