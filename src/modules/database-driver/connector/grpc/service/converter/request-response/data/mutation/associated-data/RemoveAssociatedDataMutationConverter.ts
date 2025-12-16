import type {
    GrpcRemoveAssociatedDataMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataMutations_pb.ts'
import  {
    RemoveAssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/RemoveAssociatedDataMutation.ts'
import {
    AssociatedDataMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/associated-data/AssociatedDataMutationConverter.ts'

export class RemoveAssociatedDataMutationConverter extends AssociatedDataMutationConverter<RemoveAssociatedDataMutation, GrpcRemoveAssociatedDataMutation> {
    public static readonly INSTANCE = new RemoveAssociatedDataMutationConverter()

    convert(mutation: GrpcRemoveAssociatedDataMutation): RemoveAssociatedDataMutation {
        const key = AssociatedDataMutationConverter.buildAssociatedDataKey(mutation.associatedDataName, mutation.associatedDataLocale)
        return new RemoveAssociatedDataMutation(key)
    }
}
