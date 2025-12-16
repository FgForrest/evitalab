import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    AttributeMutation
} from '@/modules/database-driver/request-response/data/mutation/attribute/AttributeMutation.ts'
import type { GrpcAttributeMutation } from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeMutations_pb.ts'
import {
    ApplyDeltaAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/ApplyDeltaAttributeMutationConverter.ts'
import {
    UpsertAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/UpsertAttributeMutationConverter.ts'
import {
    RemoveAttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/RemoveAttributeMutationConverter.ts'
import {
    AttributeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/data/mutation/attribute/AttributeMutationConverter.ts'
import type { Message } from '@bufbuild/protobuf'

export class DelegatingAttributeMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, AttributeMutationConverter<AttributeMutation, Message>>([
        ['applyDeltaAttributeMutation', ApplyDeltaAttributeMutationConverter.INSTANCE],
        ['upsertAttributeMutation', UpsertAttributeMutationConverter.INSTANCE],
        ['removeAttributeMutation', RemoveAttributeMutationConverter.INSTANCE]
    ])

    static convert(mutation: GrpcAttributeMutation | undefined): AttributeMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingAttributeMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}
