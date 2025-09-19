import {
    MakeCatalogAliveMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/MakeCatalogAliveMutation.ts'
import type {
    GrpcMakeCatalogAliveMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'

export class MakeCatalogAliveMutationConverter implements SchemaMutationConverter<MakeCatalogAliveMutation, GrpcMakeCatalogAliveMutation> {
    public static readonly INSTANCE = new MakeCatalogAliveMutationConverter()

    convert(mutation: GrpcMakeCatalogAliveMutation): MakeCatalogAliveMutation {
        return new MakeCatalogAliveMutation(mutation.catalogName)
    }
}
