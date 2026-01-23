import {
    CreateAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/CreateAttributeSchemaMutationConverter.ts'
import {
    ModifyAttributeSchemaDefaultValueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDefaultValueMutationConverter.ts'
import {
    ModifyAttributeSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifyAttributeSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaNameMutationConverter.ts'
import {
    ModifyAttributeSchemaTypeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaTypeMutationConverter.ts'
import {
    RemoveAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/RemoveAttributeSchemaMutationConverter.ts'
import {
    SetAttributeSchemaFilterableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaFilterableMutationConverter.ts'
import {
    SetAttributeSchemaLocalizedMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaLocalizedMutationConverter.ts'
import {
    SetAttributeSchemaNullableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaNullableMutationConverter.ts'
import {
    SetAttributeSchemaRepresentativeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaRepresentativeMutationConverter.ts'
import {
    SetAttributeSchemaSortableMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaSortableMutationConverter.ts'
import {
    SetAttributeSchemaUniqueMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/SetAttributeSchemaUniqueMutationConverter.ts'
import {
    UseGlobalAttributeSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/UseGlobalAttributeSchemaMutationConverter.ts'
import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import {
    ModifyAttributeSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/attribute/ModifyAttributeSchemaDescriptionMutationConverter.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'
import type {
    SortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/SortableAttributeCompoundSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { Message } from '@bufbuild/protobuf'

export class DelegatingAttributeSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, SchemaMutationConverter<SchemaMutation, Message>>([
        ['createAttributeSchemaMutation',
            CreateAttributeSchemaMutationConverter.INSTANCE
        ],
        ['modifyAttributeSchemaDefaultValueMutation',
            ModifyAttributeSchemaDefaultValueMutationConverter.INSTANCE
        ],
        ['modifyAttributeSchemaDeprecationNoticeMutation',
            ModifyAttributeSchemaDeprecationNoticeMutationConverter.INSTANCE
        ],
        ['modifyAttributeSchemaDescriptionMutation',
            ModifyAttributeSchemaDescriptionMutationConverter.INSTANCE
        ],
        ['modifyAttributeSchemaNameMutation',
            ModifyAttributeSchemaNameMutationConverter.INSTANCE
        ],
        ['modifyAttributeSchemaTypeMutation',
            ModifyAttributeSchemaTypeMutationConverter.INSTANCE
        ],
        ['removeAttributeSchemaMutation',
            RemoveAttributeSchemaMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaFilterableMutation',
            SetAttributeSchemaFilterableMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaLocalizedMutation',
            SetAttributeSchemaLocalizedMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaNullableMutation',
            SetAttributeSchemaNullableMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaRepresentativeMutation',
            SetAttributeSchemaRepresentativeMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaSortableMutation',
            SetAttributeSchemaSortableMutationConverter.INSTANCE
        ],
        ['setAttributeSchemaUniqueMutation',
            SetAttributeSchemaUniqueMutationConverter.INSTANCE
        ],
        ['useGlobalAttributeSchemaMutation',
            UseGlobalAttributeSchemaMutationConverter.INSTANCE
        ]
    ])

    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation|undefined): SortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingAttributeSchemaMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

