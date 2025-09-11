import type { GrpcSetCatalogStateMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetCatalogStateMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/SetCatalogStateMutation.ts'

export class SetCatalogStateMutationConverter implements SchemaMutationConverter<SetCatalogStateMutation, GrpcSetCatalogStateMutation> {

    convert(mutation: GrpcSetCatalogStateMutation): SetCatalogStateMutation {
        return new SetCatalogStateMutation(
            mutation.catalogName,
            mutation.active
        )
    }
}
