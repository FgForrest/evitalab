import {
    ModifyReflectedReferenceAttributeInheritanceSchemaMutation
} from '@/modules/database-driver/request-response/schema/mutation/reference/ModifyReflectedReferenceAttributeInheritanceSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type {
    GrpcModifyReflectedReferenceAttributeInheritanceSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcReferenceSchemaMutations_pb.ts'
import { List as ImmutableList } from 'immutable'
import {
    CatalogSchemaConverter
} from '@/modules/database-driver/connector/grpc/service/converter/CatalogSchemaConverter.ts'

export class ModifyReflectedReferenceAttributeInheritanceSchemaMutationConverter implements SchemaMutationConverter<ModifyReflectedReferenceAttributeInheritanceSchemaMutation, GrpcModifyReflectedReferenceAttributeInheritanceSchemaMutation> {
    public static readonly INSTANCE = new ModifyReflectedReferenceAttributeInheritanceSchemaMutationConverter()

    convert(mutation: GrpcModifyReflectedReferenceAttributeInheritanceSchemaMutation): ModifyReflectedReferenceAttributeInheritanceSchemaMutation {
        return new ModifyReflectedReferenceAttributeInheritanceSchemaMutation(
            mutation.name,
            CatalogSchemaConverter.convertAttributeInheritanceBehavior(mutation.attributeInheritanceBehavior),
            ImmutableList(mutation.attributeInheritanceFilter)
        )
    }
}
