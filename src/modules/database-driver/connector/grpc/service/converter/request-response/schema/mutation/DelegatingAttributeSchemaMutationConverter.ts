import type {
    GrpcAttributeSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcAttributeSchemaMutations_pb.ts'
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


export class DelegatingAttributeSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, any>([ // todo pfi: replace any
        ['createAttributeSchemaMutation',
            CreateAttributeSchemaMutationConverter
        ],
        ['modifyAttributeSchemaDefaultValueMutation',
            ModifyAttributeSchemaDefaultValueMutationConverter
        ],
        ['modifyAttributeSchemaDeprecationNoticeMutation',
            ModifyAttributeSchemaDeprecationNoticeMutationConverter
        ],
        ['modifyAttributeSchemaDescriptionMutation',
            ModifyAttributeSchemaDescriptionMutationConverter
        ],
        ['modifyAttributeSchemaNameMutation',
            ModifyAttributeSchemaNameMutationConverter
        ],
        ['modifyAttributeSchemaTypeMutation',
            ModifyAttributeSchemaTypeMutationConverter
        ],
        ['removeAttributeSchemaMutation',
            RemoveAttributeSchemaMutationConverter
        ],
        ['setAttributeSchemaFilterableMutation',
            SetAttributeSchemaFilterableMutationConverter
        ],
        ['setAttributeSchemaLocalizedMutation',
            SetAttributeSchemaLocalizedMutationConverter
        ],
        ['setAttributeSchemaNullableMutation',
            SetAttributeSchemaNullableMutationConverter
        ],
        ['setAttributeSchemaRepresentativeMutation',
            SetAttributeSchemaRepresentativeMutationConverter
        ],
        ['setAttributeSchemaSortableMutation',
            SetAttributeSchemaSortableMutationConverter
        ],
        ['setAttributeSchemaUniqueMutation',
            SetAttributeSchemaUniqueMutationConverter
        ],
        ['useGlobalAttributeSchemaMutation',
            UseGlobalAttributeSchemaMutationConverter
        ]
    ])

    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation|undefined): SortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const conversionDescriptor = this.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!conversionDescriptor) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return mutation.mutation.value
    }
}

