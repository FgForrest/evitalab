import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcSetCatalogMutabilityMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import {
    SetCatalogMutabilityMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/SetCatalogMutabilityMutation.ts'

export class SetCatalogMutabilityMutationConverter implements SchemaMutationConverter<SetCatalogMutabilityMutation, GrpcSetCatalogMutabilityMutation> {

    convert(mutation: GrpcSetCatalogMutabilityMutation): SetCatalogMutabilityMutation {
        return new SetCatalogMutabilityMutation(
            mutation.catalogName,
            mutation.mutable
        )
    }
}
