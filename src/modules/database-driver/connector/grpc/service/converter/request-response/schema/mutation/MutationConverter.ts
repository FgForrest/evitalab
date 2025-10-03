import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import type { Message } from '@bufbuild/protobuf'

export interface MutationConverter<J extends Mutation, G extends Message> {

    /**
     * Converts gRPC mutation into core Evita's equivalent.
     */
     convert(mutation: G): J;
}
