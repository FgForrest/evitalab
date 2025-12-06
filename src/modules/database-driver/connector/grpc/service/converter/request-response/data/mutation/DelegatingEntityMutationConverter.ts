import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type { GrpcEntityMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcEntityMutation_pb.ts'
import type { EntityMutation } from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'
import {
    EntityUpsertMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityUpsertMutationConverter.ts'
import {
    EntityRemoveMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/EntityRemoveMutationConverter.ts'

export class DelegatingEntityMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>([
        ['entityUpsertMutation', EntityUpsertMutationConverter.INSTANCE],
        ['entityRemoveMutation', EntityRemoveMutationConverter.INSTANCE]
    ]);

    static convert(mutation: GrpcEntityMutation | undefined): EntityMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingEntityMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }

}

