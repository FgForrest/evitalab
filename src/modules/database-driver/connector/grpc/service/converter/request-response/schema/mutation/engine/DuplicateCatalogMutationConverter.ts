import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcDuplicateCatalogMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcEngineMutation_pb.ts'
import {
    DuplicateCatalogMutation
} from '@/modules/database-driver/request-response/schema/mutation/engine/DuplicateCatalogMutation.ts'

export class DuplicateCatalogMutationConverter implements SchemaMutationConverter<DuplicateCatalogMutation, GrpcDuplicateCatalogMutation> {

    convert(mutation: GrpcDuplicateCatalogMutation): DuplicateCatalogMutation {
        return new DuplicateCatalogMutation(
            mutation.catalogName,
            mutation.newCatalogName
        )
    }
}
