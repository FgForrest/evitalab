import {
    InsertReferenceMutation
} from '@/modules/database-driver/request-response/data/mutation/reference/InsertReferenceMutation.ts'
import type {
    LocalMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/LocalMutationConverter.ts'
import type {
    GrpcInsertReferenceMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceMutations_pb.ts'
import { ReferenceKey } from '@/modules/database-driver/request-response/data/mutation/reference/ReferenceKey.ts'
import {
    CardinalityConvertor
} from '@/modules/database-driver/connector/grpc/service/converter/CardinalityConvertor.ts'

export class InsertReferenceMutationConverter implements LocalMutationConverter<InsertReferenceMutation, GrpcInsertReferenceMutation> {

    convert(mutation: GrpcInsertReferenceMutation): InsertReferenceMutation {
        return new InsertReferenceMutation(
            new ReferenceKey(
                mutation.referenceName,
                mutation.referencePrimaryKey
            ),
            CardinalityConvertor.convertCardinality(mutation.referenceCardinality),
            mutation.referencedEntityType
        )
    }
}
