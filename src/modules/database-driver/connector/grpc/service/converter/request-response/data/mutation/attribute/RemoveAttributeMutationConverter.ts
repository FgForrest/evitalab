import {
    RemoveAttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/RemoveAttributeMutation.ts'
import {
    AttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/AttributeMutationConverter.ts'
import type {
    GrpcRemoveAttributeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeMutations_pb.ts'

export class RemoveAttributeMutationConverter extends AttributeMutationConverter<RemoveAttributeMutation, GrpcRemoveAttributeMutation> {

    convert(mutation: GrpcRemoveAttributeMutation): RemoveAttributeMutation {
        const key = AttributeMutationConverter.buildAttributeKey(mutation.attributeName, mutation.attributeLocale)
        return new RemoveAttributeMutation(key)
    }
}
