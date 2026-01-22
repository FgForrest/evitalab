import type { LocalMutation } from '@/modules/database-driver/request-response/data/mutation/LocalMutation.ts'
import type { Message } from '@bufbuild/protobuf'
import type {
    MutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/MutationConverter.ts'

/**
 * Ancestor for all converters converting implementations of {@link LocalMutation}.
 *
 * @author Lukáš Hornych, FG Forrest a.s. (c) 2023
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface LocalMutationConverter<J extends LocalMutation, G extends Message> extends MutationConverter<J, G> {
}
