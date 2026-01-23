import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    TransactionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/TransactionMutationConverter.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import type {
    GrpcInfrastructureMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcInfrastrutureMutation_pb.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { Message } from '@bufbuild/protobuf'

export class DelegatingInfrastructureMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, SchemaMutationConverter<SchemaMutation, Message>>([
        ['transactionMutation', TransactionMutationConverter.INSTANCE]
    ]);

    static convert(mutation: GrpcInfrastructureMutation | undefined): Mutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingInfrastructureMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

