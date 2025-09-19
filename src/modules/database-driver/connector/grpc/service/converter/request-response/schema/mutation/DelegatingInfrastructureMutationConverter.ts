import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    TransactionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/engine/TransactionMutationConverter.ts'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import type {
    GrpcInfrastructureMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcInfrastrutureMutation_pb.ts'


function getKeyFromConverterName(converter: any): string {
    // Handle both class constructors and instances
    const name = typeof converter === 'function' ? converter.name : converter.constructor.name;

    return name
        .replace(/Converter$/, '') // Remove 'Converter' suffix
        .replace(/([A-Z])/g, (match: string, p1: string, offset: number) =>
            offset === 0 ? p1.toLowerCase() : p1
        ); // Convert first letter to lowercase, keep others as-is
}

export class DelegatingInfrastructureMutationConverter {


    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>(
        [
            TransactionMutationConverter.INSTANCE,
        ].map(converter => [getKeyFromConverterName(converter), converter])
    );

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

