import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    SetAttributeSchemaNullableMutation
} from '@/modules/database-driver/request-response/schema/mutation/attribute/SetAttributeSchemaNullableMutation.ts'
import type {
    GrpcSetAttributeSchemaNullableMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'

export class SetAttributeSchemaNullableMutationConverter implements SchemaMutationConverter<SetAttributeSchemaNullableMutation, GrpcSetAttributeSchemaNullableMutation> {

    convert(mutation: GrpcSetAttributeSchemaNullableMutation): SetAttributeSchemaNullableMutation {
        return new SetAttributeSchemaNullableMutation(
            mutation.name,
            mutation.nullable
        )
    }
}
