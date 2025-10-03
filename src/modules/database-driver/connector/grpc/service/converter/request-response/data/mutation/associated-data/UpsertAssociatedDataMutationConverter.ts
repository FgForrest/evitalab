import {
    AssociatedDataMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/associated-data/AssociatedDataMutationConverter.ts'
import {
    UpsertAssociatedDataMutation
} from '@/modules/database-driver/request-response/data/mutation/associatedData/UpsertAssociatedDataMutation.ts'
import type {
    GrpcUpsertAssociatedDataMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAssociatedDataMutations_pb.ts'
import { EvitaValueConverter } from '@/modules/database-driver/connector/grpc/service/converter/EvitaValueConverter.ts'

export class UpsertAssociatedDataMutationConverter extends AssociatedDataMutationConverter<UpsertAssociatedDataMutation, GrpcUpsertAssociatedDataMutation> {

    convert(mutation: GrpcUpsertAssociatedDataMutation): UpsertAssociatedDataMutation {
        const key = AssociatedDataMutationConverter.buildAssociatedDataKey(mutation.associatedDataName, mutation.associatedDataLocale)
        const targetTypeValue = EvitaValueConverter.convertGrpcAssociatedValue(mutation.associatedDataValue, mutation.associatedDataValue?.value.case)
        return new UpsertAssociatedDataMutation(key, targetTypeValue)
    }
}
