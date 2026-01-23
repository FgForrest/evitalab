import { UnexpectedError } from '@/modules/base/exception/UnexpectedError.ts'
import type {
    GrpcSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/gen/GrpcSortableAttributeCompoundSchemaMutations_pb.ts'

import {
    CreateSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/CreateSortableAttributeCompoundSchemaMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaDescriptionMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.ts'
import {
    ModifySortableAttributeCompoundSchemaNameMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ModifySortableAttributeCompoundSchemaNameMutationConverter.ts'
import {
    RemoveSortableAttributeCompoundSchemaMutationConverter
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/RemoveSortableAttributeCompoundSchemaMutationConverter.ts'
import type {
    ReferenceSortableAttributeCompoundSchemaMutation
} from '@/modules/database-driver/connector/grpc/service/converter/request-response/schema/mutation/sortableAttributeCompound/ReferenceSortableAttributeCompoundSchemaMutation.ts'
import type {
    SchemaMutationConverter
} from '@/modules/database-driver/request-response/schema/mutation/SchemaMutationConverter.ts'
import type { SchemaMutation } from '@/modules/database-driver/request-response/schema/mutation/SchemaMutation.ts'
import type { Message } from '@bufbuild/protobuf'

export class DelegatingSortableAttributeCompoundSchemaMutationConverter {

    private static readonly TO_TYPESCRIPT_CONVERTERS = new Map<string, SchemaMutationConverter<SchemaMutation, Message>>([
        ['createSortableAttributeCompoundSchemaMutation',
            CreateSortableAttributeCompoundSchemaMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaDeprecationNoticeMutation',
            ModifySortableAttributeCompoundSchemaDeprecationNoticeMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaDescriptionMutation',
            ModifySortableAttributeCompoundSchemaDescriptionMutationConverter.INSTANCE
        ],
        ['modifySortableAttributeCompoundSchemaNameMutation',
            ModifySortableAttributeCompoundSchemaNameMutationConverter.INSTANCE
        ],
        ['removeSortableAttributeCompoundSchemaMutation',
            RemoveSortableAttributeCompoundSchemaMutationConverter.INSTANCE
        ],

    ])

    static convert(mutation: GrpcSortableAttributeCompoundSchemaMutation | undefined): ReferenceSortableAttributeCompoundSchemaMutation {
        if (!mutation?.mutation?.case) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation?.mutation.case)
        }

        const converter = DelegatingSortableAttributeCompoundSchemaMutationConverter.TO_TYPESCRIPT_CONVERTERS.get(mutation.mutation.case)
        if (!converter) {
            throw new UnexpectedError('Unknown mutation type: ' + mutation.mutation.case)
        }

        return converter.convert(mutation.mutation.value)
    }
}

