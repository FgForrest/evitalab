import type { Message } from '@bufbuild/protobuf'
import type { Mutation } from '@/modules/database-driver/request-response/Mutation.ts'
import type {
    MutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/mutation/MutationConverter.ts'

/**
 * Registry of converters a delegating converter dispatches to, keyed by the name of the gRPC `oneof`
 * case the converter handles.
 *
 * The input message type is erased to {@link Message}: each entry accepts only its own branch of the
 * `oneof`, which the key alone cannot express, and the delegating converter has already narrowed the
 * value by that key before handing it over. The produced mutation type stays exact, so a delegating
 * converter still returns what its own signature promises.
 */
export type MutationConverterRegistry<J extends Mutation> = Map<string, MutationConverter<J, Message>>

/**
 * Builds a {@link MutationConverterRegistry}. The produced mutation type has to be passed explicitly,
 * otherwise it would be inferred from the first entry and the remaining converters would be rejected
 * as incompatible with it.
 */
export function mutationConverterRegistry<J extends Mutation>(
    entries: readonly (readonly [string, MutationConverter<J, Message>])[]
): MutationConverterRegistry<J> {
    return new Map(entries)
}
