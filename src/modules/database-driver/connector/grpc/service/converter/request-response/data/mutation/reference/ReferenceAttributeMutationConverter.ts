import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import {
    ReferenceAttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceAttributeMutation.ts'
import type {
    GrpcReferenceAttributeMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceMutations_pb.ts'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import {
    DelegatingAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/DelegatingAttributeMutationConverter.ts'

export class ReferenceAttributeMutationConverter implements LocalMutationConverter<ReferenceAttributeMutation, GrpcReferenceAttributeMutation> {
    public static readonly INSTANCE = new ReferenceAttributeMutationConverter()

    convert(mutation: GrpcReferenceAttributeMutation): ReferenceAttributeMutation {
        return new ReferenceAttributeMutation(
            new ReferenceKey(
                mutation.referenceName,
                mutation.referencePrimaryKey
            ),
            DelegatingAttributeMutationConverter.convert(mutation.attributeMutation)
        )
    }
}
