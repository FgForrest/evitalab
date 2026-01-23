import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { Message } from '@bufbuild/protobuf'
import type {
    MutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/MutationConverter.ts'

/**
 * Marker interface for schema mutation converters.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SchemaMutationConverter<J extends SchemaMutation, G extends Message> extends MutationConverter<J, G> {}
