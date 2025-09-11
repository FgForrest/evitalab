import type {
    MutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/MutationConverter.ts'
import {
    MakeCatalogAliveMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/MakeCatalogAliveMutation.ts'
import type {
    GrpcMakeCatalogAliveMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'

export class MakeCatalogAliveMutationConverter implements MutationConverter<MakeCatalogAliveMutation, GrpcMakeCatalogAliveMutation> {

    convert(mutation: GrpcMakeCatalogAliveMutation): MakeCatalogAliveMutation {
        return new MakeCatalogAliveMutation(mutation.catalogName)
    }
}
