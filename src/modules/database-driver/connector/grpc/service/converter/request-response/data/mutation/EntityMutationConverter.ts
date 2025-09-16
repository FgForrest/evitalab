import type { Message } from '@bufbuild/protobuf'
import type {
    MutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/MutationConverter.ts'
import type { EntityMutation } from '@/modules/database-driver/request-response/data/mutation/EntityMutation.ts'

export interface EntityMutationConverter<J extends EntityMutation, G extends Message> extends MutationConverter<J, G> {
}
