import {
    UpsertAttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/UpsertAttributeMutation.ts'
import {
    AttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/AttributeMutationConverter.ts'
import type {
    GrpcUpsertAttributeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeMutations_pb.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class UpsertAttributeMutationConverter extends AttributeMutationConverter<UpsertAttributeMutation, GrpcUpsertAttributeMutation> {

    convert(mutation: GrpcUpsertAttributeMutation): UpsertAttributeMutation {
        const key = AttributeMutationConverter.buildAttributeKey(mutation.attributeName, mutation.attributeLocale)
        const targetTypeValue = EvitaValueConverter.convertGrpcValue(mutation.attributeValue, mutation.attributeValue?.value.case)
        return new UpsertAttributeMutation(key, targetTypeValue)
    }
}
