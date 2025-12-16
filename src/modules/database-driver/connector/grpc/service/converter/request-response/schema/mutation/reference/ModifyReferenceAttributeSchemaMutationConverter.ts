import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import {
    ModifyReferenceAttributeSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReferenceAttributeSchemaMutation.ts'
import type {
    GrpcModifyReferenceAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import {
    DelegatingAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/DelegatingAttributeSchemaMutationConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'

export class ModifyReferenceAttributeSchemaMutationConverter implements SchemaMutationConverter<ModifyReferenceAttributeSchemaMutation, GrpcModifyReferenceAttributeSchemaMutation> {
    public static readonly INSTANCE = new ModifyReferenceAttributeSchemaMutationConverter()

    convert(mutation: GrpcModifyReferenceAttributeSchemaMutation): ModifyReferenceAttributeSchemaMutation {

        if (mutation.attributeSchemaMutation != undefined) {
            throw new UnexpectedError("Attribute Schema cannot be undefined");
        }

        return new ModifyReferenceAttributeSchemaMutation(
            mutation.name,
            DelegatingAttributeSchemaMutationConverter.convert(mutation.attributeSchemaMutation)
        )
    }
}
