import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaDefaultValueMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/ModifyAttributeSchemaDefaultValueMutation.ts'
import type {
    GrpcModifyAttributeSchemaDefaultValueMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class ModifyAttributeSchemaDefaultValueMutationConverter implements SchemaMutationConverter<ModifyAttributeSchemaDefaultValueMutation, GrpcModifyAttributeSchemaDefaultValueMutation> {
    public static readonly INSTANCE = new ModifyAttributeSchemaDefaultValueMutationConverter()

    convert(mutation: GrpcModifyAttributeSchemaDefaultValueMutation): ModifyAttributeSchemaDefaultValueMutation {
        return new ModifyAttributeSchemaDefaultValueMutation(
            mutation.name,
            mutation.defaultValue ? EvitaValueConverter.convertGrpcValue(mutation.defaultValue, mutation.defaultValue?.value.case) : undefined
        )
    }
}
